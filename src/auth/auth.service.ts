import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { hashToken } from '../common/utils/secure-token.util';
import { parseDurationMs } from '../common/utils/duration.util';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.admin.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    const admin = await this.prisma.admin.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
      },
    });

    this.logger.log(`New admin registered: ${admin.email}`);

    const tokens = await this.issueTokenPair(admin.id, admin.email);
    return { admin: this.sanitizeAdmin(admin), tokens };
  }

  async login(dto: LoginDto) {
    const admin = await this.prisma.admin.findUnique({ where: { email: dto.email } });
    if (!admin) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const valid = await argon2.verify(admin.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    this.logger.log(`Admin logged in: ${admin.email}`);

    const tokens = await this.issueTokenPair(admin.id, admin.email);
    return { admin: this.sanitizeAdmin(admin), tokens };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string; jti: string; type: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type.');
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { adminId: payload.sub, tokenHash },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has been revoked or expired.');
    }

    const admin = await this.prisma.admin.findUnique({ where: { id: payload.sub } });
    if (!admin) {
      throw new UnauthorizedException('Admin account no longer exists.');
    }

    // Rotate: revoke the used refresh token, issue a brand new pair.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true, revokedAt: new Date() },
    });

    const tokens = await this.issueTokenPair(admin.id, admin.email);
    return { admin: this.sanitizeAdmin(admin), tokens };
  }

  async logout(adminId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { adminId, tokenHash, revoked: false },
        data: { revoked: true, revokedAt: new Date() },
      });
    } else {
      // No specific token supplied: revoke all active sessions for this admin.
      await this.prisma.refreshToken.updateMany({
        where: { adminId, revoked: false },
        data: { revoked: true, revokedAt: new Date() },
      });
    }
    return { message: 'Logged out successfully.' };
  }

  async me(adminId: string) {
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) {
      throw new UnauthorizedException('Admin account no longer exists.');
    }
    return this.sanitizeAdmin(admin);
  }

  private async issueTokenPair(adminId: string, email: string): Promise<TokenPair> {
    const accessExpiresIn = this.config.get<string>('jwt.accessExpiresIn')!;
    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn')!;

    const accessToken = await this.jwt.signAsync(
      { sub: adminId, email, type: 'access' },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: accessExpiresIn,
      },
    );

    const jti = uuid();
    const refreshToken = await this.jwt.signAsync(
      { sub: adminId, email, type: 'refresh', jti },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: refreshExpiresIn,
      },
    );

    const expiresAt = new Date(Date.now() + parseDurationMs(refreshExpiresIn));
    await this.prisma.refreshToken.create({
      data: {
        adminId,
        tokenHash: hashToken(refreshToken),
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: Math.floor(parseDurationMs(accessExpiresIn) / 1000),
    };
  }

  private sanitizeAdmin(admin: { id: string; name: string; email: string; createdAt: Date }) {
    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      createdAt: admin.createdAt,
    };
  }
}
