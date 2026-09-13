import { apiRequest } from './client';
import type { ChangeRequest } from './types';

export interface CreateChangeRequestInput {
  title: string;
  description?: string;
  reason?: string;
  estimatedAdditionalDays: number;
  estimatedAdditionalHours?: number;
  clientVisible?: boolean;
}

export async function listChangeRequests(projectId: string) {
  const { data } = await apiRequest<ChangeRequest[]>(`/projects/${projectId}/change-requests`, {
    auth: true,
  });
  return data;
}

export async function createChangeRequest(projectId: string, body: CreateChangeRequestInput) {
  const { data } = await apiRequest<ChangeRequest>(`/projects/${projectId}/change-requests`, {
    method: 'POST',
    body,
    auth: true,
  });
  return data;
}

export async function updateChangeRequest(id: string, body: Partial<CreateChangeRequestInput>) {
  const { data } = await apiRequest<ChangeRequest>(`/change-requests/${id}`, {
    method: 'PATCH',
    body,
    auth: true,
  });
  return data;
}

export async function approveChangeRequest(id: string) {
  const { data } = await apiRequest<ChangeRequest>(`/change-requests/${id}/approve`, {
    method: 'POST',
    auth: true,
  });
  return data;
}

export async function rejectChangeRequest(id: string) {
  const { data } = await apiRequest<ChangeRequest>(`/change-requests/${id}/reject`, {
    method: 'POST',
    auth: true,
  });
  return data;
}

export async function cancelChangeRequest(id: string) {
  const { data } = await apiRequest<ChangeRequest>(`/change-requests/${id}/cancel`, {
    method: 'POST',
    auth: true,
  });
  return data;
}