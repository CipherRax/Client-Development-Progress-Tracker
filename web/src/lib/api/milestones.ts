import { apiRequest } from './client';
import type { Milestone, MilestoneStatus } from './types';

export interface CreateMilestoneInput {
  title: string;
  description?: string;
  order?: number;
  weight?: number;
  startDate?: string;
  estimatedCompletionDate?: string;
  clientVisible?: boolean;
}

export async function listMilestones(projectId: string) {
  const { data } = await apiRequest<Milestone[]>(`/projects/${projectId}/milestones`, { auth: true });
  return data;
}

export async function createMilestone(projectId: string, body: CreateMilestoneInput) {
  const { data } = await apiRequest<Milestone>(`/projects/${projectId}/milestones`, {
    method: 'POST',
    body,
    auth: true,
  });
  return data;
}

export async function updateMilestone(id: string, body: Partial<CreateMilestoneInput>) {
  const { data } = await apiRequest<Milestone>(`/milestones/${id}`, { method: 'PATCH', body, auth: true });
  return data;
}

export async function changeMilestoneStatus(id: string, status: MilestoneStatus) {
  const { data } = await apiRequest<Milestone>(`/milestones/${id}/status`, {
    method: 'PATCH',
    body: { status },
    auth: true,
  });
  return data;
}

export async function reorderMilestones(projectId: string, orderedIds: string[]) {
  const { data } = await apiRequest<Milestone[]>(`/projects/${projectId}/milestones/reorder`, {
    method: 'PATCH',
    body: { orderedIds },
    auth: true,
  });
  return data;
}

export async function deleteMilestone(id: string) {
  const { data } = await apiRequest<{ message: string }>(`/milestones/${id}`, {
    method: 'DELETE',
    auth: true,
  });
  return data;
}