import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as clientsApi from '@/lib/api/clients';
import { handleApiError } from './common';

export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  detail: (id: string) => [...clientKeys.all, 'detail', id] as const,
};

export function useClients(filters: clientsApi.ClientFilters = {}) {
  return useQuery({
    queryKey: [...clientKeys.lists(), filters],
    queryFn: () => clientsApi.listClients(filters),
    placeholderData: (prev) => prev,
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => clientsApi.getClient(id),
    enabled: Boolean(id),
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: clientsApi.CreateClientInput) => clientsApi.createClient(body),
    onSuccess: (client) => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      toast.success(`Client "${client.name}" created`);
    },
    onError: (e) => handleApiError(e),
  });
}

export function useUpdateClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<clientsApi.CreateClientInput>) => clientsApi.updateClient(id, body),
    onSuccess: (client) => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      qc.invalidateQueries({ queryKey: clientKeys.detail(id) });
      toast.success(`Client "${client.name}" updated`);
    },
    onError: (e) => handleApiError(e),
  });
}

export function useArchiveClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientsApi.archiveClient(id),
    onSuccess: (client) => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      qc.invalidateQueries({ queryKey: clientKeys.detail(client.id) });
      toast.success(`Client "${client.name}" archived`);
    },
    onError: (e) => handleApiError(e),
  });
}