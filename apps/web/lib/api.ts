import type { Block } from '@cms/shared';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export interface PublicPage {
  title: string;
  slug: string;
  blocks: Block[];
  seo: { description?: string };
  site: { name: string; theme: { primary?: string; font?: string }; locale: string };
}

/** Le pagine vengono rigenerate al massimo ogni 60 secondi (ISR). */
export async function getPublicPage(siteSlug: string, pageSlug: string): Promise<PublicPage | null> {
  const res = await fetch(`${API_URL}/public/sites/${siteSlug}/pages/${pageSlug}`, { next: { revalidate: 60 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
