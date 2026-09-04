import { Project } from '@prisma/client';

export interface PublicProjectDto {
  name: string;
  description: string | null;
  status: string;
  health: string;
  progress: number;
  startDate: Date;
  estimatedCompletionDate: Date;
  estimatedDaysRemaining: number;
}

export function mapPublicProject(project: Project, estimatedDaysRemaining: number): PublicProjectDto {
  return {
    name: project.name,
    description: project.description,
    status: project.status,
    health: project.health,
    progress: project.progressPercentage,
    startDate: project.startDate,
    estimatedCompletionDate: project.currentEstimatedCompletionDate,
    estimatedDaysRemaining,
  };
}
