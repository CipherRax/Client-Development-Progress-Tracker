import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import * as authApi from '@/lib/api/auth';
import { handleApiError } from './common';

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authApi.login(email, password),
    onError: handleApiError,
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: ({ name, email, password }: { name: string; email: string; password: string }) =>
      authApi.register(name, email, password),
    onSuccess: () => {
      toast.success('Account created — you can now sign in');
    },
    onError: handleApiError,
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      qc.clear();
      router.push('/login');
    },
    onError: () => {
      useAuthStore.getState().clearSession();
      qc.clear();
      router.push('/login');
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    retry: false,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const store = useAuthStore();
  return useMutation({
    mutationFn: (body: { name?: string; email?: string }) => authApi.updateProfile(body),
    onSuccess: (admin) => {
      store.updateAdmin(admin);
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated');
    },
    onError: handleApiError,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) => authApi.changePassword(body),
    onSuccess: () => {
      toast.success('Password changed');
    },
    onError: handleApiError,
  });
}

/**
 * Guards admin pages: redirects to /login if the session is expired.
 * In production we'd also rotate the token via a middleware; here the
 * 401 auto-refresh in the API client handles silent rotation.
 */
export function useAdminGuard() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token) router.replace('/login');
    else setReady(true);
  }, [token, router]);

  return ready;
}

/** Exposes a logout-and-redirect helper for global error boundaries. */
export function useEmergencyLogout() {
  const qc = useQueryClient();
  const router = useRouter();
  return () => {
    useAuthStore.getState().clearSession();
    qc.clear();
    router.push('/login');
  };
}

export { handleApiError };