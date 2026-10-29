import type { BusinessData, CatalogItem, IsoDate, Post, PostKind, Time, TimeSlot, Weekday } from './types';

/** Le foto stanno su Cloudinary: si accettano solo indirizzi https di Cloudinary. */
export const isPhotoUrl = (v: unknown): v is string =>
  typeof v === 'string' && v.length <= 500 && /^https:\/\/res\.cloudinary\.com\/[\w-]+\/image\/upload\/\S+$/.test(v);
import { WEEKDAY_NAMES } from './types';
import { COLORS, LINKS, LOOKS, SECTIONS, isHexColor, resolveSite, type LinkId, type LookId, type SectionId } from './site';
import { formatDateIt } from './dates';

/**
 * Una modifica ai dati dell'attività. Ogni messaggio in chat diventa una lista di operazioni,
 * mostrate in anteprima e applicate solo dopo la conferma.
 */
export type ChangeOp =
  | { op: 'setWeeklyHours'; weekday: Weekday; slots: TimeSlot[] }
  | { op: 'setSpecialHours'; date: IsoDate; closed: boolean; opens: Time | null; closes: Time | null; note: string | null }
  | { op: 'removeSpecialHours'; date: IsoDate }
  | { op: 'addCatalogItem'; section: string; name: string; description: string; price: number | null; image?: string | null }
  | { op: 'setItemPrice'; itemId: string; price: number }
  | { op: 'setItemAvailability'; itemId: string; available: boolean }
  | { op: 'removeCatalogItem'; itemId: string }
  | { op: 'addPost'; kind: PostKind; title: string; body: string; startsAt: IsoDate | null; endsAt: IsoDate | null }
  | { op: 'setContact'; field: 'phone' | 'email' | 'address' | 'description'; value: string }
  | { op: 'setCover'; url: string | null }
  | { op: 'setLogo'; url: string | null }
  | { op: 'addPhoto'; url: string; caption: string }
  | { op: 'removePhoto'; photoId: string }
  | { op: 'setItemImage'; itemId: string; url: string | null }
  | { op: 'setLook'; look: LookId }
  | { op: 'setAccent'; color: string }
  | { op: 'setTagline'; text: string }
  | { op: 'setHighlights'; items: string[] }
  | { op: 'setSectionVisible'; section: SectionId; visible: boolean }
  | { op: 'moveSection'; section: SectionId; to: 'first' | 'last' | 'up' | 'down' }
  | { op: 'setSectionTitle'; section: SectionId; title: string }
  | { op: 'setLink'; network: LinkId; url: string | null };

/**
 * Operazioni sulla veste del sito (stile, colore, sezioni): solo chi ne decide la struttura,
 * cioè il titolare che l'ha creato o il costruttore. I testi e i social li cambia anche il cliente.
 */
export const STRUCTURE_OPS: ChangeOp['op'][] = ['setLook', 'setAccent', 'setSectionVisible', 'moveSection', 'setSectionTitle'];
const isSection = (v: unknown): v is SectionId => SECTIONS.some((s) => s.id === v);

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
        (o.price === null || (typeof o.price === 'number' && o.price >= 0)) && (o.image === undefined || o.image === null || isPhotoUrl(o.image));
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
    case 'setCover':
    case 'setLogo':
      return o.url === null || isPhotoUrl(o.url);
    case 'addPhoto':
      return isPhotoUrl(o.url) && isStr(o.caption, 200);
    case 'removePhoto':
      return isStr(o.photoId, 100);
    case 'setItemImage':
      return isStr(o.itemId, 100) && (o.url === null || isPhotoUrl(o.url));
    case 'setLook':
      return LOOKS.some((l) => l.id === o.look);
    case 'setAccent':
      return isHexColor(o.color);
    case 'setTagline':
      return isStr(o.text, 160);
    case 'setHighlights':
      return Array.isArray(o.items) && o.items.length <= 3 && o.items.every((i) => isStr(i, 80) && i.length > 0);
    case 'setSectionVisible':
      return isSection(o.section) && typeof o.visible === 'boolean';
    case 'moveSection':
      return isSection(o.section) && ['first', 'last', 'up', 'down'].includes(o.to as string);
    case 'setSectionTitle':
      return isSection(o.section) && isStr(o.title, 60);
    case 'setLink':
      return LINKS.some((l) => l.id === o.network) && (o.url === null || (isStr(o.url, 300) && /^https:\/\/\S+$/.test(o.url as string)));
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
        data.catalog.push({ id: newId(), section: op.section, name: op.name, description: op.description, price: op.price, available: true, ...(op.image ? { image: op.image } : {}) });
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
      case 'setCover':
        data.cover = op.url;
        break;
      case 'setLogo':
        data.logo = op.url;
        break;
      case 'addPhoto':
        data.photos = [...(data.photos ?? []), { id: newId(), url: op.url, caption: op.caption }];
        break;
      case 'removePhoto':
        if (!data.photos?.some((p) => p.id === op.photoId)) throw new Error(`Foto non trovata: ${op.photoId}`);
        data.photos = data.photos.filter((p) => p.id !== op.photoId);
        break;
      case 'setItemImage':
        findItem(data, op.itemId).image = op.url;
        break;
      default:
        data.site = applySiteOp(data, op);
    }
  }
  return data;
}

