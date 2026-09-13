import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as publicApi from '@/lib/api/public';
import { handleApiError } from './common';

export function usePublicDashboard(token: string | null) {
  return useQuery({
    queryKey: ['public-dashboard', token],
    queryFn: () => publicApi.getPublicDashboard(token!),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useContactForm(token: string) {
  return useMutation({
    mutationFn: (body: { name: string; email: string; message: string }) =>
      publicApi.sendContactMessage(token, body),
    onSuccess: () => {
      toast.success('Message sent — thanks for reaching out!');
    },
    onError: handleApiError,
  });
}