import type { BusinessData, PageBlock } from '@cms/shared';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export interface PublicBusiness {
  slug: string;
  theme: { primary?: string };
  timezone: string;
  pages: { slug: string; title: string; layout: PageBlock[] }[];
  data: BusinessData;
  schemaOrg: Record<string, unknown>;
  /** Solo nelle anteprime: la proposta da cui vengono i dati. */
  preview?: { status: 'proposed' | 'applied' | 'rejected' | 'undone'; summary: string[] };
}

async function fetchJson(path: string): Promise<PublicBusiness | null> {
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

/** Sempre dati freschi: una modifica confermata in chat si vede subito sul sito. */
export const getBusiness = (slug: string) => fetchJson(`/public/businesses/${encodeURIComponent(slug)}`);

/** Il sito come sarà dopo la proposta `changeId`. */
export const getPreview = (slug: string, changeId: string) =>
  fetchJson(`/public/businesses/${encodeURIComponent(slug)}/preview/${encodeURIComponent(changeId)}`);
