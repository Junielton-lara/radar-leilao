import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  const usersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    toPublic: jest.fn((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
    })),
  };

  const prisma = {
    auditLog: { create: jest.fn() },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('access-token'),
  };

  const config = {
    get: jest.fn((key: string, fallback?: string) => {
      if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
      return fallback;
    }),
    getOrThrow: jest.fn((key: string) => {
      if (key === 'JWT_ACCESS_SECRET') return 'test-secret';
      throw new Error(key);
    }),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      usersService as never,
      prisma as never,
      jwtService as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  it('rejects invalid login', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    await expect(
      service.login({ email: 'a@b.com', password: 'password1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('issues access and refresh tokens on valid login', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'u1',
      name: 'Admin',
      email: 'admin@lancex.app',
      role: 'ADMIN',
      status: 'ACTIVE',
      passwordHash: 'hashed',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      email: 'admin@lancex.app',
      password: 'password1',
    });

    expect(result.tokens.accessToken).toBe('access-token');
    expect(result.tokens.refreshToken).toHaveLength(96);
    expect(prisma.refreshToken.create).toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });
});
