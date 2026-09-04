import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityEventType, ActorType, UpdateVisibility } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateProjectUpdateDto } from './dto/create-update.dto';
import { UpdateProjectUpdateDto } from './dto/update-update.dto';

@Injectable()
export class ProjectUpdatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(projectId: string, adminId: string, dto: CreateProjectUpdateDto) {
    await this.projectsService.getProjectOrThrow(projectId);

    const update = await this.prisma.$transaction(async (tx) => {
      const created = await tx.projectUpdate.create({
        data: {
          projectId,
          title: dto.title,
          content: dto.content,
          visibility: dto.visibility ?? UpdateVisibility.PUBLIC,
          createdById: adminId,
        },
      });

      await this.activity.record(
        {
          projectId,
          eventType:
            created.visibility === UpdateVisibility.PUBLIC
              ? ActivityEventType.PUBLIC_UPDATE_CREATED
              : ActivityEventType.UPDATE_CREATED,
          description: `${created.visibility === UpdateVisibility.PUBLIC ? 'Public' : 'Internal'} update published: "${created.title}".`,
          actorType: ActorType.ADMIN,
          actorId: adminId,
          metadata: { updateId: created.id },
        },
        tx,
      );

      return created;
    });

    return update;
  }

  async findAllForProject(projectId: string) {
    await this.projectsService.getProjectOrThrow(projectId);
    return this.prisma.projectUpdate.findMany({
      where: { projectId },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateProjectUpdateDto) {
    await this.getOrThrow(id);
    return this.prisma.projectUpdate.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.getOrThrow(id);
    await this.prisma.projectUpdate.delete({ where: { id } });
    return { message: 'Update deleted.' };
  }

  private async getOrThrow(id: string) {
    const update = await this.prisma.projectUpdate.findUnique({ where: { id } });
    if (!update) {
      throw new NotFoundException('Update not found.');
    }
    return update;
  }
}
