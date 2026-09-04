import { Injectable } from '@nestjs/common';
import { ActivityEventType, ActorType, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { buildPaginationMeta, PaginationQueryDto } from '../common/dto/pagination.dto';

export interface RecordActivityInput {
  projectId: string;
  eventType: ActivityEventType;
  description: string;
  actorType: ActorType;
  actorId?: string | null;
  metadata?: Record<string, any>;
}

type PrismaTx = Prisma.TransactionClient;

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an immutable activity entry. Accepts an optional transaction
   * client so callers can log activity atomically alongside other writes.
   */
  async record(input: RecordActivityInput, tx?: PrismaTx) {
    const client = tx ?? this.prisma;
    return client.projectActivity.create({
      data: {
        projectId: input.projectId,
        eventType: input.eventType,
        description: input.description,
        actorType: input.actorType,
        actorId: input.actorId ?? null,
        metadata: input.metadata ?? Prisma.JsonNull,
      },
    });
  }

  async findForProject(projectId: string, query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.projectActivity.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.projectActivity.count({ where: { projectId } }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }
}
