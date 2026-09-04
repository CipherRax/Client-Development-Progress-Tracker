import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActivityEventType, ActorType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { ProjectsService } from '../projects/projects.service';
import { generateSecureToken, hashToken } from '../common/utils/secure-token.util';
import { GenerateClientAccessDto } from './dto/generate-client-access.dto';

@Injectable()
export class ClientAccessService {
  private readonly logger = new Logger(ClientAccessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly projectsService: ProjectsService,
    private readonly config: ConfigService,
  ) {}

  async generate(projectId: string, dto: GenerateClientAccessDto) {
    await this.projectsService.getProjectOrThrow(projectId);

    const existingActive = await this.prisma.clientAccess.findFirst({
      where: { projectId, active: true },
    });
    if (existingActive) {
      throw new ConflictException(
        'This project already has an active client-access link. Revoke it or use the regenerate endpoint to replace it.',
      );
    }

    const { access, rawToken } = await this.createAccessRecord(projectId, dto.expiresAt, true);

    return this.buildResponse(access, rawToken);
  }

  async list(projectId: string) {
    await this.projectsService.getProjectOrThrow(projectId);
    const records = await this.prisma.clientAccess.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        active: true,
        createdAt: true,
        revokedAt: true,
        lastAccessedAt: true,
        expiresAt: true,
        accessCount: true,
        // tokenHash intentionally never selected — never expose it, even to admins.
      },
    });
    return records;
  }

  async revoke(projectId: string) {
    const active = await this.prisma.clientAccess.findFirst({ where: { projectId, active: true } });
    if (!active) {
      throw new NotFoundException('No active client-access link found for this project.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.clientAccess.update({
        where: { id: active.id },
        data: { active: false, revokedAt: new Date() },
      });
      await this.activity.record(
        {
          projectId,
          eventType: ActivityEventType.CLIENT_ACCESS_REVOKED,
          description: 'Client access link revoked. The previous link no longer works.',
          actorType: ActorType.ADMIN,
        },
        tx,
      );
    });

    return { message: 'Client access revoked. The link no longer works.' };
  }

  async regenerate(projectId: string, dto: GenerateClientAccessDto) {
    await this.projectsService.getProjectOrThrow(projectId);

    return this.prisma.$transaction(async (tx) => {
      const active = await tx.clientAccess.findFirst({ where: { projectId, active: true } });
      if (active) {
        await tx.clientAccess.update({
          where: { id: active.id },
          data: { active: false, revokedAt: new Date() },
        });
      }

      const { access, rawToken } = await this.createAccessRecord(
        projectId,
        dto.expiresAt,
        true,
        tx,
      );

      await this.activity.record(
        {
          projectId,
          eventType: ActivityEventType.CLIENT_ACCESS_REGENERATED,
          description: 'Client access link regenerated. The previous link no longer works.',
          actorType: ActorType.ADMIN,
        },
        tx,
      );

      return this.buildResponse(access, rawToken);
    });
  }

  private async createAccessRecord(
    projectId: string,
    expiresAt: string | undefined,
    logCreation: boolean,
    tx?: any,
  ) {
    const client = tx ?? this.prisma;
    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);

    const access = await client.clientAccess.create({
      data: {
        projectId,
        tokenHash,
        active: true,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    });

    if (logCreation) {
      await this.activity.record(
        {
          projectId,
          eventType: ActivityEventType.CLIENT_ACCESS_CREATED,
          description: 'Client access link generated.',
          actorType: ActorType.ADMIN,
        },
        tx,
      );
    }

    return { access, rawToken };
  }

  private buildResponse(access: { createdAt: Date; expiresAt: Date | null }, rawToken: string) {
    const baseUrl = this.config.get<string>('clientPublicUrl');
    return {
      url: `${baseUrl}/${rawToken}`,
      token: rawToken,
      createdAt: access.createdAt,
      expiresAt: access.expiresAt,
    };
  }
}
