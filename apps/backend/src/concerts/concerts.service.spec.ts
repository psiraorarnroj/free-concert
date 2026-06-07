import { NotFoundException } from '@nestjs/common';
import { ConcertsService } from './concerts.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ConcertsService', () => {
  let service: ConcertsService;
  let prisma: {
    concert: { create: jest.Mock; findUnique: jest.Mock; delete: jest.Mock; findMany: jest.Mock };
    reservation: { findMany: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      concert: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
      reservation: { findMany: jest.fn() },
    };

    service = new ConcertsService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('persists a new concert with the given fields', async () => {
      const dto = { name: 'Mini Fest', description: 'A test concert', totalSeats: 100 };
      prisma.concert.create.mockResolvedValue({ id: 'concert-1', ...dto });

      const result = await service.create(dto);

      expect(prisma.concert.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual({ id: 'concert-1', ...dto });
    });
  });

  describe('remove', () => {
    it('deletes the concert when it exists', async () => {
      prisma.concert.findUnique.mockResolvedValue({ id: 'concert-1' });
      prisma.concert.delete.mockResolvedValue({ id: 'concert-1' });

      const result = await service.remove('concert-1');

      expect(prisma.concert.delete).toHaveBeenCalledWith({ where: { id: 'concert-1' } });
      expect(result).toEqual({ id: 'concert-1' });
    });

    it('throws NotFoundException when the concert does not exist', async () => {
      prisma.concert.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.concert.delete).not.toHaveBeenCalled();
    });
  });

  describe('findAllForUser', () => {
    it('annotates each concert with availability and the requesting user reservation status', async () => {
      prisma.concert.findMany.mockResolvedValue([
        {
          id: 'concert-1',
          name: 'Full Concert',
          description: 'desc',
          totalSeats: 2,
          createdAt: new Date(),
          _count: { reservations: 2 },
        },
        {
          id: 'concert-2',
          name: 'Open Concert',
          description: 'desc',
          totalSeats: 10,
          createdAt: new Date(),
          _count: { reservations: 3 },
        },
      ]);
      prisma.reservation.findMany.mockResolvedValue([{ concertId: 'concert-2' }]);

      const result = await service.findAllForUser('user-1');

      expect(result).toEqual([
        expect.objectContaining({
          id: 'concert-1',
          reservedCount: 2,
          availableSeats: 0,
          isReservedByMe: false,
        }),
        expect.objectContaining({
          id: 'concert-2',
          reservedCount: 3,
          availableSeats: 7,
          isReservedByMe: true,
        }),
      ]);
    });
  });
});
