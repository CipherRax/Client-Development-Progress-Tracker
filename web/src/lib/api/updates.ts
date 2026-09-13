import { apiRequest } from './client';
import type { UpdateVisibility, ProjectUpdate } from './types';

export interface CreateUpdateInput {
  title: string;
  content: string;
  visibility?: UpdateVisibility;
}

export async function listUpdates(projectId: string) {
  const { data } = await apiRequest<ProjectUpdate[]>(`/projects/${projectId}/updates`, { auth: true });
  return data;
}

export async function createUpdate(projectId: string, body: CreateUpdateInput) {
  const { data } = await apiRequest<ProjectUpdate>(`/projects/${projectId}/updates`, {
    method: 'POST',
    body,
    auth: true,
  });
  return data;
}

export async function updateUpdate(id: string, body: Partial<CreateUpdateInput>) {
  const { data } = await apiRequest<ProjectUpdate>(`/updates/${id}`, { method: 'PATCH', body, auth: true });
  return data;
}

export async function deleteUpdate(id: string) {
  const { data } = await apiRequest<{ message: string }>(`/updates/${id}`, { method: 'DELETE', auth: true });
  return data;
}