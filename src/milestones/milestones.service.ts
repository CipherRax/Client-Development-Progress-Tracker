import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityEventType, ActorType, MilestoneStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { UpdateMilestoneStatusDto } from './dto/update-milestone-status.dto';
import { ReorderMilestonesDto } from './dto/reorder-milestones.dto';

@Injectable()
export class MilestonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(projectId: string, dto: CreateMilestoneDto) {
    await this.projectsService.getProjectOrThrow(projectId);

    let order = dto.order;
    if (order === undefined) {
      const last = await this.prisma.milestone.findFirst({
        where: { projectId },
        orderBy: { order: 'desc' },
      });
      order = (last?.order ?? -1) + 1;
    }

    const milestone = await this.prisma.$transaction(async (tx) => {
      const created = await tx.milestone.create({
        data: {
          projectId,
          title: dto.title,
          description: dto.description,
          order,
          weight: dto.weight ?? 0,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          estimatedCompletionDate: dto.estimatedCompletionDate
            ? new Date(dto.estimatedCompletionDate)
            : undefined,
          clientVisible: dto.clientVisible ?? true,
        },
      });

      await this.activity.record(
        {
          projectId,
          eventType: ActivityEventType.MILESTONE_CREATED,
          description: `Milestone "${created.title}" was created.`,
          actorType: ActorType.ADMIN,
          metadata: { milestoneId: created.id },
        },
        tx,
      );

      await this.projectsService.recalculateProjectProgress(projectId, tx);
      return created;
    });

    return milestone;
  }

  async findAllForProject(projectId: string) {
    await this.projectsService.getProjectOrThrow(projectId);
    return this.prisma.milestone.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
  }

  async findOne(id: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
    if (!milestone) {
      throw new NotFoundException('Milestone not found.');
    }
    return milestone;
  }

  async update(id: string, dto: UpdateMilestoneDto) {
    const milestone = await this.getMilestoneOrThrow(id);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.milestone.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description,
          order: dto.order,
          weight: dto.weight,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          estimatedCompletionDate: dto.estimatedCompletionDate
            ? new Date(dto.estimatedCompletionDate)
            : undefined,
          clientVisible: dto.clientVisible,
        },
      });

      await this.activity.record(
        {
          projectId: milestone.projectId,
          eventType: ActivityEventType.MILESTONE_UPDATED,
          description: `Milestone "${result.title}" was updated.`,
          actorType: ActorType.ADMIN,
          metadata: { milestoneId: id },
        },
        tx,
      );

      if (dto.weight !== undefined) {
        await this.projectsService.recalculateProjectProgress(milestone.projectId, tx);
      }

      return result;
    });

    return updated;
  }

  async updateStatus(id: string, dto: UpdateMilestoneStatusDto) {
    const milestone = await this.getMilestoneOrThrow(id);

    const becomingCompleted =
      dto.status === MilestoneStatus.COMPLETED && milestone.status !== MilestoneStatus.COMPLETED;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.milestone.update({
        where: { id },
        data: {
          status: dto.status,
          progressPercentage: becomingCompleted ? 100 : milestone.progressPercentage,
          completedAt: becomingCompleted ? new Date() : milestone.completedAt,
        },
      });

      await this.activity.record(
        {
          projectId: milestone.projectId,
          eventType: becomingCompleted
            ? ActivityEventType.MILESTONE_COMPLETED
            : ActivityEventType.MILESTONE_UPDATED,
          description: `Milestone "${result.title}" status changed from ${milestone.status} to ${dto.status}.`,
          actorType: ActorType.ADMIN,
          metadata: { milestoneId: id, from: milestone.status, to: dto.status },
        },
        tx,
      );

      await this.projectsService.recalculateProjectProgress(milestone.projectId, tx);
      return result;
    });

    return updated;
  }

  async reorder(projectId: string, dto: ReorderMilestonesDto) {
    await this.projectsService.getProjectOrThrow(projectId);

    const existing = await this.prisma.milestone.findMany({ where: { projectId } });
    const existingIds = new Set(existing.map((m) => m.id));

    if (
      dto.orderedMilestoneIds.length !== existing.length ||
      !dto.orderedMilestoneIds.every((id) => existingIds.has(id))
    ) {
      throw new BadRequestException(
        'orderedMilestoneIds must contain exactly the set of milestone IDs belonging to this project.',
      );
    }

    await this.prisma.$transaction(
      dto.orderedMilestoneIds.map((id, index) =>
        this.prisma.milestone.update({ where: { id }, data: { order: index } }),
      ),
    );

    return this.findAllForProject(projectId);
  }

  async remove(id: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: { _count: { select: { tasks: true } } },
    });
    if (!milestone) {
      throw new NotFoundException('Milestone not found.');
    }

    if (milestone._count.tasks > 0) {
      throw new ConflictException(
        'This milestone has tasks and cannot be deleted. Delete or reassign its tasks first.',
      );
    }
    if (milestone.status === MilestoneStatus.COMPLETED) {
      throw new ConflictException(
        'Completed milestones are part of project history and cannot be deleted.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.milestone.delete({ where: { id } });
      await this.activity.record(
        {
          projectId: milestone.projectId,
          eventType: ActivityEventType.MILESTONE_DELETED,
          description: `Milestone "${milestone.title}" was deleted.`,
          actorType: ActorType.ADMIN,
          metadata: { milestoneId: id },
        },
        tx,
      );
      await this.projectsService.recalculateProjectProgress(milestone.projectId, tx);
    });

    return { message: 'Milestone deleted.' };
  }

  async getMilestoneOrThrow(id: string) {
    const milestone = await this.prisma.milestone.findUnique({ where: { id } });
    if (!milestone) {
      throw new NotFoundException('Milestone not found.');
    }
    return milestone;
  }
}
