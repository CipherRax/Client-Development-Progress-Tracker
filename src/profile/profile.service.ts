import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(adminId: string) {
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) {
      throw new NotFoundException('Admin not found.');
    }
    return this.sanitize(admin);
  }

  async updateProfile(adminId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const existing = await this.prisma.admin.findUnique({ where: { email: dto.email } });
      if (existing && existing.id !== adminId) {
        throw new ConflictException('This email is already in use by another account.');
      }
    }

    const admin = await this.prisma.admin.update({
      where: { id: adminId },
      data: { name: dto.name, email: dto.email },
    });

    return this.sanitize(admin);
  }

  async changePassword(adminId: string, dto: ChangePasswordDto) {
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) {
      throw new NotFoundException('Admin not found.');
    }

    const valid = await argon2.verify(admin.passwordHash, dto.currentPassword);
    if (!valid) {
      throw new BadRequestException('Current password is incorrect.');
    }

    const passwordHash = await argon2.hash(dto.newPassword, { type: argon2.argon2id });
    await this.prisma.admin.update({ where: { id: adminId }, data: { passwordHash } });

    // Revoke all existing sessions for security after a password change.
    await this.prisma.refreshToken.updateMany({
      where: { adminId, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });

    return { message: 'Password changed successfully. Please log in again.' };
  }

  private sanitize(admin: { id: string; name: string; email: string; createdAt: Date; updatedAt: Date }) {
    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }
}
