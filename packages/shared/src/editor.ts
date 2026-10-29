import type { SectionId } from './site';
import type { BusinessData } from './types';

/** Cosa si può selezionare nell'editor: una sezione o una parte fissa della pagina. */
export type EditTarget = SectionId | 'brand' | 'hero' | 'footer';

/** Messaggi dal pannello alla pagina in modifica (dentro l'iframe). */
export type ToCanvas =
  /** `canStructure`: chi non decide la struttura (il cliente) non vede maniglie né "nascondi". */
  | { type: 'cms:data'; data: BusinessData; canStructure: boolean }
  | { type: 'cms:select'; target: EditTarget | null; scroll: boolean };

/** Messaggi dalla pagina in modifica al pannello. */
export type FromCanvas =
  | { type: 'cms:ready' }
  | { type: 'cms:select'; target: EditTarget }
  | { type: 'cms:order'; order: SectionId[] }
  | { type: 'cms:hide'; section: SectionId };

export const isFromCanvas = (m: unknown): m is FromCanvas =>
  typeof m === 'object' && m !== null && typeof (m as { type?: unknown }).type === 'string' && (m as { type: string }).type.startsWith('cms:');

/**
 * Sulla pagina si trascinano solo le sezioni visibili; l'ordine salvato le contiene tutte.
 * Le sezioni nascoste o vuote restano nei loro posti, quelle visibili riempiono i propri nel nuovo ordine.
 */
export function reorderVisible(fullOrder: SectionId[], visibleInNewOrder: SectionId[]): SectionId[] {
  const queue = [...visibleInNewOrder];
  return fullOrder.map((id) => (visibleInNewOrder.includes(id) ? queue.shift()! : id));
}

/** Sposta l'elemento da `from` a `to` (indici nella lista di partenza). */
export function moveInList<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to > from ? to - 1 : to, 0, item);
  return next;
}
