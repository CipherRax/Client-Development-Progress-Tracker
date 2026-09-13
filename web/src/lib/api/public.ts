import { apiRequest } from './client';
import type { PublicDashboardData } from './types';

/**
 * Public API — everything here is gated by the client-access token passed via
 * the `x-client-access-token` header. The token is never stored or logged.
 */
export async function getPublicDashboard(token: string) {
  const { data } = await apiRequest<PublicDashboardData>('/public/project', {
    clientToken: token,
  });
  return data;
}

export async function sendContactMessage(
  token: string,
  body: { name: string; email: string; message: string },
) {
  const { data } = await apiRequest<{ message: string }>('/public/project/contact', {
    method: 'POST',
    body,
    clientToken: token,
  });
  return data;
}