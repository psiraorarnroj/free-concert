# Free Concert Tickets

Full-stack assignment app — Next.js frontend + NestJS backend + PostgreSQL, fully containerized with Docker Compose.

## Project structure

```text
apps/backend    NestJS API (Prisma + PostgreSQL, JWT auth, class-validator)
apps/frontend   Next.js App Router (Tailwind CSS, React Context for auth)
docker-compose.yml
```

## Setup & run (Docker — recommended)

Requires Docker and Docker Compose.

```bash
git clone <repo-url>
cd free-concert
docker compose up --build
```

This starts three services:

- **postgres** — PostgreSQL 16, with a healthcheck so dependents wait for it to be ready
- **backend** — NestJS API on `http://localhost:3001` (runs `prisma migrate deploy` on boot, then starts the server)
- **frontend** — Next.js app on `http://localhost:3000`

No manual `.env` setup is required — `docker-compose.yml` provides sane development defaults for `DATABASE_URL`, `JWT_SECRET`, and `NEXT_PUBLIC_API_URL`. Override them via a root `.env` file if needed (see the `${VAR:-default}` placeholders in `docker-compose.yml`).

Once the containers are up, open `http://localhost:3000` and choose **User** or **Administrator** to register/login.

## Setup & run (local development, without Docker)

**1. Database** — start just Postgres via Docker:

```bash
docker compose up postgres -d
```

**2. Backend**

```bash
cd apps/backend
cp .env.example .env   # adjust if your Postgres credentials differ
npm install
npx prisma migrate deploy
npm run start:dev
```

The API runs on `http://localhost:3001`.

**3. Frontend**

```bash
cd apps/frontend
npm install
npm run dev
```

The app runs on `http://localhost:3000` and talks to the backend at `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3001`).

## Architecture overview

**Backend (`apps/backend`)** — NestJS with a standard Module → Controller → Service → DTO layering on top of Prisma:

- `auth/` — registration & login (bcrypt password hashing), JWT issuing (`role` embedded in the payload), Passport JWT strategy, and guards/decorators for route protection (`@Public`, `@Roles`, `JwtAuthGuard`, `RolesGuard`)
- `concerts/` — Admin-only create/delete, plus a discovery endpoint open to any authenticated user that annotates each concert with `reservedCount`, `availableSeats`, and `isReservedByMe`
- `reservations/` — the reservation/cancellation flow plus audit-trail endpoints (`GET /reservations/me` for a user's own history, `GET /reservations` for the admin's full audit trail)
- `prisma/` — a global `PrismaService`/`PrismaModule`
- Global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) turns class-validator failures into `400` responses; global `JwtAuthGuard` + `RolesGuard` (registered via `APP_GUARD`) enforce authentication and role checks on every route unless explicitly marked `@Public()`

Data model (Prisma, see `apps/backend/prisma/schema.prisma`): `User` (role `ADMIN | USER`), `Concert` (`name`, `description`, `totalSeats`), `Reservation` (unique on `[userId, concertId]` to enforce 1-seat-per-user-per-concert at the DB level), and an append-only `ReservationLog` that snapshots `username`/`concertName` at the time of the action so the audit trail survives later renames.

**Frontend (`apps/frontend`)** — Next.js App Router, client components, Tailwind CSS:

- `lib/api.ts` — typed fetch client and `ApiError` (carries HTTP status + class-validator messages)
- `lib/auth-context.tsx` — React Context that persists `{ token, user }` to `localStorage` and exposes `login`/`logout`
- `lib/use-require-role.ts` — redirects unauthenticated users to `/login` and routes users to their correct dashboard based on role
- `app/` — landing page (`/`), `login`/`signup` (role-aware via `?role=user|admin` query param), `user` (concert discovery + reserve/cancel), `admin` (stat cards + Overview/Create tabs + delete confirmation), `admin/history` (full audit trail table)
- Toasts (`react-hot-toast`) surface success/error feedback; `400` validation errors are parsed field-by-field and shown inline on forms

## Libraries

**Backend:** NestJS, Prisma + `@prisma/client` (PostgreSQL), Passport + `@nestjs/jwt` (JWT auth), `bcrypt`, `class-validator` / `class-transformer`, Jest (+ `ts-jest`) for unit tests.

**Frontend:** Next.js, React, Tailwind CSS v4, `react-hot-toast`.

## Running tests

Backend unit tests cover the reservation logic (including the over-booking edge case and the "already reserved" conflict), concert service, and the roles guard:

```bash
cd apps/backend
npm test            # run once
npm run test:cov    # with coverage
```

## Bonus: Theory & Strategy

### 1. Performance Optimization

