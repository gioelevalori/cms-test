import type { BusinessData, PageBlock } from '@cms/shared';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export interface PublicBusiness {
  slug: string;
  theme: { primary?: string };
  timezone: string;
  pages: { slug: string; title: string; layout: PageBlock[] }[];
  data: BusinessData;
  schemaOrg: Record<string, unknown>;
}

/** Sempre dati freschi: una modifica confermata in chat si vede subito sul sito. */
export async function getBusiness(slug: string): Promise<PublicBusiness | null> {
  const res = await fetch(`${API_URL}/public/businesses/${encodeURIComponent(slug)}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
