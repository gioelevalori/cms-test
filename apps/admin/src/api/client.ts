import type { BusinessData, ChangeOp, OpenStatus, PageBlock, Role } from '@cms/shared';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
export const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'http://localhost:3001';
const TOKEN_KEY = 'cms_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage non disponibile */
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  if (res.status === 401 && path !== '/auth/login') {
    setToken(null);
    window.location.hash = '#/login';
  }
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new ApiError(res.status, msg ?? `Errore ${res.status}`);
  }
  return body as T;
}

/** Carica una foto (multipart): restituisce l'URL, che poi entra nei dati con una modifica. */
async function uploadPhoto(businessId: string, file: File): Promise<string> {
  const token = getToken();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL}/businesses/${businessId}/photos`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.message ?? `Errore ${res.status}`);
  return body.url as string;
}

export interface BusinessSummary {
  id: string; slug: string; name: string; role: Role;
  category: string; categoryLabel: string; logo: string | null; cover: string | null; accent: string; look: string;
  status: OpenStatus; items: number; photos: number; pending: number; updatedAt: string | null;
}
export interface BusinessDetail { id: string; slug: string; timezone: string; role: Role; data: BusinessData }
export interface Change {
  id: string;
  status: 'proposed' | 'applied' | 'rejected' | 'undone';
  source: 'chat' | 'form';
  message: string | null;
  summary: string[];
  createdAt: string;
  appliedAt: string | null;
  author?: string;
}
export type ChatResult = (Change & { unrecognized: string[]; engine: string }) | { status: 'not_understood'; unrecognized: string[]; engine: string };
export interface Page { slug: string; title: string; layout: PageBlock[] }

const post = <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });

export interface Me { id: string; email: string; name: string; whatsapp: string | null; whatsappBusinessId: string | null }
export interface WhatsAppLink { code: string; message: string; expiresAt: string; number: string | null; link: string | null }

export const api = {
  me: () => request<Me>('/auth/me'),
  forgotPassword: (email: string) => post<{ ok: true }>('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => post<{ accessToken: string }>('/auth/reset-password', { token, password }),
  whatsAppLink: (businessId: string) => post<WhatsAppLink>('/whatsapp/link', { businessId }),
  unlinkWhatsApp: () => request<Me>('/auth/me/whatsapp', { method: 'PUT', body: JSON.stringify({ phone: '' }) }),
  login: (email: string, password: string) => post<{ accessToken: string }>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) => post<{ accessToken: string }>('/auth/register', { name, email, password }),
  businesses: () => request<BusinessSummary[]>('/businesses'),
  createBusiness: (name: string, slug: string, category: string) => post<{ id: string; slug: string; name: string }>('/businesses', { name, slug, category }),
  setCategory: (id: string, category: string) =>
    request<{ category: string }>(`/businesses/${id}/category`, { method: 'PUT', body: JSON.stringify({ category }) }),
  business: (id: string) => request<BusinessDetail>(`/businesses/${id}`),
  uploadPhoto,
  chat: (id: string, message: string) => post<ChatResult>(`/businesses/${id}/chat`, { message }),
  proposeOps: (id: string, ops: ChangeOp[]) => post<Change>(`/businesses/${id}/changes`, { ops }),
  changes: (id: string) => request<Change[]>(`/businesses/${id}/changes`),
  confirm: (changeId: string) => post<Change>(`/changes/${changeId}/confirm`),
  reject: (changeId: string) => post<Change>(`/changes/${changeId}/reject`),
  undo: (changeId: string) => post<Change>(`/changes/${changeId}/undo`),
  pages: (id: string) => request<Page[]>(`/businesses/${id}/pages`),
  savePage: (id: string, slug: string, layout: PageBlock[]) =>
    request<Page>(`/businesses/${id}/pages/${slug}`, { method: 'PUT', body: JSON.stringify({ layout }) }),
};
