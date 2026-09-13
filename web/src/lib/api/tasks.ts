import { apiRequest } from './client';
import type { Task, TaskPriority, TaskStatus } from './types';

export interface CreateTaskInput {
  title: string;
  description?: string;
  order?: number;
  priority?: TaskPriority;
  estimatedHours?: number;
  clientVisible?: boolean;
}

export async function listTasks(milestoneId: string) {
  const { data } = await apiRequest<Task[]>(`/milestones/${milestoneId}/tasks`, { auth: true });
  return data;
}

export async function createTask(milestoneId: string, body: CreateTaskInput) {
  const { data } = await apiRequest<Task>(`/milestones/${milestoneId}/tasks`, {
    method: 'POST',
    body,
    auth: true,
  });
  return data;
}

export async function updateTask(id: string, body: Partial<CreateTaskInput>) {
  const { data } = await apiRequest<Task>(`/tasks/${id}`, { method: 'PATCH', body, auth: true });
  return data;
}

export async function changeTaskStatus(id: string, status: TaskStatus) {
  const { data } = await apiRequest<Task>(`/tasks/${id}/status`, {
    method: 'PATCH',
    body: { status },
    auth: true,
  });
  return data;
}

export async function deleteTask(id: string) {
  const { data } = await apiRequest<{ message: string }>(`/tasks/${id}`, { method: 'DELETE', auth: true });
  return data;
}