import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

function createContext(user: { role: Role } | undefined): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when the route has no @Roles requirement', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(createContext({ role: Role.USER }))).toBe(true);
  });

  it('allows access when the user role matches a required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    expect(guard.canActivate(createContext({ role: Role.ADMIN }))).toBe(true);
  });

  it('blocks USER accounts from ADMIN-only endpoints with ForbiddenException', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    expect(() => guard.canActivate(createContext({ role: Role.USER }))).toThrow(ForbiddenException);
  });

  it('blocks ADMIN accounts from USER-only endpoints with ForbiddenException', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.USER]);

    expect(() => guard.canActivate(createContext({ role: Role.ADMIN }))).toThrow(ForbiddenException);
  });
});