If the dataset and traffic grew significantly, I'd approach it in layers, starting with the changes that give the biggest win for the least risk:

- **Database indexing & query shape** — The schema already has a unique index on `Reservation(userId, concertId)` (which doubles as the lookup index for "does this user already have a seat?"). At scale I'd add indexes on `Concert` for whatever the discovery page filters/sorts by (e.g. date, name) and on `ReservationLog(concertId)` / `ReservationLog(userId)` for fast audit-trail lookups, and replace the current "count reservations per concert on every list request" pattern with a denormalized counter column (`reservedCount` on `Concert`) updated transactionally alongside each reserve/cancel — turning an O(n) aggregate into an O(1) read.
- **Caching** — Concert discovery is read-heavy and changes infrequently relative to how often it's read, so it's a great candidate for a short-TTL cache (Redis, or HTTP caching headers/CDN edge caching for the `GET /concerts` response), invalidated on create/delete/reserve/cancel. Per-user data (reservations, history) is less cacheable but could still benefit from short-lived response caching keyed by user.
- **Pagination & selective loading** — `GET /concerts` and the audit-trail endpoints should move from "return everything" to cursor/offset pagination once the tables grow, so neither the DB nor the network payload grows unbounded.
- **CDN & static assets** — Next.js already supports static generation for the marketing/landing pages; serving those (and all built JS/CSS/image assets) from a CDN keeps the origin servers free to handle dynamic, authenticated traffic.
- **Horizontal scaling & connection pooling** — The backend is stateless (JWTs, no server-side sessions), so it can scale horizontally behind a load balancer. At higher concurrency I'd put a connection pooler (e.g. PgBouncer) in front of Postgres so many app instances don't exhaust DB connections, and consider read replicas for read-heavy endpoints like discovery and history.
- **Observability-driven tuning** — Before reaching for any of the above in production, I'd instrument the app (query timing, endpoint latency, cache hit rates) so optimization effort goes where the actual bottleneck is rather than where it's assumed to be.

### 2. Concurrency Control (preventing over-booking)

This is the core correctness requirement of the reservation flow, and it's already implemented and tested in `apps/backend/src/reservations/reservations.service.ts`.

**Strategy: pessimistic row-level locking inside a database transaction.** When a user reserves a seat, the service opens a Prisma `$transaction` and issues a raw `SELECT ... FROM "Concert" WHERE "id" = $1 FOR UPDATE`. This places an exclusive row lock on that concert row for the duration of the transaction — any other concurrent transaction trying to reserve a seat for the *same* concert has to wait until the first one commits or rolls back. Only once the lock is held does the service:

1. Re-check whether this user already has a reservation for this concert (`409 Conflict` if so — enforces 1-seat-per-user, and is also backed by a unique DB constraint on `[userId, concertId]` as a last line of defense),
2. Count current reservations and compare against `totalSeats` (`409 Conflict` if full),
3. Create the `Reservation` row and append a `ReservationLog` entry, all inside the same transaction.

Because the lock serializes access per-concert, two requests racing for the "last seat" can never both pass the capacity check and both insert — the second one always re-checks the count *after* acquiring the lock and sees the now-updated count. Reservations for *different* concerts aren't affected, since the lock is scoped to a single row, so throughput isn't bottlenecked globally.

I validated this empirically: firing 10 concurrent reservation requests at a concert with a single available seat produced exactly **one `201 Created`** and **nine `409 Conflict`** responses — no over-booking, no lost updates, no deadlocks.

**Why pessimistic locking over the alternatives, for this use case:**

- *Optimistic locking* (version columns + retry-on-conflict) avoids holding locks but means the bulk of the 1,000 competing requests would fail their compare-and-swap and need to retry — under extreme contention for a handful of seats, that produces a lot of wasted work and retry storms for very little throughput benefit, since virtually everyone is contending for the same hot row anyway.
- *Message queues* (serializing all reservation attempts through a single consumer) would also work and can be a good fit at very large scale or across services, but it adds infrastructure and operational complexity, plus latency (the user has to wait for their message to be processed asynchronously) that a simple row lock avoids for a system of this size.
- Given that contention is naturally scoped to "one concert's seat count" — a single row — `SELECT ... FOR UPDATE` inside a short transaction is the simplest mechanism that directly maps to the invariant we need to protect, with minimal added infrastructure and predictable behavior under load.

If this needed to scale to a much larger number of concurrently-reserving concerts/seats, the next step would be to shard the lock more finely (e.g. lock on a per-seat row rather than per-concert) or move to a queue-based reservation pipeline — but for "1 seat per user per concert" with realistic concert sizes, row-level locking is the right tradeoff between correctness, simplicity, and performance.
