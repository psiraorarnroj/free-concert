import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConcertDto } from './dto/create-concert.dto';

@Injectable()
export class ConcertsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateConcertDto) {
    return this.prisma.concert.create({ data: dto });
  }

  async remove(id: string) {
    const concert = await this.prisma.concert.findUnique({ where: { id } });
    if (!concert) {
      throw new NotFoundException('Concert not found');
    }
    await this.prisma.concert.delete({ where: { id } });
    return { id };
  }

  /**
   * Lists every concert (including fully booked ones, per spec) annotated
   * with seat availability and whether the requesting user already holds a seat.
   */
  async findAllForUser(userId: string) {
    const [concerts, myReservations] = await Promise.all([
      this.prisma.concert.findMany({
        include: { _count: { select: { reservations: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.reservation.findMany({
        where: { userId },
        select: { concertId: true },
      }),
    ]);

    const reservedConcertIds = new Set(myReservations.map((r) => r.concertId));

    return concerts.map((concert) => ({
      id: concert.id,
      name: concert.name,
      description: concert.description,
      totalSeats: concert.totalSeats,
      reservedCount: concert._count.reservations,
      availableSeats: concert.totalSeats - concert._count.reservations,
      isReservedByMe: reservedConcertIds.has(concert.id),
    }));
  }
}
