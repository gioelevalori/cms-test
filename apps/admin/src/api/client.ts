import type { Block, Role } from '@cms/shared';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
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
  constructor(public status: number, public body: { message?: string; violations?: { blockId: string; reason: string }[] }) {
    super(body.message ?? `Errore ${status}`);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (res.status === 401) {
    setToken(null);
    window.location.href = '/login';
  }
  const body = res.status === 204 ? null : await res.json();
  if (!res.ok) throw new ApiError(res.status, body ?? {});
  return body as T;
}

export interface Site { id: string; name: string; slug: string; role: Role; theme: Record<string, string> }
export interface PageSummary { id: string; slug: string; title: string; status: 'draft' | 'published'; updatedAt: string }
export interface PageDetail extends PageSummary { draft: Block[]; published: Block[] | null; role: Role }

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; user: { name: string } }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  sites: () => request<Site[]>('/sites'),
  site: (siteId: string) => request<Site>(`/sites/${siteId}`),
  pages: (siteId: string) => request<PageSummary[]>(`/sites/${siteId}/pages`),
  createPage: (siteId: string, title: string, slug: string) =>
    request<PageSummary>(`/sites/${siteId}/pages`, { method: 'POST', body: JSON.stringify({ title, slug }) }),
  page: (siteId: string, pageId: string) => request<PageDetail>(`/sites/${siteId}/pages/${pageId}`),
  saveDraft: (siteId: string, pageId: string, blocks: Block[]) =>
    request<PageDetail>(`/sites/${siteId}/pages/${pageId}/draft`, { method: 'PUT', body: JSON.stringify({ blocks }) }),
  publish: (siteId: string, pageId: string) =>
    request<PageDetail>(`/sites/${siteId}/pages/${pageId}/publish`, { method: 'POST' }),
};
