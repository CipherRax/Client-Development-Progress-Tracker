import { Injectable } from '@nestjs/common';
import { Milestone, Project, Task, UpdateVisibility } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { ProgressCalculationService } from '../projects/services/progress-calculation.service';
import { TimelineCalculationService } from '../projects/services/timeline-calculation.service';
import { mapPublicProject } from './mappers/public-project.mapper';
import { mapPublicMilestone } from './mappers/public-milestone.mapper';
import { mapPublicUpdate } from './mappers/public-update.mapper';
import { mapPublicChangeRequest } from './mappers/public-change-request.mapper';
import { isClientVisibleActivity, mapPublicActivity } from './mappers/public-activity.mapper';
import { ContactMessageDto } from './dto/contact-message.dto';
import { ActorType, ActivityEventType } from '@prisma/client';

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly progressCalc: ProgressCalculationService,
    private readonly timelineCalc: TimelineCalculationService,
  ) {}

  /**
   * Builds the complete client dashboard payload. `project` here is always
   * the value the ClientAccessGuard resolved from the validated token —
   * it is never taken from a client-supplied ID, which is what guarantees
   * a client can never see another project no matter what they send.
   */
  async getDashboard(project: Project) {
    const [milestones, currentWorkItem, publicUpdates, approvedChangeRequests, activity] =
      await Promise.all([
        this.prisma.milestone.findMany({
          where: { projectId: project.id, clientVisible: true },
          orderBy: { order: 'asc' },
          include: { tasks: true },
        }),
        this.prisma.currentWork.findFirst({
          where: { projectId: project.id, active: true },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.projectUpdate.findMany({
          where: { projectId: project.id, visibility: UpdateVisibility.PUBLIC },
          orderBy: { publishedAt: 'desc' },
          take: 20,
        }),
        this.prisma.changeRequest.findMany({
          where: { projectId: project.id, clientVisible: true },
          orderBy: { approvedAt: 'desc' },
        }),
        this.prisma.projectActivity.findMany({
          where: { projectId: project.id },
          orderBy: { createdAt: 'desc' },
          take: 30,
        }),
      ]);

    type MilestoneWithTasks = Milestone & { tasks: Task[] };
    const currentMilestone = this.progressCalc.findCurrentMilestone<MilestoneWithTasks>(milestones);
    const nextMilestone = this.progressCalc.findNextMilestone<MilestoneWithTasks>(
      milestones,
      currentMilestone,
    );
    const estimatedDaysRemaining = this.timelineCalc.estimatedDaysRemaining(
      project.currentEstimatedCompletionDate,
    );

    return {
      project: mapPublicProject(project, estimatedDaysRemaining),
      currentWork: currentWorkItem
        ? {
            title: currentWorkItem.title,
            description: currentWorkItem.description,
            expectedCompletionDate: currentWorkItem.expectedCompletionDate,
          }
        : null,
      currentMilestone: currentMilestone ? mapPublicMilestone(currentMilestone) : null,
      nextMilestone: nextMilestone ? { title: nextMilestone.title } : null,
      milestones: milestones.map(mapPublicMilestone),
      updates: publicUpdates.map(mapPublicUpdate),
      changeRequests: approvedChangeRequests.map(mapPublicChangeRequest),
      timeline: activity
        .filter((a: any) => isClientVisibleActivity(a.eventType))
        .map(mapPublicActivity),
    };
  }

  async submitContactMessage(project: Project, dto: ContactMessageDto) {
    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.contactMessage.create({
        data: {
          projectId: project.id,
          name: dto.name,
          email: dto.email,
          message: dto.message,
        },
      });

      await this.activity.record(
        {
          projectId: project.id,
          eventType: ActivityEventType.CONTACT_MESSAGE_RECEIVED,
          description: `Client contact message received from ${dto.name}.`,
          actorType: ActorType.CLIENT,
        },
        tx,
      );

      return created;
    });

    return { message: 'Your message has been sent to the developer.', id: message.id };
  }
}
