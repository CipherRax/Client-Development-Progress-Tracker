import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityEventType,
  ActorType,
  MilestoneStatus,
  Prisma,
  ProjectHealth,
  ProjectStatus,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { ProgressCalculationService } from './services/progress-calculation.service';
import { TimelineCalculationService } from './services/timeline-calculation.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { ChangeProjectStatusDto } from './dto/change-status.dto';
import { ChangeProjectHealthDto } from './dto/change-health.dto';
import { PauseProjectDto } from './dto/pause-project.dto';
import { CompleteProjectDto } from './dto/complete-project.dto';
import { buildPaginationMeta } from '../common/dto/pagination.dto';
import { addDaysUtc, diffInDaysUtc } from '../common/utils/date.util';

type PrismaTx = Prisma.TransactionClient;

// Statuses that cannot be changed via the generic status-change endpoint;
// they are reachable only via their dedicated lifecycle endpoints.
const DEDICATED_ENDPOINT_ONLY: ProjectStatus[] = [
  ProjectStatus.COMPLETED,
  ProjectStatus.ARCHIVED,
];

// Once in one of these, the project is closed to further generic status
// changes (it may still be archived).
const TERMINAL_STATUSES: ProjectStatus[] = [
  ProjectStatus.COMPLETED,
  ProjectStatus.CANCELLED,
  ProjectStatus.ARCHIVED,
];

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly progressCalc: ProgressCalculationService,
    private readonly timelineCalc: TimelineCalculationService,
  ) {}

  async create(dto: CreateProjectDto) {
    const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
    if (!client) {
      throw new NotFoundException('Client not found.');
    }
    if (client.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot create a project for an archived client.');
    }

    const startDate = new Date(dto.startDate);
    let estimatedCompletionDate: Date;
    let estimatedDurationDays: number;

    if (dto.estimatedCompletionDate) {
      estimatedCompletionDate = new Date(dto.estimatedCompletionDate);
      estimatedDurationDays = diffInDaysUtc(startDate, estimatedCompletionDate);
      if (estimatedDurationDays <= 0) {
        throw new BadRequestException(
          'estimatedCompletionDate must be after startDate.',
        );
      }
      if (dto.estimatedDurationDays && dto.estimatedDurationDays !== estimatedDurationDays) {
        throw new BadRequestException(
          `estimatedDurationDays (${dto.estimatedDurationDays}) is inconsistent with the gap between startDate and estimatedCompletionDate (${estimatedDurationDays} days). Provide only one, or ensure they match.`,
        );
      }
    } else if (dto.estimatedDurationDays) {
      estimatedDurationDays = dto.estimatedDurationDays;
      estimatedCompletionDate = addDaysUtc(startDate, estimatedDurationDays);
    } else {
      throw new BadRequestException(
        'Provide either estimatedDurationDays or estimatedCompletionDate.',
      );
    }

    const projectCode = await this.generateProjectCode(dto.name);

    const project = await this.prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          clientId: dto.clientId,
          name: dto.name,
          description: dto.description,
          projectCode,
          status: dto.status ?? ProjectStatus.PLANNING,
          health: dto.health ?? ProjectHealth.ON_TRACK,
          startDate,
          originalEstimatedCompletionDate: estimatedCompletionDate,
          currentEstimatedCompletionDate: estimatedCompletionDate,
          originalEstimatedDuration: estimatedDurationDays,
          currentEstimatedDuration: estimatedDurationDays,
        },
      });

      await this.activity.record(
        {
          projectId: created.id,
          eventType: ActivityEventType.PROJECT_CREATED,
          description: `Project "${created.name}" was created.`,
          actorType: ActorType.ADMIN,
          metadata: { clientId: dto.clientId },
        },
        tx,
      );

      return created;
    });

    return project;
  }

  async findAll(query: QueryProjectDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ProjectWhereInput = {
      clientId: query.clientId,
      status: query.status,
      health: query.health,
      ...(query.archived === 'true' ? { archivedAt: { not: null } } : {}),
      ...(query.archived === 'false' ? { archivedAt: null } : {}),
      ...(query.completed === 'true' ? { completedAt: { not: null } } : {}),
      ...(query.completed === 'false' ? { completedAt: null } : {}),
      ...(query.startDateFrom || query.startDateTo
        ? {
            startDate: {
              ...(query.startDateFrom ? { gte: new Date(query.startDateFrom) } : {}),
              ...(query.startDateTo ? { lte: new Date(query.startDateTo) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { projectCode: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        include: {
          client: { select: { id: true, name: true, companyName: true } },
          _count: { select: { milestones: true, changeRequests: true } },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const project = await this.getProjectOrThrow(id);

    const [milestones, changeRequests, recentUpdates, recentActivity] = await Promise.all([
      this.prisma.milestone.findMany({
        where: { projectId: id },
        orderBy: { order: 'asc' },
        include: { tasks: true },
      }),
      this.prisma.changeRequest.findMany({
        where: { projectId: id },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.projectUpdate.findMany({
        where: { projectId: id },
        orderBy: { publishedAt: 'desc' },
        take: 10,
      }),
      this.prisma.projectActivity.findMany({
        where: { projectId: id },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
    ]);

    const currentMilestone = this.progressCalc.findCurrentMilestone(milestones);
    const nextMilestone = this.progressCalc.findNextMilestone(milestones, currentMilestone);
    const estimatedDaysRemaining = this.timelineCalc.estimatedDaysRemaining(
      project.currentEstimatedCompletionDate,
    );

    return {
      ...project,
      milestones,
      currentMilestone,
      nextMilestone,
      estimatedDaysRemaining,
      changeRequestSummary: {
        pending: changeRequests.filter((c: any) => c.status === 'PENDING').length,
        approved: changeRequests.filter((c: any) => c.status === 'APPROVED').length,
        rejected: changeRequests.filter((c: any) => c.status === 'REJECTED').length,
        total: changeRequests.length,
      },
      recentUpdates,
      recentActivity,
    };
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.getProjectOrThrow(id);
    const project = await this.prisma.project.update({ where: { id }, data: dto });
    await this.activity.record({
      projectId: id,
      eventType: ActivityEventType.PROJECT_UPDATED,
      description: 'Project details were updated.',
      actorType: ActorType.ADMIN,
      metadata: dto as Record<string, any>,
    });
    return project;
  }

  async changeStatus(id: string, dto: ChangeProjectStatusDto) {
    const project = await this.getProjectOrThrow(id);

    if (TERMINAL_STATUSES.includes(project.status)) {
      throw new BadRequestException(
        `Project is ${project.status} and cannot transition to another status directly.`,
      );
    }
    if (DEDICATED_ENDPOINT_ONLY.includes(dto.status)) {
      throw new BadRequestException(
        `Use the dedicated endpoint to move a project to ${dto.status}.`,
      );
    }
    if (dto.status === project.status) {
      throw new BadRequestException(`Project is already ${dto.status}.`);
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: { status: dto.status },
    });

    await this.activity.record({
      projectId: id,
      eventType: ActivityEventType.STATUS_CHANGED,
      description: `Status changed from ${project.status} to ${dto.status}.`,
      actorType: ActorType.ADMIN,
      metadata: { from: project.status, to: dto.status, reason: dto.reason },
    });

    return updated;
  }

  async changeHealth(id: string, dto: ChangeProjectHealthDto) {
    const project = await this.getProjectOrThrow(id);

    if (TERMINAL_STATUSES.includes(project.status)) {
      throw new BadRequestException(
        `Project is ${project.status}. Health cannot be changed on a closed project.`,
      );
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: { health: dto.health },
    });

    await this.activity.record({
      projectId: id,
      eventType: ActivityEventType.HEALTH_CHANGED,
      description: `Health changed from ${project.health} to ${dto.health}.`,
      actorType: ActorType.ADMIN,
      metadata: { from: project.health, to: dto.health, reason: dto.reason },
    });

    return updated;
  }

  async pause(id: string, dto: PauseProjectDto) {
    const project = await this.getProjectOrThrow(id);

    if (TERMINAL_STATUSES.includes(project.status)) {
      throw new BadRequestException(`Cannot pause a project that is ${project.status}.`);
    }
    if (project.status === ProjectStatus.PAUSED) {
      throw new BadRequestException('Project is already paused.');
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        status: ProjectStatus.PAUSED,
        pausedAt: new Date(),
        pauseReason: dto.reason,
        resumedAt: null,
        pausedFromStatus: project.status,
      },
    });

    await this.activity.record({
      projectId: id,
      eventType: ActivityEventType.PROJECT_PAUSED,
      description: `Project paused.${dto.reason ? ` Reason: ${dto.reason}` : ''}`,
      actorType: ActorType.ADMIN,
      metadata: { reason: dto.reason },
    });

    return updated;
  }

  async resume(id: string) {
    const project = await this.getProjectOrThrow(id);

    if (project.status !== ProjectStatus.PAUSED || !project.pausedAt) {
      throw new BadRequestException('Project is not currently paused.');
    }

    const pausedDays = Math.max(0, diffInDaysUtc(project.pausedAt, new Date()));
    const newPausedTimeDays = project.pausedTimeDays + pausedDays;

    const timeline = this.timelineCalc.recalculate({
      originalEstimatedCompletionDate: project.originalEstimatedCompletionDate,
      originalEstimatedDuration: project.originalEstimatedDuration,
      additionalTimeDays: project.additionalTimeDays,
      pausedTimeDays: newPausedTimeDays,
    });

    const resumedStatus =
      project.pausedFromStatus && project.pausedFromStatus !== ProjectStatus.PAUSED
        ? project.pausedFromStatus
        : ProjectStatus.IN_PROGRESS;

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        status: resumedStatus,
        resumedAt: new Date(),
        pausedTimeDays: newPausedTimeDays,
        pausedFromStatus: null,
        currentEstimatedCompletionDate: timeline.currentEstimatedCompletionDate,
        currentEstimatedDuration: timeline.currentEstimatedDuration,
      },
    });

    await this.activity.record({
      projectId: id,
      eventType: ActivityEventType.PROJECT_RESUMED,
      description: `Project resumed after ${pausedDays} day(s) paused.`,
      actorType: ActorType.ADMIN,
      metadata: { pausedDays, newPausedTimeDays },
    });

    return updated;
  }

  async complete(id: string, dto: CompleteProjectDto) {
    const project = await this.getProjectOrThrow(id);

    if (project.status === ProjectStatus.COMPLETED) {
      throw new BadRequestException('Project is already completed.');
    }
    if (project.status === ProjectStatus.ARCHIVED) {
      throw new BadRequestException('Cannot complete an archived project.');
    }
    if (project.status === ProjectStatus.CANCELLED) {
      throw new BadRequestException('Cannot complete a cancelled project.');
    }

    const milestones = await this.prisma.milestone.findMany({ where: { projectId: id } });
    const incomplete = milestones.filter(
      (m) => m.status !== MilestoneStatus.COMPLETED && m.status !== MilestoneStatus.SKIPPED,
    );

    if (incomplete.length > 0 && !dto.force) {
      throw new BadRequestException(
        `${incomplete.length} milestone(s) are not completed or skipped. Pass force: true with a reason to override.`,
      );
    }
    if (incomplete.length > 0 && dto.force && !dto.reason) {
      throw new BadRequestException('A reason is required when forcing project completion.');
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        status: ProjectStatus.COMPLETED,
        progressPercentage: 100,
        completedAt: new Date(),
      },
    });

    await this.activity.record({
      projectId: id,
      eventType: ActivityEventType.PROJECT_COMPLETED,
      description:
        incomplete.length > 0
          ? `Project marked complete with ${incomplete.length} incomplete milestone(s) overridden. Reason: ${dto.reason}`
          : 'Project marked complete.',
      actorType: ActorType.ADMIN,
      metadata: { forced: !!dto.force, incompleteMilestoneCount: incomplete.length, reason: dto.reason },
    });

    return updated;
  }

  async archive(id: string) {
    const project = await this.getProjectOrThrow(id);
    if (project.status === ProjectStatus.ARCHIVED) {
      throw new BadRequestException('Project is already archived.');
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.ARCHIVED, archivedAt: new Date() },
    });

    await this.activity.record({
      projectId: id,
      eventType: ActivityEventType.PROJECT_ARCHIVED,
      description: 'Project archived.',
      actorType: ActorType.ADMIN,
    });

    return updated;
  }

  async remove(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: { milestones: true, changeRequests: true, updates: true, activities: true },
        },
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const hasHistory =
      project._count.milestones > 0 ||
      project._count.changeRequests > 0 ||
      project._count.updates > 0 ||
      project._count.activities > 1; // PROJECT_CREATED is always present

    if (hasHistory) {
      throw new ConflictException(
        'This project has recorded history and cannot be permanently deleted. Archive it instead.',
      );
    }

    await this.prisma.project.delete({ where: { id } });
    return { message: 'Project deleted.' };
  }

  /**
   * Recomputes and persists project.progressPercentage from milestone
   * weights, unless the admin has explicitly enabled a manual override.
   * Called by the milestones/tasks modules whenever underlying data changes.
   */
  async recalculateProjectProgress(projectId: string, tx?: PrismaTx) {
    const client = tx ?? this.prisma;
    const project = await client.project.findUnique({ where: { id: projectId } });
    if (!project || project.progressManualOverride) {
      return project;
    }

    // A completed project is always 100% complete regardless of any later
    // milestone/task edits. Prevent historical progress from drifting.
    if (project.status === ProjectStatus.COMPLETED) {
      return client.project.update({
        where: { id: projectId },
        data: { progressPercentage: 100 },
      });
    }

    const milestones = await client.milestone.findMany({ where: { projectId } });
    const progress = this.progressCalc.calculateProjectProgress(milestones);

    return client.project.update({
      where: { id: projectId },
      data: { progressPercentage: progress },
    });
  }

  /**
   * Sets (or replaces) a manual progress override. The override disables
   * automatic progress calculation for the project and is recorded in the
   * activity history. Pass a new value to set/update it; the explicit
   * clearProgressOverride() call removes it.
   */
  async setProgressOverride(projectId: string, progress: number, reason?: string) {
    const project = await this.getProjectOrThrow(projectId);
    const clamped = Math.min(100, Math.max(0, progress));

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.project.update({
        where: { id: projectId },
        data: {
          progressPercentage: clamped,
          progressManualOverride: true,
        },
      });

      await this.activity.record(
        {
          projectId,
          eventType: ActivityEventType.PROGRESS_OVERRIDDEN,
          description: `Manual progress override set to ${clamped}%. Automatic calculation disabled.${reason ? ` Reason: ${reason}` : ''}`,
          actorType: ActorType.ADMIN,
          metadata: { progress: clamped, reason, previousProgress: project.progressPercentage },
        },
        tx,
      );

      return result;
    });

    return updated;
  }

  async clearProgressOverride(projectId: string) {
    const project = await this.getProjectOrThrow(projectId);

    if (!project.progressManualOverride) {
      throw new BadRequestException('This project does not have a manual progress override.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.project.update({
        where: { id: projectId },
        data: { progressManualOverride: false },
      });

      await this.activity.record(
        {
          projectId,
          eventType: ActivityEventType.PROGRESS_OVERRIDDEN,
          description: 'Manual progress override cleared. Automatic calculation resumed.',
          actorType: ActorType.ADMIN,
          metadata: { cleared: true, previousProgress: project.progressPercentage },
        },
        tx,
      );

      return result;
    });

    await this.recalculateProjectProgress(projectId);
    return updated;
  }

  /**
   * Guards mutations against projects that have been closed permanently.
   * Completed projects remain editable (e.g. to add final notes) but their
   * progress stays locked at 100% by recalculateProjectProgress.
   */
  async assertProjectMutable(id: string) {
    const project = await this.getProjectOrThrow(id);
    if (
      project.status === ProjectStatus.CANCELLED ||
      project.status === ProjectStatus.ARCHIVED
    ) {
      throw new BadRequestException(
        `Project is ${project.status} and can no longer be modified.`,
      );
    }
    return project;
  }

  /**
   * Adds approved change-request time (or any other additional time) to a
   * project and recalculates the current estimate. Used by the
   * change-requests module inside its approval transaction.
   */
  async addAdditionalTime(projectId: string, additionalDays: number, tx: PrismaTx) {
    const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });
    const newAdditionalTimeDays = project.additionalTimeDays + additionalDays;

    const timeline = this.timelineCalc.recalculate({
      originalEstimatedCompletionDate: project.originalEstimatedCompletionDate,
      originalEstimatedDuration: project.originalEstimatedDuration,
      additionalTimeDays: newAdditionalTimeDays,
      pausedTimeDays: project.pausedTimeDays,
    });

    return tx.project.update({
      where: { id: projectId },
      data: {
        additionalTimeDays: newAdditionalTimeDays,
        currentEstimatedCompletionDate: timeline.currentEstimatedCompletionDate,
        currentEstimatedDuration: timeline.currentEstimatedDuration,
      },
    });
  }

  async getProjectOrThrow(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }
    return project;
  }

  private async generateProjectCode(name: string): Promise<string> {
    const base = name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 20);

    for (let attempt = 0; attempt < 5; attempt++) {
      const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
      const candidate = `${base || 'PROJ'}-${suffix}`;
      const existing = await this.prisma.project.findUnique({ where: { projectCode: candidate } });
      if (!existing) {
        return candidate;
      }
    }
    // Extremely unlikely fallback.
    return `${base || 'PROJ'}-${Date.now()}`;
  }
}
