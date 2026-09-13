import { Project } from '@prisma/client';

export interface PublicProjectDto {
  name: string;
  description: string | null;
  status: string;
  health: string;
  progress: number;
  startDate: Date;
  originalEstimatedCompletionDate: Date;
  estimatedCompletionDate: Date;
  estimatedDaysRemaining: number;
  additionalTimeDays: number;
  pausedTimeDays: number;
}

export function mapPublicProject(project: Project, estimatedDaysRemaining: number): PublicProjectDto {
  return {
    name: project.name,
    description: project.description,
    status: project.status,
    health: project.health,
    progress: project.progressPercentage,
    startDate: project.startDate,
    originalEstimatedCompletionDate: project.originalEstimatedCompletionDate,
    estimatedCompletionDate: project.currentEstimatedCompletionDate,
    estimatedDaysRemaining,
    additionalTimeDays: project.additionalTimeDays,
    pausedTimeDays: project.pausedTimeDays,
  };
}