/** Le operazioni sulla veste del sito, applicate alle impostazioni (copiate, mai modificate sul posto). */
function applySiteOp(data: BusinessData, op: ChangeOp): BusinessData['site'] {
  const site = { ...data.site };
  switch (op.op) {
    case 'setLook':
      site.look = op.look;
      break;
    case 'setAccent':
      site.accent = op.color.toLowerCase();
      break;
    case 'setTagline':
      site.tagline = op.text.trim();
      break;
    case 'setHighlights':
      site.highlights = op.items.map((i) => i.trim());
      break;
    case 'setSectionVisible': {
      const hidden = (site.hidden ?? []).filter((s) => s !== op.section);
      site.hidden = op.visible ? hidden : [...hidden, op.section];
      break;
    }
    case 'moveSection': {
      const order = resolveSite(data).order.filter((s) => s !== op.section);
      const at = resolveSite(data).order.indexOf(op.section);
      const to = { first: 0, last: order.length, up: Math.max(0, at - 1), down: Math.min(order.length, at + 1) }[op.to];
      order.splice(to, 0, op.section);
      site.order = order;
      break;
    }
    case 'setSectionTitle': {
      const titles = { ...site.titles };
      if (op.title.trim()) titles[op.section] = op.title.trim();
      else delete titles[op.section];
      site.titles = titles;
      break;
    }
    case 'setLink': {
      const links = { ...site.links };
      if (op.url) links[op.network] = op.url;
      else delete links[op.network];
      site.links = links;
      break;
    }
  }
  return site;
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
      return `Nuova voce in "${op.section}": ${op.name}${op.price !== null ? ` a ${euro(op.price)}` : ''}${op.image ? ', con foto' : ''}`;
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
    case 'setCover':
      return op.url ? 'Nuova foto di copertina' : 'Togli la foto di copertina';
    case 'setLogo':
      return op.url ? 'Nuovo logo' : "Togli il logo: al suo posto l'iniziale del nome";
    case 'addPhoto':
      return `Nuova foto nella galleria${op.caption ? `: ${op.caption}` : ''}`;
    case 'removePhoto': {
      const caption = data.photos?.find((p) => p.id === op.photoId)?.caption;
      return `Togli la foto${caption ? ` "${caption}"` : ''} dalla galleria`;
    }
    case 'setItemImage':
      return `${itemName(op.itemId)}: ${op.url ? 'nuova foto' : 'togli la foto'}`;
    case 'setLook':
      return `Stile del sito: ${LOOKS.find((l) => l.id === op.look)?.label ?? op.look}`;
    case 'setAccent': {
      const name = Object.entries(COLORS).find(([, hex]) => hex === op.color.toLowerCase())?.[0];
      return `Colore del sito: ${name ?? op.color}`;
    }
    case 'setTagline':
      return op.text.trim() ? `Frase sotto il nome: “${op.text.trim()}”` : 'Togli la frase sotto il nome';
    case 'setHighlights':
      return op.items.length ? `Punti di forza: ${op.items.join(', ')}` : 'Togli i punti di forza';
    case 'setSectionVisible':
      return `${op.visible ? 'Mostra' : 'Nascondi'} la sezione “${resolveSite(data).titles[op.section]}”`;
    case 'moveSection':
      return `Sposta “${resolveSite(data).titles[op.section]}” ${{ first: 'in alto', last: 'in fondo', up: 'più su', down: 'più giù' }[op.to]}`;
    case 'setSectionTitle':
      return op.title.trim()
        ? `Titolo della sezione “${resolveSite(data).titles[op.section]}”: ${op.title.trim()}`
        : `Titolo predefinito per “${resolveSite(data).titles[op.section]}”`;
    case 'setLink': {
      const label = LINKS.find((l) => l.id === op.network)?.label ?? op.network;
      return op.url ? `${label}: ${op.url}` : `Togli il link a ${label}`;
    }
  }
}

/**
 * Versione ridimensionata di una foto Cloudinary: formato e qualità scelti da Cloudinary
 * per il browser, ritaglio al centro se si danno larghezza e altezza.
 */
export function photoUrl(url: string, size: { w: number; h?: number }): string {
  const t = ['f_auto', 'q_auto', size.h ? `c_fill,g_auto,w_${size.w},h_${size.h}` : `c_limit,w_${size.w}`].join(',');
  return url.replace('/image/upload/', `/image/upload/${t}/`);
}
