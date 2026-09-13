import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as projectsApi from '@/lib/api/projects';
import * as milestoneApi from '@/lib/api/milestones';
import * as taskApi from '@/lib/api/tasks';
import { handleApiError, projectKeys, milestoneKeys, taskKeys } from './common';

export function useProjects(filters: projectsApi.ProjectFilters = {}) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => projectsApi.listProjects(filters),
    placeholderData: (prev) => prev,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectsApi.getProject(id),
    enabled: Boolean(id),
  });
}

/** Invalidates project detail + dependent collections after a project mutation. */
function useInvalidateProject(id: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: projectKeys.detail(id) });
    qc.invalidateQueries({ queryKey: projectKeys.lists() });
    qc.invalidateQueries({ queryKey: milestoneKeys.project(id) });
    qc.invalidateQueries({ queryKey: changeRequestsKeys().project(id) });
    qc.invalidateQueries({ queryKey: updatesKeys().project(id) });
  };
}

function changeRequestsKeys() {
  return { project: (id: string) => ['change-requests', 'project', id] as const };
}
function updatesKeys() {
  return { project: (id: string) => ['updates', 'project', id] as const };
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: projectsApi.CreateProjectInput) => projectsApi.createProject(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Project created');
    },
    onError: handleApiError,
  });
}

export function useUpdateProject(id: string) {
  const invalidate = useInvalidateProject(id);
  return useMutation({
    mutationFn: (body: Partial<projectsApi.CreateProjectInput>) => projectsApi.updateProject(id, body),
    onSuccess: () => {
      invalidate();
      toast.success('Project updated');
    },
    onError: handleApiError,
  });
}

export function useChangeProjectStatus(id: string) {
  const invalidate = useInvalidateProject(id);
  return useMutation({
    mutationFn: (status: string) => projectsApi.changeProjectStatus(id, status as never),
    onSuccess: () => {
      invalidate();
      toast.success('Status updated');
    },
    onError: handleApiError,
  });
}

export function useChangeProjectHealth(id: string) {
  const invalidate = useInvalidateProject(id);
  return useMutation({
    mutationFn: (health: string) => projectsApi.changeProjectHealth(id, health as never),
    onSuccess: () => {
      invalidate();
      toast.success('Health updated');
    },
    onError: handleApiError,
  });
}

export function usePauseProject(id: string) {
  const invalidate = useInvalidateProject(id);
  return useMutation({
    mutationFn: (reason?: string) => projectsApi.pauseProject(id, reason),
    onSuccess: () => {
      invalidate();
      toast.success('Project paused');
    },
    onError: handleApiError,
  });
}

export function useResumeProject(id: string) {
  const invalidate = useInvalidateProject(id);
  return useMutation({
    mutationFn: () => projectsApi.resumeProject(id),
    onSuccess: () => {
      invalidate();
      toast.success('Project resumed');
    },
    onError: handleApiError,
  });
}

export function useCompleteProject(id: string) {
  const invalidate = useInvalidateProject(id);
  return useMutation({
    mutationFn: (notes?: string) => projectsApi.completeProject(id, notes),
    onSuccess: () => {
      invalidate();
      toast.success('Project marked as completed');
    },
    onError: handleApiError,
  });
}

export function useArchiveProject(id: string) {
  const invalidate = useInvalidateProject(id);
  return useMutation({
    mutationFn: () => projectsApi.archiveProject(id),
    onSuccess: () => {
      invalidate();
      toast.success('Project archived');
    },
    onError: handleApiError,
  });
}

export function useSetProgressOverride(id: string) {
  const invalidate = useInvalidateProject(id);
  return useMutation({
    mutationFn: (body: { progressPercentage: number; reason?: string }) =>
      projectsApi.setProgressOverride(id, body.progressPercentage, body.reason),
    onSuccess: () => {
      invalidate();
      toast.success('Progress override applied');
    },
    onError: handleApiError,
  });
}

export function useClearProgressOverride(id: string) {
  const invalidate = useInvalidateProject(id);
  return useMutation({
    mutationFn: () => projectsApi.clearProgressOverride(id),
    onSuccess: () => {
      invalidate();
      toast.success('Progress override cleared');
    },
    onError: handleApiError,
  });
}

// ─── Milestones ───────────────────────────────────────────────────
export function useMilestones(projectId: string) {
  return useQuery({
    queryKey: milestoneKeys.project(projectId),
    queryFn: () => milestoneApi.listMilestones(projectId),
    enabled: Boolean(projectId),
  });
}

export function useCreateMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: milestoneApi.CreateMilestoneInput) => milestoneApi.createMilestone(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: milestoneKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success('Milestone added');
    },
    onError: handleApiError,
  });
}

export function useUpdateMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & milestoneApi.CreateMilestoneInput) =>
      milestoneApi.updateMilestone(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: milestoneKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success('Milestone updated');
    },
    onError: handleApiError,
  });
}

export function useChangeMilestoneStatus(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      milestoneApi.changeMilestoneStatus(id, status as never),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: milestoneKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success('Milestone status updated');
    },
    onError: handleApiError,
  });
}

export function useDeleteMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => milestoneApi.deleteMilestone(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: milestoneKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success('Milestone deleted');
    },
    onError: handleApiError,
  });
}

// ─── Tasks ────────────────────────────────────────────────────────
export function useTasks(milestoneId: string) {
  return useQuery({
    queryKey: taskKeys.milestone(milestoneId),
    queryFn: () => taskApi.listTasks(milestoneId),
    enabled: Boolean(milestoneId),
  });
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, ...body }: { milestoneId: string } & taskApi.CreateTaskInput) =>
      taskApi.createTask(milestoneId, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: taskKeys.milestone(vars.milestoneId) });
      qc.invalidateQueries({ queryKey: milestoneKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success('Task added');
    },
    onError: handleApiError,
  });
}

export function useUpdateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & taskApi.CreateTaskInput) => taskApi.updateTask(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: milestoneKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success('Task updated');
    },
    onError: handleApiError,
  });
}

export function useChangeTaskStatus(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      taskApi.changeTaskStatus(id, status as never),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: milestoneKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success('Task status updated');
    },
    onError: handleApiError,
  });
}

export function useDeleteTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskApi.deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: milestoneKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success('Task deleted');
    },
    onError: handleApiError,
  });
}