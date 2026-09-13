import { apiRequest } from './client';
import type { CurrentWork } from './types';

export interface CurrentWorkInput {
  title: string;
  description?: string;
  expectedCompletionDate?: string;
}

export async function getCurrentWork(projectId: string) {
  const { data } = await apiRequest<CurrentWork[]>(`/projects/${projectId}/current-work`, { auth: true });
  return data;
}

export async function setCurrentWork(projectId: string, body: CurrentWorkInput) {
  const { data } = await apiRequest<CurrentWork[]>(`/projects/${projectId}/current-work`, {
    method: 'PUT',
    body,
    auth: true,
  });
  return data;
}

export async function clearCurrentWork(projectId: string) {
  const { data } = await apiRequest<{ message: string }>(`/projects/${projectId}/current-work`, {
    method: 'DELETE',
    auth: true,
  });
  return data;
}