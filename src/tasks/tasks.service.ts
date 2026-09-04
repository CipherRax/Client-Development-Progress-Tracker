import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityEventType, ActorType, TaskStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { MilestonesService } from '../milestones/milestones.service';
import { ProjectsService } from '../projects/projects.service';
import { ProgressCalculationService } from '../projects/services/progress-calculation.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly milestonesService: MilestonesService,
    private readonly projectsService: ProjectsService,
    private readonly progressCalc: ProgressCalculationService,
  ) {}

  async create(milestoneId: string, dto: CreateTaskDto) {
    const milestone = await this.milestonesService.getMilestoneOrThrow(milestoneId);

    let order = dto.order;
    if (order === undefined) {
      const last = await this.prisma.task.findFirst({
        where: { milestoneId },
        orderBy: { order: 'desc' },
      });
      order = (last?.order ?? -1) + 1;
    }

    const task = await this.prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          milestoneId,
          title: dto.title,
          description: dto.description,
          status: dto.status ?? TaskStatus.TODO,
          priority: dto.priority ?? 'MEDIUM',
          order,
          estimatedHours: dto.estimatedHours,
          clientVisible: dto.clientVisible ?? false,
          completedAt: dto.status === TaskStatus.COMPLETED ? new Date() : undefined,
        },
      });

      await this.activity.record(
        {
          projectId: milestone.projectId,
          eventType: ActivityEventType.TASK_CREATED,
          description: `Task "${created.title}" was created under milestone "${milestone.title}".`,
          actorType: ActorType.ADMIN,
          metadata: { taskId: created.id, milestoneId },
        },
        tx,
      );

      await this.recalculateMilestoneAndProjectProgress(milestoneId, milestone.projectId, tx);
      return created;
    });

    return task;
  }

  async findAllForMilestone(milestoneId: string) {
    await this.milestonesService.getMilestoneOrThrow(milestoneId);
    return this.prisma.task.findMany({ where: { milestoneId }, orderBy: { order: 'asc' } });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException('Task not found.');
    }
    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    const task = await this.getTaskOrThrow(id);
    const milestone = await this.milestonesService.getMilestoneOrThrow(task.milestoneId);

    const becomingCompleted =
      dto.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.task.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description,
          status: dto.status,
          priority: dto.priority,
          order: dto.order,
          estimatedHours: dto.estimatedHours,
          actualHours: dto.actualHours,
          clientVisible: dto.clientVisible,
          completedAt: becomingCompleted ? new Date() : undefined,
        },
      });

      await this.activity.record(
        {
          projectId: milestone.projectId,
          eventType: ActivityEventType.TASK_UPDATED,
          description: `Task "${result.title}" was updated.`,
          actorType: ActorType.ADMIN,
          metadata: { taskId: id },
        },
        tx,
      );

      await this.recalculateMilestoneAndProjectProgress(task.milestoneId, milestone.projectId, tx);
      return result;
    });

    return updated;
  }

  async updateStatus(id: string, dto: UpdateTaskStatusDto) {
    const task = await this.getTaskOrThrow(id);
    const milestone = await this.milestonesService.getMilestoneOrThrow(task.milestoneId);
    const becomingCompleted =
      dto.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.task.update({
        where: { id },
        data: {
          status: dto.status,
          completedAt: becomingCompleted ? new Date() : task.completedAt,
        },
      });

      await this.activity.record(
        {
          projectId: milestone.projectId,
          eventType: becomingCompleted ? ActivityEventType.TASK_COMPLETED : ActivityEventType.TASK_UPDATED,
          description: `Task "${result.title}" status changed from ${task.status} to ${dto.status}.`,
          actorType: ActorType.ADMIN,
          metadata: { taskId: id, from: task.status, to: dto.status },
        },
        tx,
      );

      await this.recalculateMilestoneAndProjectProgress(task.milestoneId, milestone.projectId, tx);
      return result;
    });

    return updated;
  }

  async remove(id: string) {
    const task = await this.getTaskOrThrow(id);
    const milestone = await this.milestonesService.getMilestoneOrThrow(task.milestoneId);

    await this.prisma.$transaction(async (tx) => {
      await tx.task.delete({ where: { id } });
      await this.activity.record(
        {
          projectId: milestone.projectId,
          eventType: ActivityEventType.TASK_DELETED,
          description: `Task "${task.title}" was deleted.`,
          actorType: ActorType.ADMIN,
          metadata: { taskId: id },
        },
        tx,
      );
      await this.recalculateMilestoneAndProjectProgress(task.milestoneId, milestone.projectId, tx);
    });

    return { message: 'Task deleted.' };
  }

  private async getTaskOrThrow(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException('Task not found.');
    }
    return task;
  }

  private async recalculateMilestoneAndProjectProgress(
    milestoneId: string,
    projectId: string,
    tx: any,
  ) {
    const milestone = await tx.milestone.findUniqueOrThrow({ where: { id: milestoneId } });
    const tasks = await tx.task.findMany({ where: { milestoneId } });
    const progressPercentage = this.progressCalc.calculateMilestoneProgress(
      tasks,
      milestone.progressPercentage,
    );

    await tx.milestone.update({ where: { id: milestoneId }, data: { progressPercentage } });
    await this.projectsService.recalculateProjectProgress(projectId, tx);
  }
}
