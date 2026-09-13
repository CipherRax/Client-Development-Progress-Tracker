import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as crApi from '@/lib/api/changeRequests';
import { changeRequestKeys, handleApiError, projectKeys } from './common';

export function useChangeRequests(projectId: string) {
  return useQuery({
    queryKey: changeRequestKeys.project(projectId),
    queryFn: () => crApi.listChangeRequests(projectId),
    enabled: Boolean(projectId),
  });
}

export function useCreateChangeRequest(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: crApi.CreateChangeRequestInput) => crApi.createChangeRequest(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: changeRequestKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success('Change request raised');
    },
    onError: handleApiError,
  });
}

export function useUpdateChangeRequest(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & crApi.CreateChangeRequestInput) =>
      crApi.updateChangeRequest(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: changeRequestKeys.project(projectId) });
      toast.success('Change request updated');
    },
    onError: handleApiError,
  });
}

export function useApproveChangeRequest(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crApi.approveChangeRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: changeRequestKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success('Change request approved');
    },
    onError: handleApiError,
  });
}

export function useRejectChangeRequest(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crApi.rejectChangeRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: changeRequestKeys.project(projectId) });
      toast.success('Change request rejected');
    },
    onError: handleApiError,
  });
}

export function useCancelChangeRequest(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crApi.cancelChangeRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: changeRequestKeys.project(projectId) });
      toast.success('Change request cancelled');
    },
    onError: handleApiError,
  });
}