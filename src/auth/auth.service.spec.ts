import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    admin: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    refreshToken: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };

  const config = {
    'jwt.accessSecret': 'test-access-secret',
    'jwt.refreshSecret': 'test-refresh-secret',
    'jwt.accessExpiresIn': '15m',
    'jwt.refreshExpiresIn': '7d',
  };

  beforeEach(async () => {
    prisma = {
      admin: { findUnique: jest.fn(), create: jest.fn() },
      refreshToken: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({}), ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: { get: (key: string) => (config as any)[key] },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('rejects duplicate emails', async () => {
      prisma.admin.findUnique.mockResolvedValue({ id: '1', email: 'a@b.com' });
      await expect(
        service.register({ name: 'A', email: 'a@b.com', password: 'password123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('hashes the password and issues a token pair', async () => {
      prisma.admin.findUnique.mockResolvedValue(null);
      prisma.admin.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: '1', ...data, createdAt: new Date() }),
      );
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.register({
        name: 'Jane',
        email: 'jane@dev.com',
        password: 'password123',
      });

      expect(result.admin.email).toBe('jane@dev.com');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();

      const createCallArg = prisma.admin.create.mock.calls[0][0].data;
      expect(createCallArg.passwordHash).not.toBe('password123');
      expect(await argon2.verify(createCallArg.passwordHash, 'password123')).toBe(true);
    });
  });

  describe('login', () => {
    it('rejects an unknown email without revealing which check failed', async () => {
      prisma.admin.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: 'nobody@dev.com', password: 'whatever' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an incorrect password', async () => {
      const passwordHash = await argon2.hash('correct-password', { type: argon2.argon2id });
      prisma.admin.findUnique.mockResolvedValue({
        id: '1',
        email: 'jane@dev.com',
        passwordHash,
        name: 'Jane',
        createdAt: new Date(),
      });
      await expect(
        service.login({ email: 'jane@dev.com', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('succeeds and issues tokens for a correct password', async () => {
      const passwordHash = await argon2.hash('correct-password', { type: argon2.argon2id });
      prisma.admin.findUnique.mockResolvedValue({
        id: '1',
        email: 'jane@dev.com',
        passwordHash,
        name: 'Jane',
        createdAt: new Date(),
      });
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({ email: 'jane@dev.com', password: 'correct-password' });
      expect(result.tokens.accessToken).toBeDefined();
    });
  });

  describe('refresh', () => {
    it('rotates the refresh token: old token is revoked and cannot be reused', async () => {
      prisma.admin.findUnique.mockResolvedValue({
        id: '1',
        email: 'jane@dev.com',
        name: 'Jane',
        createdAt: new Date(),
      });
      prisma.refreshToken.create.mockResolvedValue({});

      // Simulate login to get a real, correctly-signed refresh token.
      const passwordHash = await argon2.hash('pw', { type: argon2.argon2id });
      prisma.admin.findUnique.mockResolvedValueOnce({
        id: '1',
        email: 'jane@dev.com',
        passwordHash,
        name: 'Jane',
        createdAt: new Date(),
      });
      const loginResult = await service.login({ email: 'jane@dev.com', password: 'pw' });

      prisma.refreshToken.findFirst.mockResolvedValue({
        id: 'rt-1',
        revoked: false,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });
      prisma.refreshToken.update.mockResolvedValue({});

      const refreshed = await service.refresh(loginResult.tokens.refreshToken);

      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rt-1' } }),
      );
      expect(refreshed.tokens.refreshToken).not.toBe(loginResult.tokens.refreshToken);
    });

    it('rejects a refresh token that has already been revoked', async () => {
      const jwt = (service as any).jwt as JwtService;
      const token = await jwt.signAsync(
        { sub: '1', email: 'jane@dev.com', type: 'refresh', jti: 'x' },
        { secret: config['jwt.refreshSecret'], expiresIn: '7d' },
      );
      prisma.refreshToken.findFirst.mockResolvedValue({
        id: 'rt-1',
        revoked: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });

      await expect(service.refresh(token)).rejects.toThrow(UnauthorizedException);
    });
  });
});
