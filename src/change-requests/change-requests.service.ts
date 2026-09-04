import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityEventType, ActorType, ChangeRequestStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import { UpdateChangeRequestDto } from './dto/update-change-request.dto';
import { RejectChangeRequestDto } from './dto/reject-change-request.dto';
import { QueryChangeRequestDto } from './dto/query-change-request.dto';
import { buildPaginationMeta } from '../common/dto/pagination.dto';

@Injectable()
export class ChangeRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(projectId: string, dto: CreateChangeRequestDto) {
    await this.projectsService.getProjectOrThrow(projectId);

    const changeRequest = await this.prisma.$transaction(async (tx) => {
      const created = await tx.changeRequest.create({
        data: {
          projectId,
          title: dto.title,
          description: dto.description,
          reason: dto.reason,
          requestedBy: dto.requestedBy,
          estimatedAdditionalDays: dto.estimatedAdditionalDays,
          estimatedAdditionalHours: dto.estimatedAdditionalHours ?? 0,
        },
      });

      await this.activity.record(
        {
          projectId,
          eventType: ActivityEventType.CHANGE_REQUEST_CREATED,
          description: `Change request "${created.title}" was submitted (+${created.estimatedAdditionalDays} day(s) estimated).`,
          actorType: ActorType.ADMIN,
          metadata: { changeRequestId: created.id },
        },
        tx,
      );

      return created;
    });

    return changeRequest;
  }

  async findAllForProject(projectId: string, query: QueryChangeRequestDto) {
    await this.projectsService.getProjectOrThrow(projectId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where = { projectId, status: query.status };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.changeRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.changeRequest.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const changeRequest = await this.prisma.changeRequest.findUnique({ where: { id } });
    if (!changeRequest) {
      throw new NotFoundException('Change request not found.');
    }
    return changeRequest;
  }

  async update(id: string, dto: UpdateChangeRequestDto) {
    const changeRequest = await this.findOne(id);
    if (changeRequest.status !== ChangeRequestStatus.PENDING) {
      throw new BadRequestException(
        'Only pending change requests can be edited. Cancel and recreate it instead.',
      );
    }

    return this.prisma.changeRequest.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        reason: dto.reason,
        requestedBy: dto.requestedBy,
        estimatedAdditionalDays: dto.estimatedAdditionalDays,
        estimatedAdditionalHours: dto.estimatedAdditionalHours,
      },
    });
  }

  /**
   * Approves a change request. This is the most sensitive transaction in the
   * system: it atomically preserves the previous completion date, applies
   * the additional time to the project, recalculates the current estimate,
   * and records both a CHANGE_REQUEST_APPROVED and TIME_ADDED activity.
   * A conditional update (status: PENDING) guards against two concurrent
   * approval requests both succeeding.
   */
  async approve(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const changeRequest = await tx.changeRequest.findUnique({ where: { id } });
      if (!changeRequest) {
        throw new NotFoundException('Change request not found.');
      }

      const guarded = await tx.changeRequest.updateMany({
        where: { id, status: ChangeRequestStatus.PENDING },
        data: { status: ChangeRequestStatus.APPROVED }, // placeholder, finalized below
      });
      if (guarded.count === 0) {
        throw new ConflictException(
          `Change request is already ${changeRequest.status} and cannot be approved again.`,
        );
      }

      const previousCompletionDate = (
        await tx.project.findUniqueOrThrow({ where: { id: changeRequest.projectId } })
      ).currentEstimatedCompletionDate;

      const updatedProject = await this.projectsService.addAdditionalTime(
        changeRequest.projectId,
        changeRequest.estimatedAdditionalDays,
        tx,
      );

      const finalized = await tx.changeRequest.update({
        where: { id },
        data: {
          status: ChangeRequestStatus.APPROVED,
          approvedAt: new Date(),
          previousCompletionDate,
          newCompletionDate: updatedProject.currentEstimatedCompletionDate,
          clientVisible: true,
        },
      });

      await this.activity.record(
        {
          projectId: changeRequest.projectId,
          eventType: ActivityEventType.CHANGE_REQUEST_APPROVED,
          description: `Change request "${changeRequest.title}" approved. Completion date moved from ${previousCompletionDate.toISOString().slice(0, 10)} to ${updatedProject.currentEstimatedCompletionDate.toISOString().slice(0, 10)}.`,
          actorType: ActorType.ADMIN,
          metadata: {
            changeRequestId: id,
            additionalDays: changeRequest.estimatedAdditionalDays,
            previousCompletionDate,
            newCompletionDate: updatedProject.currentEstimatedCompletionDate,
          },
        },
        tx,
      );

      await this.activity.record(
        {
          projectId: changeRequest.projectId,
          eventType: ActivityEventType.TIME_ADDED,
          description: `${changeRequest.estimatedAdditionalDays} day(s) added to the project timeline via approved change request.`,
          actorType: ActorType.ADMIN,
          metadata: { changeRequestId: id, additionalDays: changeRequest.estimatedAdditionalDays },
        },
        tx,
      );

      return finalized;
    });
  }

  async reject(id: string, dto: RejectChangeRequestDto) {
    return this.prisma.$transaction(async (tx) => {
      const changeRequest = await tx.changeRequest.findUnique({ where: { id } });
      if (!changeRequest) {
        throw new NotFoundException('Change request not found.');
      }

      const guarded = await tx.changeRequest.updateMany({
        where: { id, status: ChangeRequestStatus.PENDING },
        data: { status: ChangeRequestStatus.REJECTED, rejectedAt: new Date() },
      });
      if (guarded.count === 0) {
        throw new ConflictException(
          `Change request is already ${changeRequest.status} and cannot be rejected.`,
        );
      }

      await this.activity.record(
        {
          projectId: changeRequest.projectId,
          eventType: ActivityEventType.CHANGE_REQUEST_REJECTED,
          description: `Change request "${changeRequest.title}" rejected.${dto.reason ? ` Reason: ${dto.reason}` : ''}`,
          actorType: ActorType.ADMIN,
          metadata: { changeRequestId: id, reason: dto.reason },
        },
        tx,
      );

      return tx.changeRequest.findUniqueOrThrow({ where: { id } });
    });
  }

  async cancel(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const changeRequest = await tx.changeRequest.findUnique({ where: { id } });
      if (!changeRequest) {
        throw new NotFoundException('Change request not found.');
      }

      const guarded = await tx.changeRequest.updateMany({
        where: { id, status: ChangeRequestStatus.PENDING },
        data: { status: ChangeRequestStatus.CANCELLED },
      });
      if (guarded.count === 0) {
        throw new ConflictException(
          `Only pending change requests can be cancelled (current status: ${changeRequest.status}).`,
        );
      }

      await this.activity.record(
        {
          projectId: changeRequest.projectId,
          eventType: ActivityEventType.CHANGE_REQUEST_CANCELLED,
          description: `Change request "${changeRequest.title}" was cancelled.`,
          actorType: ActorType.ADMIN,
          metadata: { changeRequestId: id },
        },
        tx,
      );

      return tx.changeRequest.findUniqueOrThrow({ where: { id } });
    });
  }
}
