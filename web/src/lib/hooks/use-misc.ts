import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as updatesApi from '@/lib/api/updates';
import * as currentWorkApi from '@/lib/api/currentWork';
import * as activityApi from '@/lib/api/activity';
import { activityKeys, currentWorkKeys, handleApiError, projectKeys, updateKeys } from './common';

export function useUpdates(projectId: string) {
  return useQuery({
    queryKey: updateKeys.project(projectId),
    queryFn: () => updatesApi.listUpdates(projectId),
    enabled: Boolean(projectId),
  });
}

export function useCreateUpdate(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: updatesApi.CreateUpdateInput) => updatesApi.createUpdate(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: updateKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success('Update published');
    },
    onError: handleApiError,
  });
}

export function useDeleteUpdate(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => updatesApi.deleteUpdate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: updateKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success('Update deleted');
    },
    onError: handleApiError,
  });
}

export function useCurrentWork(projectId: string) {
  return useQuery({
    queryKey: currentWorkKeys.project(projectId),
    queryFn: () => currentWorkApi.getCurrentWork(projectId),
    enabled: Boolean(projectId),
  });
}

export function useSetCurrentWork(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: currentWorkApi.CurrentWorkInput) => currentWorkApi.setCurrentWork(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: currentWorkKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success('Current work saved');
    },
    onError: handleApiError,
  });
}

export function useClearCurrentWork(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => currentWorkApi.clearCurrentWork(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: currentWorkKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success('Current work cleared');
    },
    onError: handleApiError,
  });
}

export function useActivity(projectId: string, limit = 50) {
  return useQuery({
    queryKey: activityKeys.project(projectId),
    queryFn: () => activityApi.listActivity(projectId, limit),
    enabled: Boolean(projectId),
  });
}