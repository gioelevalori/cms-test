import { categoryProfile } from './categories';

/**
 * Le pagine contengono blocchi che LEGGONO i dati dell'attività, non li copiano.
 * Il layout lo decide il costruttore (owner/builder); il cliente cambia solo i dati.
 */
export interface PageBlock {
  id: string;
  type: 'hero' | 'about' | 'hours' | 'catalog' | 'posts' | 'contacts' | 'text';
  options: Record<string, string | number | boolean>;
}

export const BLOCK_TYPES: PageBlock['type'][] = ['hero', 'about', 'hours', 'catalog', 'posts', 'contacts', 'text'];

export function isValidLayout(value: unknown): value is PageBlock[] {
  return (
    Array.isArray(value) &&
    value.length <= 50 &&
    value.every(
      (b) =>
        b && typeof b === 'object' &&
        typeof b.id === 'string' && b.id.length > 0 && b.id.length <= 50 &&
        BLOCK_TYPES.includes(b.type) &&
        b.options && typeof b.options === 'object' && !Array.isArray(b.options) &&
        Object.values(b.options).every((v) => ['string', 'number', 'boolean'].includes(typeof v)),
    )
  );
}

export const DEFAULT_LAYOUT: PageBlock[] = [
  { id: 'hero', type: 'hero', options: { subtitle: '' } },
  { id: 'posts', type: 'posts', options: { limit: 3 } },
  { id: 'catalog', type: 'catalog', options: { title: 'Menu' } },
  { id: 'hours', type: 'hours', options: { title: 'Orari' } },
  { id: 'about', type: 'about', options: { title: 'Chi siamo' } },
  { id: 'contacts', type: 'contacts', options: { title: 'Contatti' } },
];

/** Layout iniziale di una nuova attività: la sezione con voci e prezzi prende il nome giusto per il suo tipo. */
export function layoutFor(category: string): PageBlock[] {
  const title = categoryProfile(category).catalogTitle;
  return DEFAULT_LAYOUT.map((b) => (b.type === 'catalog' ? { ...b, options: { ...b.options, title } } : { ...b, options: { ...b.options } }));
}
