/**
 * Tipi dei blocchi che compongono una pagina.
 * Il contenuto di una pagina è un array di Block salvato come JSON.
 * Per aggiungere un tipo: aggiungilo a BlockPropsMap e a BLOCK_DEFINITIONS.
 */

export interface BlockPropsMap {
  hero: { title: string; subtitle: string; image: string | null; buttonText: string; buttonUrl: string };
  text: { heading: string; body: string };
  image: { src: string | null; alt: string; caption: string };
  gallery: { images: { src: string; alt: string }[] };
  contacts: { address: string; phone: string; email: string; hours: string };
  pricing: { heading: string; items: { name: string; price: string; description: string }[] };
}

export type BlockType = keyof BlockPropsMap;

export interface Block<T extends BlockType = BlockType> {
  id: string;
  type: T;
  /** Se true, un utente "client" non può spostare, eliminare o cambiare la struttura del blocco. */
  locked: boolean;
  /** Nomi delle props che un utente "client" può modificare (chiavi di BlockPropsMap[T]). */
  editableFields: string[];
  props: BlockPropsMap[T];
}

export type AnyBlock = { [K in BlockType]: Block<K> }[BlockType];

export type FieldKind = 'text' | 'longtext' | 'image' | 'url' | 'list';

export interface BlockDefinition<T extends BlockType> {
  type: T;
  label: string;
  fields: Record<keyof BlockPropsMap[T] & string, { label: string; kind: FieldKind }>;
  defaults: BlockPropsMap[T];
}

export const BLOCK_DEFINITIONS: { [K in BlockType]: BlockDefinition<K> } = {
  hero: {
    type: 'hero',
    label: 'Copertina',
    fields: {
      title: { label: 'Titolo', kind: 'text' },
      subtitle: { label: 'Sottotitolo', kind: 'text' },
      image: { label: 'Immagine', kind: 'image' },
      buttonText: { label: 'Testo pulsante', kind: 'text' },
      buttonUrl: { label: 'Link pulsante', kind: 'url' },
    },
    defaults: { title: 'Titolo', subtitle: 'Sottotitolo', image: null, buttonText: 'Scopri di più', buttonUrl: '#' },
  },
  text: {
    type: 'text',
    label: 'Testo',
    fields: {
      heading: { label: 'Titolo', kind: 'text' },
      body: { label: 'Testo', kind: 'longtext' },
    },
    defaults: { heading: 'Titolo della sezione', body: 'Scrivi qui il testo.' },
  },
  image: {
    type: 'image',
    label: 'Immagine',
    fields: {
      src: { label: 'Immagine', kind: 'image' },
      alt: { label: 'Testo alternativo', kind: 'text' },
      caption: { label: 'Didascalia', kind: 'text' },
    },
    defaults: { src: null, alt: '', caption: '' },
  },
  gallery: {
    type: 'gallery',
    label: 'Galleria',
    fields: { images: { label: 'Immagini', kind: 'list' } },
    defaults: { images: [] },
  },
  contacts: {
    type: 'contacts',
    label: 'Contatti',
    fields: {
      address: { label: 'Indirizzo', kind: 'text' },
      phone: { label: 'Telefono', kind: 'text' },
      email: { label: 'Email', kind: 'text' },
      hours: { label: 'Orari', kind: 'longtext' },
    },
    defaults: { address: '', phone: '', email: '', hours: '' },
  },
  pricing: {
    type: 'pricing',
    label: 'Prezzi',
    fields: {
      heading: { label: 'Titolo', kind: 'text' },
      items: { label: 'Voci', kind: 'list' },
    },
    defaults: { heading: 'Listino', items: [] },
  },
};

export function isBlockType(value: unknown): value is BlockType {
  return typeof value === 'string' && value in BLOCK_DEFINITIONS;
}

export function createBlock<T extends BlockType>(type: T, id: string): Block<T> {
  const def = BLOCK_DEFINITIONS[type];
  return {
    id,
    type,
    locked: false,
    editableFields: Object.keys(def.fields),
    props: structuredClone(def.defaults),
  };
}
