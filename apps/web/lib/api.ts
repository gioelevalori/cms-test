import { cache } from 'react';
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

/** Risposte di un'API che si sta svegliando (Render gratuito la spegne dopo 15 minuti senza visite). */
const WAKING = [502, 503, 504];
/** Quanto aspettare tra un tentativo e l'altro: in tutto circa un minuto, il tempo che serve all'API per ripartire. */
const WAITS_MS = [2000, 3000, 5000, 8000, 10000, 12000, 15000];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Dati dall'API. Se l'API sta ripartendo non si arrende subito: riprova finché risponde.
 * `cache` di React: titolo della pagina e pagina usano la stessa richiesta, non due.
 */
const fetchJson = cache(async (path: string): Promise<PublicBusiness | null> => {
  for (let attempt = 0; ; attempt++) {
    let status: number;
    try {
      // Ogni tentativo è una richiesta nuova: Next riusa le richieste uguali fatte durante la stessa pagina,
      // e senza segnale e intestazione diversi un tentativo fallito tornerebbe identico a ogni giro.
      const res = await fetch(`${API_URL}${path}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(20_000),
        headers: { 'x-attempt': String(attempt) },
      });
      if (res.status === 404) return null;
      if (res.ok) return res.json();
      status = res.status;
    } catch {
      status = 0; // rete: l'API non risponde ancora
    }
    if ((status !== 0 && !WAKING.includes(status)) || attempt >= WAITS_MS.length) throw new Error(`API ${status || 'non raggiungibile'}`);
    await sleep(WAITS_MS[attempt]);
  }
});

/** Sempre dati freschi: una modifica confermata in chat si vede subito sul sito. */
export const getBusiness = (slug: string) => fetchJson(`/public/businesses/${encodeURIComponent(slug)}`);

/** Il sito come sarà dopo la proposta `changeId`. */
export const getPreview = (slug: string, changeId: string) =>
  fetchJson(`/public/businesses/${encodeURIComponent(slug)}/preview/${encodeURIComponent(changeId)}`);
