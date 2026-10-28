import type { BusinessData, CatalogItem, IsoDate, Post, PostKind, Time, TimeSlot, Weekday } from './types';
import { WEEKDAY_NAMES } from './types';
import { formatDateIt } from './dates';

/**
 * Una modifica ai dati dell'attività. Ogni messaggio in chat diventa una lista di operazioni,
 * mostrate in anteprima e applicate solo dopo la conferma.
 */
export type ChangeOp =
  | { op: 'setWeeklyHours'; weekday: Weekday; slots: TimeSlot[] }
  | { op: 'setSpecialHours'; date: IsoDate; closed: boolean; opens: Time | null; closes: Time | null; note: string | null }
  | { op: 'removeSpecialHours'; date: IsoDate }
  | { op: 'addCatalogItem'; section: string; name: string; description: string; price: number | null }
  | { op: 'setItemPrice'; itemId: string; price: number }
  | { op: 'setItemAvailability'; itemId: string; available: boolean }
  | { op: 'removeCatalogItem'; itemId: string }
  | { op: 'addPost'; kind: PostKind; title: string; body: string; startsAt: IsoDate | null; endsAt: IsoDate | null }
  | { op: 'setContact'; field: 'phone' | 'email' | 'address' | 'description'; value: string };

export type IdGenerator = () => string;

