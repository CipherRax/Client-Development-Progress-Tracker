import { Milestone, Task } from '@prisma/client';

export interface PublicTaskDto {
  title: string;
  status: string;
}

export interface PublicMilestoneDto {
  title: string;
  description: string | null;
  status: string;
  progress: number;
  estimatedCompletionDate: Date | null;
  completedAt: Date | null;
  tasks: PublicTaskDto[];
}

export function mapPublicMilestone(
  milestone: Milestone & { tasks?: Task[] },
): PublicMilestoneDto {
  const visibleTasks = (milestone.tasks ?? []).filter((t: Task) => t.clientVisible);
  return {
    title: milestone.title,
    description: milestone.description,
    status: milestone.status,
    progress: milestone.progressPercentage,
    estimatedCompletionDate: milestone.estimatedCompletionDate,
    completedAt: milestone.completedAt,
    tasks: visibleTasks.map((t: Task) => ({ title: t.title, status: t.status })),
  };
}
