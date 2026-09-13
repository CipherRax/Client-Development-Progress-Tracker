import { apiRequest } from './client';
import type { Admin, AuthResponse } from './types';
import { useAuthStore } from '@/stores/auth-store';

export async function register(name: string, email: string, password: string) {
  const { data } = await apiRequest<Admin>('/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  useAuthStore.getState().setSession(data.admin, data.tokens);
  return data;
}

export async function refresh() {
  const rt = useAuthStore.getState().refreshToken;
  if (!rt) throw new Error('No refresh token');
  const { data } = await apiRequest<AuthResponse>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken: rt },
  });
  useAuthStore.getState().setSession(data.admin, data.tokens);
  return data;
}

export async function logout() {
  try {
    const rt = useAuthStore.getState().refreshToken;
    if (rt) {
      await apiRequest<unknown>('/auth/logout', {
        method: 'POST',
        body: { refreshToken: rt },
        auth: true,
      });
    }
  } finally {
    useAuthStore.getState().clearSession();
  }
}

export async function getProfile() {
  const { data } = await apiRequest<Admin>('/profile', { auth: true });
  return data;
}

export async function updateProfile(body: { name?: string; email?: string }) {
  const { data } = await apiRequest<Admin>('/profile', { method: 'PATCH', body, auth: true });
  return data;
}

export async function changePassword(body: { currentPassword: string; newPassword: string }) {
  const { data } = await apiRequest<{ message: string }>('/profile/password', {
    method: 'PATCH',
    body,
    auth: true,
  });
  return data;
}