import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

export interface JwtAccessPayload {
  sub: string;
  email: string;
  type: 'access';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret')!,
    });
  }

  async validate(payload: JwtAccessPayload) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type.');
    }
    const admin = await this.prisma.admin.findUnique({ where: { id: payload.sub } });
    if (!admin) {
      throw new UnauthorizedException('Admin account no longer exists.');
    }
    return { id: admin.id, email: admin.email };
  }
}
