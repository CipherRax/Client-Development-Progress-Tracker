import { apiRequest } from './client';
import type { ClientAccessRecord, ClientAccessTokenGenerated } from './types';

export interface GenerateAccessInput {
  expiresAt?: string;
}

export async function generateClientAccess(projectId: string, body?: GenerateAccessInput) {
  const { data } = await apiRequest<ClientAccessTokenGenerated>(`/projects/${projectId}/client-access`, {
    method: 'POST',
    body,
    auth: true,
  });
  return data;
}

export async function listClientAccess(projectId: string) {
  const { data } = await apiRequest<ClientAccessRecord[]>(`/projects/${projectId}/client-access`, {
    auth: true,
  });
  return data;
}

export async function revokeClientAccess(projectId: string) {
  const { data } = await apiRequest<{ message: string }>(`/projects/${projectId}/client-access/revoke`, {
    method: 'POST',
    auth: true,
  });
  return data;
}

export async function regenerateClientAccess(projectId: string) {
  const { data } = await apiRequest<ClientAccessTokenGenerated>(`/projects/${projectId}/client-access/regenerate`, {
    method: 'POST',
    auth: true,
  });
  return data;
}