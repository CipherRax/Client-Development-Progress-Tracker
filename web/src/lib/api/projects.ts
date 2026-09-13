import { apiRequest } from './client';
import type { PaginationMeta, Project, ProjectDetail, ProjectHealth, ProjectStatus } from './types';

export interface ProjectFilters {
  search?: string;
  status?: ProjectStatus | '';
  health?: ProjectHealth | '';
  clientId?: string;
  page?: number;
  limit?: number;
}

export async function listProjects(filters: ProjectFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const qs = params.toString();
  const { data, meta } = await apiRequest<Project[]>(`/projects${qs ? `?${qs}` : ''}`, { auth: true });
  return { projects: data, meta: meta as PaginationMeta };
}

export async function getProject(id: string) {
  const { data } = await apiRequest<ProjectDetail>(`/projects/${id}`, { auth: true });
  return data;
}

export interface CreateProjectInput {
  clientId: string;
  name: string;
  description?: string;
  startDate: string;
  estimatedDurationDays?: number;
  estimatedCompletionDate?: string;
  status?: ProjectStatus;
  health?: ProjectHealth;
}

export async function createProject(body: CreateProjectInput) {
  const { data } = await apiRequest<Project>('/projects', { method: 'POST', body, auth: true });
  return data;
}

export async function updateProject(id: string, body: Partial<CreateProjectInput>) {
  const { data } = await apiRequest<Project>(`/projects/${id}`, { method: 'PATCH', body, auth: true });
  return data;
}

export async function changeProjectStatus(id: string, status: ProjectStatus) {
  const { data } = await apiRequest<Project>(`/projects/${id}/status`, {
    method: 'PATCH',
    body: { status },
    auth: true,
  });
  return data;
}

export async function changeProjectHealth(id: string, health: ProjectHealth) {
  const { data } = await apiRequest<Project>(`/projects/${id}/health`, {
    method: 'PATCH',
    body: { health },
    auth: true,
  });
  return data;
}

export async function pauseProject(id: string, reason?: string) {
  const { data } = await apiRequest<Project>(`/projects/${id}/pause`, {
    method: 'POST',
    body: reason ? { reason } : {},
    auth: true,
  });
  return data;
}

export async function resumeProject(id: string) {
  const { data } = await apiRequest<Project>(`/projects/${id}/resume`, { method: 'POST', auth: true });
  return data;
}

export async function completeProject(id: string, notes?: string) {
  const { data } = await apiRequest<Project>(`/projects/${id}/complete`, {
    method: 'POST',
    body: notes ? { notes } : {},
    auth: true,
  });
  return data;
}

export async function archiveProject(id: string) {
  const { data } = await apiRequest<Project>(`/projects/${id}/archive`, { method: 'POST', auth: true });
  return data;
}

export async function setProgressOverride(id: string, progressPercentage: number, reason?: string) {
  const { data } = await apiRequest<Project>(`/projects/${id}/progress-override`, {
    method: 'POST',
    body: reason ? { progressPercentage, reason } : { progressPercentage },
    auth: true,
  });
  return data;
}

export async function clearProgressOverride(id: string) {
  const { data } = await apiRequest<Project>(`/projects/${id}/progress-override`, {
    method: 'DELETE',
    auth: true,
  });
  return data;
}