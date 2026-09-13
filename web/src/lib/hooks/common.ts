import { toast } from 'sonner';

/** Normalizes any thrown error (ApiError, network error, string) into a toast-friendly message. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Something went wrong. Please try again.';
}

export function handleApiError(error: unknown) {
  toast.error(errorMessage(error));
  throw error;
}

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: unknown) => [...projectKeys.lists(), filters] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
};

export const milestoneKeys = {
  all: ['milestones'] as const,
  project: (projectId: string) => [...milestoneKeys.all, 'project', projectId] as const,
  detail: (id: string) => [...milestoneKeys.all, 'detail', id] as const,
};

export const taskKeys = {
  all: ['tasks'] as const,
  milestone: (milestoneId: string) => [...taskKeys.all, 'milestone', milestoneId] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
};

export const changeRequestKeys = {
  all: ['change-requests'] as const,
  project: (projectId: string) => [...changeRequestKeys.all, 'project', projectId] as const,
};

export const updateKeys = {
  all: ['updates'] as const,
  project: (projectId: string) => [...updateKeys.all, 'project', projectId] as const,
};

export const currentWorkKeys = {
  all: ['current-work'] as const,
  project: (projectId: string) => [...currentWorkKeys.all, 'project', projectId] as const,
};

export const clientAccessKeys = {
  all: ['client-access'] as const,
  project: (projectId: string) => [...clientAccessKeys.all, 'project', projectId] as const,
};

export const activityKeys = {
  all: ['activity'] as const,
  project: (projectId: string) => [...activityKeys.all, 'project', projectId] as const,
};