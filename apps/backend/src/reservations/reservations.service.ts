import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ReservationAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Reserves a single seat for the user on the given concert.
   *
   * Concurrency safety: the concert row is locked with `SELECT ... FOR UPDATE`
   * inside a transaction so that concurrent reservation attempts on the same
   * concert are serialized at the database level — the seat count check and
   * the insert happen atomically, preventing over-booking races. The unique
   * constraint on (userId, concertId) is a second line of defence against
   * double-booking by the same user.
   */
  async reserve(userId: string, concertId: string) {
    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string; name: string; totalSeats: number }>>`
        SELECT "id", "name", "totalSeats" FROM "Concert" WHERE "id" = ${concertId} FOR UPDATE
      `;
      const concert = locked[0];
      if (!concert) {
        throw new NotFoundException('Concert not found');
      }

      const existing = await tx.reservation.findUnique({
        where: { userId_concertId: { userId, concertId } },
      });
      if (existing) {
        throw new ConflictException('You already have a reservation for this concert');
      }

      const reservedCount = await tx.reservation.count({ where: { concertId } });
      if (reservedCount >= concert.totalSeats) {
        throw new ConflictException('This concert is fully booked');
      }

      const reservation = await tx.reservation.create({ data: { userId, concertId } });

      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      await tx.reservationLog.create({
        data: {
          userId,
          username: user.name,
          concertId,
          concertName: concert.name,
          action: ReservationAction.RESERVE,
        },
      });

      return reservation;
    });
  }

  async cancel(userId: string, concertId: string) {
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { userId_concertId: { userId, concertId } },
      });
      if (!reservation) {
        throw new NotFoundException('You do not have a reservation for this concert');
      }

      const [concert, user] = await Promise.all([
        tx.concert.findUniqueOrThrow({ where: { id: concertId } }),
        tx.user.findUniqueOrThrow({ where: { id: userId } }),
      ]);

      await tx.reservation.delete({ where: { id: reservation.id } });
      await tx.reservationLog.create({
        data: {
          userId,
          username: user.name,
          concertId,
          concertName: concert.name,
          action: ReservationAction.CANCEL,
        },
      });

      return { concertId };
    });
  }

  async findHistoryForUser(userId: string) {
    return this.prisma.reservationLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllHistory() {
    return this.prisma.reservationLog.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
