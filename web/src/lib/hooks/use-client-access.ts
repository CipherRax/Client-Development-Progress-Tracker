import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as caApi from '@/lib/api/clientAccess';
import { clientAccessKeys, handleApiError, projectKeys } from './common';

export function useClientAccess(projectId: string) {
  return useQuery({
    queryKey: clientAccessKeys.project(projectId),
    queryFn: () => caApi.listClientAccess(projectId),
    enabled: Boolean(projectId),
  });
}

export function useGenerateClientAccess(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body?: caApi.GenerateAccessInput) => caApi.generateClientAccess(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientAccessKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success('Client access generated');
    },
    onError: handleApiError,
  });
}

export function useRevokeClientAccess(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => caApi.revokeClientAccess(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientAccessKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success('Client access revoked');
    },
    onError: handleApiError,
  });
}

export function useRegenerateClientAccess(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => caApi.regenerateClientAccess(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientAccessKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success('Token regenerated — the old token is now invalid');
    },
    onError: handleApiError,
  });
}