const TIME_RE = /^([01]\d|2[0-4]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CONTACT_FIELDS = ['phone', 'email', 'address', 'description'];
const POST_KINDS = ['news', 'event', 'offer'];

const isTime = (v: unknown): v is Time => typeof v === 'string' && TIME_RE.test(v);
const isTimeOrNull = (v: unknown) => v === null || isTime(v);

/** Una fascia oraria possibile: chiude dopo l'apertura, o dopo mezzanotte entro le 6 (es. 19:00–02:00). */
export const isPossibleSlot = (opens: Time, closes: Time) => opens !== closes && (opens < closes || closes <= '06:00');
const isDate = (v: unknown): v is IsoDate => typeof v === 'string' && DATE_RE.test(v);
const isDateOrNull = (v: unknown) => v === null || isDate(v);
const isStr = (v: unknown, max = 2000): v is string => typeof v === 'string' && v.length <= max;

/** Controlla che un valore arrivato dall'esterno (API, AI) sia un'operazione valida. */
export function isValidOp(value: unknown): value is ChangeOp {
  const o = value as Record<string, unknown>;
  if (!o || typeof o !== 'object') return false;
  switch (o.op) {
    case 'setWeeklyHours':
      return Number.isInteger(o.weekday) && (o.weekday as number) >= 1 && (o.weekday as number) <= 7 &&
        Array.isArray(o.slots) && o.slots.every((s: Record<string, unknown>) => isTime(s?.opens) && isTime(s?.closes) && isPossibleSlot(s.opens, s.closes));
    case 'setSpecialHours':
      return isDate(o.date) && typeof o.closed === 'boolean' && isTimeOrNull(o.opens) && isTimeOrNull(o.closes) &&
        !(isTime(o.opens) && isTime(o.closes) && !isPossibleSlot(o.opens, o.closes)) && (o.note === null || isStr(o.note, 200));
    case 'removeSpecialHours':
      return isDate(o.date);
    case 'addCatalogItem':
      return isStr(o.section, 100) && isStr(o.name, 200) && (o.name as string).length > 0 && isStr(o.description, 1000) &&
        (o.price === null || (typeof o.price === 'number' && o.price >= 0));
    case 'setItemPrice':
      return isStr(o.itemId, 100) && typeof o.price === 'number' && o.price >= 0;
    case 'setItemAvailability':
      return isStr(o.itemId, 100) && typeof o.available === 'boolean';
    case 'removeCatalogItem':
      return isStr(o.itemId, 100);
    case 'addPost':
      return POST_KINDS.includes(o.kind as string) && isStr(o.title, 200) && (o.title as string).length > 0 && isStr(o.body, 5000) &&
        isDateOrNull(o.startsAt) && isDateOrNull(o.endsAt);
    case 'setContact':
      return CONTACT_FIELDS.includes(o.field as string) && isStr(o.value, 2000);
    default:
      return false;
  }
}

function findItem(data: BusinessData, id: string): CatalogItem {
  const item = data.catalog.find((i) => i.id === id);
  if (!item) throw new Error(`Voce non trovata: ${id}`);
  return item;
}

/** Applica le operazioni e restituisce dei nuovi dati. Funzione pura: non modifica l'input. */
export function applyOps(input: BusinessData, ops: ChangeOp[], newId: IdGenerator): BusinessData {
  const data: BusinessData = structuredClone(input);
  for (const op of ops) {
    switch (op.op) {
      case 'setWeeklyHours':
        data.openingHours = [
          ...data.openingHours.filter((h) => h.weekday !== op.weekday),
          ...op.slots.map((s) => ({ weekday: op.weekday, opens: s.opens, closes: s.closes })),
        ].sort((a, b) => a.weekday - b.weekday || a.opens.localeCompare(b.opens));
        break;
      case 'setSpecialHours': {
        const { op: _, ...special } = op;
        data.specialHours = [...data.specialHours.filter((s) => s.date !== op.date), special].sort((a, b) => a.date.localeCompare(b.date));
        break;
      }
      case 'removeSpecialHours':
        data.specialHours = data.specialHours.filter((s) => s.date !== op.date);
        break;
      case 'addCatalogItem':
        data.catalog.push({ id: newId(), section: op.section, name: op.name, description: op.description, price: op.price, available: true });
        break;
      case 'setItemPrice':
        findItem(data, op.itemId).price = op.price;
        break;
      case 'setItemAvailability':
        findItem(data, op.itemId).available = op.available;
        break;
      case 'removeCatalogItem':
        findItem(data, op.itemId);
        data.catalog = data.catalog.filter((i) => i.id !== op.itemId);
        break;
      case 'addPost': {
        const { op: _, ...post } = op;
        data.posts.unshift({ id: newId(), ...post } as Post);
        break;
      }
      case 'setContact':
        data[op.field] = op.value;
        break;
    }
  }
  return data;
}

const euro = (n: number) => `${n.toFixed(2).replace('.', ',')} €`;
const slotsText = (slots: TimeSlot[]) => slots.map((s) => `${s.opens}–${s.closes}`).join(' e ');

/** Frase in italiano che descrive l'operazione, per l'anteprima. */
export function describeOp(op: ChangeOp, data: BusinessData): string {
  const itemName = (id: string) => data.catalog.find((i) => i.id === id)?.name ?? id;
  switch (op.op) {
    case 'setWeeklyHours':
      return op.slots.length === 0
        ? `Ogni ${WEEKDAY_NAMES[op.weekday]}: chiuso`
        : `Ogni ${WEEKDAY_NAMES[op.weekday]}: ${slotsText(op.slots)}`;
    case 'setSpecialHours': {
      const when = formatDateIt(op.date);
      if (op.closed) return `${when}: chiuso${op.note ? ` (${op.note})` : ''}`;
      return `${when}: ${op.opens ?? '?'}–${op.closes ?? '?'}${op.note ? ` (${op.note})` : ''}`;
    }
    case 'removeSpecialHours':
      return `${formatDateIt(op.date)}: torna l'orario normale`;
    case 'addCatalogItem':
      return `Nuova voce in "${op.section}": ${op.name}${op.price !== null ? ` a ${euro(op.price)}` : ''}`;
    case 'setItemPrice':
      return `${itemName(op.itemId)}: nuovo prezzo ${euro(op.price)}`;
    case 'setItemAvailability':
      return `${itemName(op.itemId)}: ${op.available ? 'di nuovo disponibile' : 'non disponibile'}`;
    case 'removeCatalogItem':
      return `Rimuovi ${itemName(op.itemId)}`;
    case 'addPost': {
      const label = { news: 'Notizia', event: 'Evento', offer: 'Offerta' }[op.kind];
      return `${label}: ${op.title}${op.startsAt ? ` (${formatDateIt(op.startsAt)})` : ''}`;
    }
    case 'setContact': {
      const label = { phone: 'Telefono', email: 'Email', address: 'Indirizzo', description: 'Descrizione' }[op.field];
      return `${label}: ${op.value}`;
    }
  }
}
