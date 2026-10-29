import type { SiteSettings } from './site';

/**
 * Dati dell'attività: sono il cuore del CMS.
 * Il sito, la scheda Google e i dati schema.org sono solo modi diversi di mostrarli.
 */

/** 1 = lunedì ... 7 = domenica (ISO 8601). */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Orario "HH:MM" nel fuso dell'attività. */
export type Time = string;

/** Data "YYYY-MM-DD". */
export type IsoDate = string;

export interface TimeSlot {
  opens: Time;
  closes: Time;
}

export interface OpeningHours extends TimeSlot {
  weekday: Weekday;
}

export interface SpecialHours {
  date: IsoDate;
  closed: boolean;
  opens: Time | null;
  closes: Time | null;
  note: string | null;
}

export interface CatalogItem {
  id: string;
  section: string;
  name: string;
  description: string;
  /** Prezzo in euro, null se non indicato. */
  price: number | null;
  available: boolean;
  /** Foto della voce (URL Cloudinary), se c'è. */
  image?: string | null;
}

/** Una foto della galleria. */
export interface Photo {
  id: string;
  url: string;
  caption: string;
}

export type PostKind = 'news' | 'event' | 'offer';

export interface Post {
  id: string;
  kind: PostKind;
  title: string;
  body: string;
  startsAt: IsoDate | null;
  endsAt: IsoDate | null;
}

export interface BusinessData {
  name: string;
  category: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  /** Foto di copertina in cima al sito. Assente nei dati salvati prima delle foto. */
  cover?: string | null;
  /** Logo dell'attività (meglio PNG trasparente o SVG). Assente nei dati salvati prima del logo. */
  logo?: string | null;
  /** Galleria, nell'ordine in cui si mostra. */
  photos?: Photo[];
  /** Aspetto del sito: stile, colore, testi, sezioni, social. */
  site?: SiteSettings;
  openingHours: OpeningHours[];
  specialHours: SpecialHours[];
  catalog: CatalogItem[];
  posts: Post[];
}

export const ROLES = ['owner', 'builder', 'client'] as const;
export type Role = (typeof ROLES)[number];

/** owner e builder possono cambiare pagine e tema; client solo i dati dell'attività. */
export function canEditStructure(role: Role): boolean {
  return role === 'owner' || role === 'builder';
}

export const WEEKDAY_NAMES: Record<Weekday, string> = {
  1: 'lunedì',
  2: 'martedì',
  3: 'mercoledì',
  4: 'giovedì',
  5: 'venerdì',
  6: 'sabato',
  7: 'domenica',
};
