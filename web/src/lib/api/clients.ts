import { apiRequest } from './client';
import type { Client, PaginationMeta } from './types';

export interface ClientFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listClients(filters: ClientFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const qs = params.toString();
  const { data, meta } = await apiRequest<Client[]>(`/clients${qs ? `?${qs}` : ''}`, { auth: true });
  return { clients: data, meta: meta as PaginationMeta };
}

export async function getClient(id: string) {
  const { data } = await apiRequest<Client>(`/clients/${id}`, { auth: true });
  return data;
}

export interface CreateClientInput {
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  notes?: string;
  status?: string;
}

export async function createClient(body: CreateClientInput) {
  const { data } = await apiRequest<Client>('/clients', { method: 'POST', body, auth: true });
  return data;
}

export async function updateClient(id: string, body: Partial<CreateClientInput>) {
  const { data } = await apiRequest<Client>(`/clients/${id}`, { method: 'PATCH', body, auth: true });
  return data;
}

export async function archiveClient(id: string) {
  const { data } = await apiRequest<Client>(`/clients/${id}/archive`, { method: 'POST', auth: true });
  return data;
}