import { apiRequest } from './client';
import type { ProjectActivity } from './types';

export async function listActivity(projectId: string, limit = 50) {
  const { data, meta } = await apiRequest<ProjectActivity[]>(`/projects/${projectId}/activity?limit=${limit}`, {
    auth: true,
  });
  return { activities: data, meta };
}