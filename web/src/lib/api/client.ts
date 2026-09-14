import { useAuthStore } from '@/stores/auth-store';
import type { ApiEnvelope, ApiErrorBody, PaginationMeta } from './types';

export class ApiError extends Error {
  statusCode: number;
  error: string;
  path?: string;
  errors?: string[];

  constructor(body: ApiErrorBody) {
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    super(message ?? 'Request failed');
    this.name = 'ApiError';
    this.statusCode = body.statusCode;
    this.error = body.error;
    this.path = body.path;
    this.errors = Array.isArray(body.message) ? body.message : undefined;
  }
}

// Default to same-origin /api/v1 so the app works when served from the same
// container as the backend (Next proxies /api/* to NestJS). Override with
// NEXT_PUBLIC_API_URL when the API is hosted elsewhere (e.g. local dev).
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const BASE_URL = configuredApiUrl ? configuredApiUrl.replace(/\/+$/, '') : '/api/v1';

// Single-flight refresh: concurrent 401s share one refresh attempt.
let refreshInFlight: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  const { refreshToken, setSession, clearSession } = useAuthStore.getState();
  if (!refreshToken) return false;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) {
          clearSession();
          return false;
        }
        const json = (await res.json()) as ApiEnvelope<{
          admin: { id: string; name: string; email: string; createdAt: string };
          tokens: { accessToken: string; refreshToken: string; expiresIn: number };
        }>;
        setSession(json.data.admin, json.data.tokens);
        return true;
      } catch {
        clearSession();
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Client-access token header; switch the request into public mode. */
  clientToken?: string;
  /** Admin-authenticated request (auto-refreshes on 401). */
  auth?: boolean;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta?: PaginationMeta; message?: string }> {
  const { method = 'GET', body, clientToken, auth, headers } = options;

  const send = async (): Promise<Response> => {
    const finalHeaders: Record<string, string> = {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    };

    if (clientToken) {
      finalHeaders['x-client-access-token'] = clientToken;
    } else if (auth) {
      const accessToken = useAuthStore.getState().accessToken;
      if (!accessToken) throw new ApiError({ statusCode: 401, error: 'Unauthorized', message: 'Not signed in.' } as ApiErrorBody);
      finalHeaders['Authorization'] = `Bearer ${accessToken}`;
    }

    return fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await send();

  // Silent refresh + retry exactly once for admin requests.
  if (res.status === 401 && auth && !clientToken) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      res = await send();
    }
  }

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const body = (json ?? {
      success: false,
      statusCode: res.status,
      error: 'Error',
      message: `Request failed with status ${res.status}`,
    }) as ApiErrorBody;
    throw new ApiError(body);
  }

  if (json && typeof json.success === 'boolean') {
    const envelope = json as ApiEnvelope<T>;
    return { data: envelope.data, meta: envelope.meta, message: envelope.message };
  }

  return { data: json as T };
}

export { BASE_URL };