import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityEventType, ActorType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { ProjectsService } from '../projects/projects.service';
import { SetCurrentWorkDto } from './dto/set-current-work.dto';

@Injectable()
export class CurrentWorkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly projectsService: ProjectsService,
  ) {}

  async set(projectId: string, dto: SetCurrentWorkDto) {
    await this.projectsService.getProjectOrThrow(projectId);

    const currentWork = await this.prisma.$transaction(async (tx) => {
      // Only one active current-work item per project: deactivate the rest.
      await tx.currentWork.updateMany({
        where: { projectId, active: true },
        data: { active: false },
      });

      const created = await tx.currentWork.create({
        data: {
          projectId,
          title: dto.title,
          description: dto.description,
          expectedCompletionDate: dto.expectedCompletionDate
            ? new Date(dto.expectedCompletionDate)
            : undefined,
          active: true,
        },
      });

      await this.activity.record(
        {
          projectId,
          eventType: ActivityEventType.CURRENT_WORK_UPDATED,
          description: `Current work set to "${created.title}".`,
          actorType: ActorType.ADMIN,
          metadata: { currentWorkId: created.id },
        },
        tx,
      );

      return created;
    });

    return currentWork;
  }

  async getActive(projectId: string) {
    await this.projectsService.getProjectOrThrow(projectId);
    return this.prisma.currentWork.findFirst({
      where: { projectId, active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async clear(projectId: string) {
    await this.projectsService.getProjectOrThrow(projectId);
    const active = await this.prisma.currentWork.findFirst({ where: { projectId, active: true } });
    if (!active) {
      throw new NotFoundException('No active current-work item to clear.');
    }
    await this.prisma.currentWork.update({ where: { id: active.id }, data: { active: false } });
    return { message: 'Current work cleared.' };
  }
}
