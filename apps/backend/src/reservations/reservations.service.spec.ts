import { ConflictException, NotFoundException } from '@nestjs/common';
import { ReservationAction } from '@prisma/client';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../prisma/prisma.service';

type MockTx = {
  $queryRaw: jest.Mock;
  reservation: {
    findUnique: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
  };
  user: { findUniqueOrThrow: jest.Mock };
  concert: { findUniqueOrThrow: jest.Mock };
  reservationLog: { create: jest.Mock };
};

function createMockTx(): MockTx {
  return {
    $queryRaw: jest.fn(),
    reservation: {
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    user: { findUniqueOrThrow: jest.fn() },
    concert: { findUniqueOrThrow: jest.fn() },
    reservationLog: { create: jest.fn() },
  };
}

describe('ReservationsService', () => {
  let service: ReservationsService;
  let tx: MockTx;
  let prisma: {
    $transaction: jest.Mock;
    reservationLog: { findMany: jest.Mock };
  };

  const userId = 'user-1';
  const concertId = 'concert-1';
  const concert = { id: concertId, name: 'Mini Fest', totalSeats: 2 };
  const user = { id: userId, name: 'John User' };

  beforeEach(() => {
    tx = createMockTx();
    prisma = {
      $transaction: jest.fn((cb: (tx: MockTx) => unknown) => cb(tx)),
      reservationLog: { findMany: jest.fn() },
    };

    service = new ReservationsService(prisma as unknown as PrismaService);
  });

  describe('reserve', () => {
    it('creates a reservation and logs it when a seat is available', async () => {
      tx.$queryRaw.mockResolvedValue([concert]);
      tx.reservation.findUnique.mockResolvedValue(null);
      tx.reservation.count.mockResolvedValue(0);
      tx.reservation.create.mockResolvedValue({ id: 'res-1', userId, concertId });
      tx.user.findUniqueOrThrow.mockResolvedValue(user);

      const result = await service.reserve(userId, concertId);

      expect(result).toEqual({ id: 'res-1', userId, concertId });
      expect(tx.reservation.create).toHaveBeenCalledWith({ data: { userId, concertId } });
      expect(tx.reservationLog.create).toHaveBeenCalledWith({
        data: {
          userId,
          username: user.name,
          concertId,
          concertName: concert.name,
          action: ReservationAction.RESERVE,
        },
      });
    });

    it('throws NotFoundException when the concert does not exist', async () => {
      tx.$queryRaw.mockResolvedValue([]);

      await expect(service.reserve(userId, concertId)).rejects.toBeInstanceOf(NotFoundException);
      expect(tx.reservation.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the user already has a reservation', async () => {
      tx.$queryRaw.mockResolvedValue([concert]);
      tx.reservation.findUnique.mockResolvedValue({ id: 'existing-res' });

      await expect(service.reserve(userId, concertId)).rejects.toBeInstanceOf(ConflictException);
      expect(tx.reservation.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the concert is fully booked (edge case)', async () => {
      tx.$queryRaw.mockResolvedValue([concert]);
      tx.reservation.findUnique.mockResolvedValue(null);
      tx.reservation.count.mockResolvedValue(concert.totalSeats);

      await expect(service.reserve(userId, concertId)).rejects.toBeInstanceOf(ConflictException);
      expect(tx.reservation.create).not.toHaveBeenCalled();
      expect(tx.reservationLog.create).not.toHaveBeenCalled();
    });

    it('locks the concert row with SELECT ... FOR UPDATE before checking availability', async () => {
      tx.$queryRaw.mockResolvedValue([concert]);
      tx.reservation.findUnique.mockResolvedValue(null);
      tx.reservation.count.mockResolvedValue(0);
      tx.reservation.create.mockResolvedValue({ id: 'res-1', userId, concertId });
      tx.user.findUniqueOrThrow.mockResolvedValue(user);

      await service.reserve(userId, concertId);

      expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
      const [sqlParts] = tx.$queryRaw.mock.calls[0] as [TemplateStringsArray];
      expect(sqlParts.join('')).toContain('FOR UPDATE');
    });
  });

  describe('cancel', () => {
    it('deletes the reservation and logs the cancellation', async () => {
      tx.reservation.findUnique.mockResolvedValue({ id: 'res-1', userId, concertId });
      tx.concert.findUniqueOrThrow.mockResolvedValue(concert);
      tx.user.findUniqueOrThrow.mockResolvedValue(user);

      const result = await service.cancel(userId, concertId);

      expect(result).toEqual({ concertId });
      expect(tx.reservation.delete).toHaveBeenCalledWith({ where: { id: 'res-1' } });
      expect(tx.reservationLog.create).toHaveBeenCalledWith({
        data: {
          userId,
          username: user.name,
          concertId,
          concertName: concert.name,
          action: ReservationAction.CANCEL,
        },
      });
    });

    it('throws NotFoundException when the user has no reservation to cancel', async () => {
      tx.reservation.findUnique.mockResolvedValue(null);

      await expect(service.cancel(userId, concertId)).rejects.toBeInstanceOf(NotFoundException);
      expect(tx.reservation.delete).not.toHaveBeenCalled();
    });
  });

  describe('history', () => {
    it('findHistoryForUser scopes the audit log to the given user', async () => {
      prisma.reservationLog.findMany.mockResolvedValue([]);

      await service.findHistoryForUser(userId);

      expect(prisma.reservationLog.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('findAllHistory returns the full audit trail with no user filter', async () => {
      prisma.reservationLog.findMany.mockResolvedValue([]);

      await service.findAllHistory();

      expect(prisma.reservationLog.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
