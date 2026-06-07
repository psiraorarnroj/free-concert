import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  @Roles(Role.USER)
  @Post(':concertId')
  reserve(@CurrentUser() user: JwtPayload, @Param('concertId') concertId: string) {
    return this.reservationsService.reserve(user.sub, concertId);
  }

  @Roles(Role.USER)
  @Delete(':concertId')
  cancel(@CurrentUser() user: JwtPayload, @Param('concertId') concertId: string) {
    return this.reservationsService.cancel(user.sub, concertId);
  }

  @Roles(Role.USER)
  @Get('me')
  myHistory(@CurrentUser() user: JwtPayload) {
    return this.reservationsService.findHistoryForUser(user.sub);
  }

  @Roles(Role.ADMIN)
  @Get()
  allHistory() {
    return this.reservationsService.findAllHistory();
  }
}
