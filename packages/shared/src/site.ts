import type { BusinessData } from './types';
import { categoryProfile } from './categories';

/**
 * Come appare il sito: stile, colore, testi di presentazione, sezioni, social.
 * Fa parte dei dati dell'attività, quindi si cambia con le stesse modifiche (anteprima, annulla)
 * dal pannello o da WhatsApp. Ogni campo è facoltativo: se manca vale il predefinito del tipo di attività.
 */
export interface SiteSettings {
  look?: LookId;
  /** Colore principale, "#rrggbb". */
  accent?: string;
  /** Frase sotto il nome. */
  tagline?: string;
  /** Fino a tre punti di forza sotto la copertina. */
  highlights?: string[];
  /** Ordine delle sezioni; quelle non elencate seguono nell'ordine predefinito. */
  order?: SectionId[];
  hidden?: SectionId[];
  /** Titoli scelti dal titolare ("La nostra cucina" invece di "Menu"). */
  titles?: Partial<Record<SectionId, string>>;
  links?: Partial<Record<LinkId, string>>;
}

export type LookId = 'trattoria' | 'atelier' | 'bottega' | 'clinica' | 'energia';

export const LOOKS: { id: LookId; label: string; description: string; font: string }[] = [
  { id: 'trattoria', label: 'Calda', description: 'Carattere morbido, carta color crema, foto a tutto campo', font: "'Young Serif', Georgia, serif" },
  { id: 'atelier', label: 'Elegante', description: 'Carattere raffinato, testo e foto affiancati su tinta tenue', font: "'Gloock', Georgia, serif" },
  { id: 'bottega', label: 'Decisa', description: 'Titoli forti in maiuscolo, foto scura', font: "'Archivo', 'Onest', sans-serif" },
  { id: 'clinica', label: 'Pulita', description: 'Luminosa e ordinata, foto incorniciata', font: "'Onest', sans-serif" },
  { id: 'energia', label: 'Energica', description: 'Fondo scuro, titoli larghi, accento acceso', font: "'Unbounded', 'Onest', sans-serif" },
];

export type SectionId = 'highlights' | 'catalog' | 'hours' | 'posts' | 'where' | 'gallery' | 'about';

export const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'highlights', label: 'Punti di forza' },
  { id: 'catalog', label: 'Menu, listino o servizi' },
  { id: 'about', label: 'Chi siamo' },
  { id: 'hours', label: 'Orari' },
  { id: 'posts', label: 'Novità' },
  { id: 'gallery', label: 'Galleria foto' },
  { id: 'where', label: 'Dove siamo' },
];

export type LinkId = 'instagram' | 'facebook' | 'tiktok' | 'website';

export const LINKS: { id: LinkId; label: string }[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'website', label: 'Altro sito' },
];

/** Colori con un nome, scelti scuri abbastanza da leggere testo bianco sopra. */
export const COLORS: Record<string, string> = {
  rosso: '#b42318',
  bordeaux: '#7a1f2b',
  arancione: '#c2410c',
  terracotta: '#b4441a',
  oro: '#a16207',
  giallo: '#a16207',
  verde: '#2f7d32',
  'verde scuro': '#1f5130',
  oliva: '#5b6b1f',
  turchese: '#0e6b62',
  azzurro: '#1d6fa5',
  blu: '#2448d8',
  'blu scuro': '#1e3a8a',
  viola: '#6d28d9',
  lilla: '#8b5cb8',
  rosa: '#a3305f',
  fucsia: '#b0156a',
  marrone: '#7c4a2d',
  grigio: '#4b5563',
  nero: '#1f2328',
};

const DEFAULT_LOOK: Record<string, LookId> = {
  restaurant: 'trattoria',
  bar: 'bottega',
  shop: 'bottega',
  beauty: 'atelier',
  gym: 'energia',
};

const DEFAULT_ACCENT: Record<string, string> = {
  restaurant: '#a61e22',
  bar: '#b4441a',
  shop: '#b4441a',
  beauty: '#a3305f',
  gym: '#3b3fb6',
  doctor: '#0e6b62',
  lawyer: '#1e3a8a',
  insurance: '#1d6fa5',
};

export const isHexColor = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);

/** Le impostazioni complete, con i predefiniti del tipo di attività dove il titolare non ha scelto. */
export function resolveSite(data: Pick<BusinessData, 'category' | 'site'>) {
  const s = data.site ?? {};
  const profile = categoryProfile(data.category);
  const order = [...(s.order ?? []).filter((id) => SECTIONS.some((x) => x.id === id))];
  for (const { id } of SECTIONS) if (!order.includes(id)) order.push(id);
  const titles: Record<SectionId, string> = {
    highlights: 'Punti di forza',
    catalog: profile.catalogTitle,
    about: 'Chi siamo',
    hours: 'Orari',
    posts: 'Novità',
    gallery: 'Foto',
    where: 'Dove siamo',
    ...s.titles,
  };
  return {
    look: s.look && LOOKS.some((l) => l.id === s.look) ? s.look : DEFAULT_LOOK[data.category] ?? 'clinica',
    accent: isHexColor(s.accent) ? s.accent : DEFAULT_ACCENT[data.category] ?? '#2448d8',
    tagline: s.tagline ?? '',
    highlights: s.highlights ?? [],
    order,
    hidden: s.hidden ?? [],
    titles,
    links: s.links ?? {},
  };
}

/** "@pizzeriamario" o "instagram.com/pizzeriamario" → indirizzo completo del profilo. */
export function linkUrl(network: LinkId, value: string): string | null {
  const v = value.trim();
  if (/^https?:\/\/\S+$/i.test(v)) return v;
  const handle = v.replace(/^@/, '').replace(/^(?:www\.)?(?:instagram|facebook|tiktok)\.com\/@?/i, '').replace(/\/+$/, '');
  if (network === 'website') return /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v) ? `https://${v}` : null;
  if (!/^[\w.]{1,60}$/.test(handle)) return null;
  return { instagram: `https://instagram.com/${handle}`, facebook: `https://facebook.com/${handle}`, tiktok: `https://tiktok.com/@${handle}` }[network];
}

/** Una sezione ha qualcosa da mostrare? Le vuote non compaiono sul sito, così non ci sono buchi. */
export function sectionHasContent(data: BusinessData, id: SectionId): boolean {
  const site = resolveSite(data);
  switch (id) {
    case 'highlights': return site.highlights.length > 0;
    case 'catalog': return data.catalog.length > 0;
    // Senza frase scelta, la descrizione va sotto il nome e "Chi siamo" non la ripete.
    case 'about': return Boolean(site.tagline && data.description);
    case 'hours': return data.openingHours.length > 0 || data.specialHours.length > 0;
    case 'posts': return data.posts.length > 0;
    case 'gallery': return (data.photos ?? []).length > 0;
    case 'where': return Boolean(data.address);
  }
}
