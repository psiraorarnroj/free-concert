# Free Concert Tickets — Assignment

Full-stack assignment: Next.js (frontend) + NestJS (backend) + PostgreSQL + Docker.
Source spec: `assignment/Full-stack developer assignment (Next.js + NestJS).pdf`
Figma screenshots: `assignment/User-ui.png`, `assignment/Admin-ui.png` (also PDFs)

## Hard rules — do not deviate
- Roles are exactly `ADMIN` and `USER` (enum values, uppercase). JWT payload must include the role.
- Concert fields: `name`, `description`, `totalSeats` (exactly these three on create).
- Reservation rule: strictly **1 seat per 1 user per concert**. Must prevent over-booking under concurrent requests (use DB transaction / row locking).
- Users can cancel their own reservation. Admin can view ALL users' reservation history (audit trail). Users can view only their OWN history.
- Admin can Create and Delete concerts only (no update per spec).
- Discovery: users must see ALL concerts including fully-booked ones.
- Validation via class-validator (NestJS-native), return 400 on bad input; frontend must catch and show via toast/inline errors.
- Do not invent extra fields, pages, or flows beyond the PDF + Figma screenshots — check the PNGs before building any UI screen.

## Structure
- `apps/backend` — NestJS + Prisma + PostgreSQL
- `apps/frontend` — Next.js + Tailwind
- `docker-compose.yml` — postgres + backend + frontend

## Workflow
- Commit at the end of each phase (small, scoped commits — never one giant final commit).
- Reference the Figma PNGs (`assignment/User-ui.png`, `assignment/Admin-ui.png`) directly when building each screen instead of guessing layout.
