import type { BusinessData, CatalogItem, IsoDate, Time, TimeSlot, Weekday } from './types';
import type { ChangeOp } from './operations';
import { addDays, dateRange, nextWeekday, upcomingDate } from './dates';

/**
 * Interprete a regole dei messaggi in italiano.
 * Copre i casi frequenti di una piccola attività (orari, prezzi, menu, contatti, notizie)
 * e funziona senza AI. L'API può affiancargli un modello linguistico per i casi difficili.
 */

export interface Interpretation {
  ops: ChangeOp[];
  /** Frasi del messaggio che non sono state capite. */
  unrecognized: string[];
}

const WEEKDAYS: Record<string, Weekday> = {
  lunedi: 1, martedi: 2, mercoledi: 3, giovedi: 4, venerdi: 5, sabato: 6, domenica: 7,
  sabati: 6, domeniche: 7,
};
const WEEKDAY_ALT = 'lunedi|martedi|mercoledi|giovedi|venerdi|sabati|sabato|domeniche|domenica';

const MONTHS: Record<string, number> = {
  gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6,
  luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12,
};
const MONTH_ALT = Object.keys(MONTHS).join('|');

/** Minuscolo, senza accenti, spazi singoli. Mantiene la lunghezza utile per estrarre dal testo originale. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’`]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function splitClauses(message: string): string[] {
  return message
    .split(/\n|;|[.!?](?=\s|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ---------- orari ----------

const TIME = '(\\d{1,2})(?:[:.](\\d{2}))?';

function toTime(h: string, m?: string): Time | null {
  const hh = Number(h);
  const mm = m ? Number(m) : 0;
  if (hh > 24 || mm > 59) return null;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function wordTimes(text: string): string {
  return text.replace(/\bmezzogiorno\b/g, '12').replace(/\bmezzanotte\b/g, '24');
}

function findRanges(text: string): TimeSlot[] {
  const re = new RegExp(`dall[e']\\s*${TIME}\\s*(?:alle|all'|a)\\s*${TIME}`, 'g');
  const out: TimeSlot[] = [];
  for (const m of text.matchAll(re)) {
    const opens = toTime(m[1], m[2]);
    const closes = toTime(m[3], m[4]);
    if (opens && closes) out.push({ opens, closes });
  }
  return out;
}

function findTimeAfter(text: string, verbs: string): Time | null {
  const m = text.match(new RegExp(`\\b(?:${verbs})\\s+(?:alle|all'|a|verso le)\\s*${TIME}`));
  return m ? toTime(m[1], m[2]) : null;
}

const findClose = (t: string) => findTimeAfter(t, 'chiud\\w*|chiusura|fino');
const findOpen = (t: string) => findTimeAfter(t, 'apr\\w*|apertura|apriremo');
const isClosed = (t: string) => /\bchius[oiae]\b|\bnon apriamo\b|\bnon siamo aperti\b|\bper ferie\b/.test(t);
const isBackToNormal = (t: string) => /\borari[oi]? (normale|regolare|solito|abituale)\b/.test(t);

type DayTarget = { kind: 'weekly'; weekday: Weekday } | { kind: 'dates'; dates: IsoDate[] };

function findDays(text: string, today: IsoDate): DayTarget | null {
  // Intervallo: "dal 10 al 20 agosto", "dal 28 dicembre al 2 gennaio"
  const range = text.match(new RegExp(`\\bdal(?:l')?\\s*(\\d{1,2})(?:\\s+(${MONTH_ALT}))?\\s+al(?:l')?\\s*(\\d{1,2})\\s+(${MONTH_ALT})`));
  if (range) {
    const toMonth = MONTHS[range[4]];
    const fromMonth = range[2] ? MONTHS[range[2]] : toMonth;
    const from = upcomingDate(today, fromMonth, Number(range[1]));
    let to = upcomingDate(today, toMonth, Number(range[3]));
    if (to < from) to = upcomingDate(addDays(from, 1), toMonth, Number(range[3]));
    return { kind: 'dates', dates: dateRange(from, to) };
  }

  // Settimanale: "ogni sabato", "il lunedì", "tutte le domeniche", "di domenica"
  const weekly = text.match(new RegExp(`\\b(?:ogni|tutti i|tutte le|il|la|di)\\s+(${WEEKDAY_ALT})\\b`));
  if (weekly) return { kind: 'weekly', weekday: WEEKDAYS[weekly[1]] };

  if (/\bdopodomani\b/.test(text)) return { kind: 'dates', dates: [addDays(today, 2)] };
  if (/\bdomani\b/.test(text)) return { kind: 'dates', dates: [addDays(today, 1)] };
  if (/\boggi\b|\bstasera\b/.test(text)) return { kind: 'dates', dates: [today] };

  const named = text.match(new RegExp(`\\b(\\d{1,2})\\s+(${MONTH_ALT})\\b`));
  if (named) return { kind: 'dates', dates: [upcomingDate(today, MONTHS[named[2]], Number(named[1]))] };

  const numeric = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (numeric) {
    const d = Number(numeric[1]);
    const m = Number(numeric[2]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return { kind: 'dates', dates: [upcomingDate(today, m, d)] };
  }

  // Giorno singolo: "sabato", "questa domenica", "sabato prossimo"
  const single = text.match(new RegExp(`\\b(${WEEKDAY_ALT})\\b`));
  if (single) {
    let date = nextWeekday(today, WEEKDAYS[single[1]]);
    if (/\bprossim[oa]\b/.test(text) && date === today) date = addDays(date, 7);
    return { kind: 'dates', dates: [date] };
  }
  return null;
}

function findNote(original: string): string | null {
  const m = original.match(/\bper\s+([^,]{3,60})$/i);
  return m ? m[1].trim() : null;
}

function regularDay(data: BusinessData, weekday: Weekday): { opens: Time | null; closes: Time | null; slots: TimeSlot[] } {
  const slots = data.openingHours
    .filter((h) => h.weekday === weekday)
    .map(({ opens, closes }) => ({ opens, closes }))
    .sort((a, b) => a.opens.localeCompare(b.opens));
  return {
    slots,
    opens: slots[0]?.opens ?? null,
    closes: slots.length ? slots.map((s) => s.closes).sort().at(-1)! : null,
  };
}

function interpretHours(text: string, original: string, data: BusinessData, today: IsoDate): ChangeOp[] | null {
  const t = wordTimes(text);
  const target = findDays(t, today);
  if (!target) return null;

  const closed = isClosed(t);
  const ranges = findRanges(t);
  const open = findOpen(t);
  const close = findClose(t);
  const hasTimes = ranges.length > 0 || open !== null || close !== null;

  if (target.kind === 'weekly') {
    if (closed && !hasTimes) return [{ op: 'setWeeklyHours', weekday: target.weekday, slots: [] }];
    if (ranges.length) return [{ op: 'setWeeklyHours', weekday: target.weekday, slots: ranges }];
    if (open || close) {
      const regular = regularDay(data, target.weekday).slots;
      if (!regular.length && !(open && close)) return null;
      const slots = regular.length ? regular.map((s) => ({ ...s })) : [{ opens: open!, closes: close! }];
      if (open) slots[0].opens = open;
      if (close) slots[slots.length - 1].closes = close;
      return [{ op: 'setWeeklyHours', weekday: target.weekday, slots }];
    }
    return null;
  }

  const note = findNote(original);
  if (isBackToNormal(t)) return target.dates.map((date) => ({ op: 'removeSpecialHours' as const, date }));
  if (closed && !hasTimes) {
    return target.dates.map((date) => ({ op: 'setSpecialHours' as const, date, closed: true, opens: null, closes: null, note }));
  }
  if (!hasTimes) return null;

  return target.dates.map((date) => {
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay() || 7;
    const regular = regularDay(data, weekday as Weekday);
    const opens = ranges[0]?.opens ?? open ?? regular.opens;
    const closes = ranges[0]?.closes ?? close ?? regular.closes;
    return { op: 'setSpecialHours' as const, date, closed: false, opens, closes, note };
  });
}

// ---------- catalogo ----------

function findItem(text: string, catalog: CatalogItem[]): CatalogItem | null {
  let best: CatalogItem | null = null;
  for (const item of catalog) {
    const name = normalize(item.name);
    if (name.length < 2) continue;
    const re = new RegExp(`(^|[^a-z0-9])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`);
    if (re.test(text) && (!best || name.length > normalize(best.name).length)) best = item;
  }
  return best;
}

const PRICE_WITH_CURRENCY = /(\d+(?:[.,]\d{1,2})?)\s*(?:€|euro\b)/;
const parsePrice = (s: string) => Number(s.replace(',', '.'));

function findPrice(text: string): number | null {
  const withCurrency = text.match(PRICE_WITH_CURRENCY);
  if (withCurrency) return parsePrice(withCurrency[1]);
  const withVerb = text.match(/\b(?:costa|costano|prezzo|a)\s*(?:di\s*)?(\d+(?:[.,]\d{1,2})?)\s*$/);
  return withVerb ? parsePrice(withVerb[1]) : null;
}

const ARTICLES = /^(?:il|lo|la|i|gli|le|l'|un|uno|una|un')\s*/i;

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function interpretCatalog(text: string, original: string, data: BusinessData): ChangeOp[] | null {
  // Aggiunta: "aggiungi al menu la diavola a 8 euro nella sezione pizze"
  if (/^(?:aggiungi|inserisci|metti nel menu|nuova voce|nuovo piatto|nuovo prodotto)\b/.test(text)) {
    const price = findPrice(text);
    let rest = original
      .replace(/^\s*(?:aggiungi|inserisci|metti nel menu|nuova voce|nuovo piatto|nuovo prodotto)\s*:?\s*/i, '')
      .replace(/^(?:al|nel|alla|nella)\s+(?:menu|menù|listino|carta)\s*/i, '');
    let section: string | null = null;
    const sectionMatch = rest.match(/\s*(?:nella sezione|in sezione|tra (?:le|i|gli)|nelle|nei|negli)\s+([^,]+?)\s*$/i);
    if (sectionMatch) {
      section = capitalize(sectionMatch[1].trim());
      rest = rest.slice(0, sectionMatch.index);
    }
    let description = '';
    const descMatch = rest.match(/\s*[:–-]\s+(.+)$/);
    if (descMatch) {
      description = descMatch[1].replace(PRICE_WITH_CURRENCY, '').replace(/\s+a\s*$/, '').trim();
      rest = rest.slice(0, descMatch.index);
    }
    rest = rest
      .replace(/\s*(?:a|al prezzo di|prezzo)?\s*\d+(?:[.,]\d{1,2})?\s*(?:€|euro)?\s*$/i, '')
      .replace(/\s*(?:al menu|al menù|al listino)\s*$/i, '')
      .replace(ARTICLES, '')
      .trim();
    if (!rest) return null;
    const lastSection = data.catalog.at(-1)?.section ?? 'Menu';
    return [{ op: 'addCatalogItem', section: section ?? lastSection, name: capitalize(rest), description, price }];
  }

  const item = findItem(text, data.catalog);
  if (!item) return null;

  if (/^(?:togli|rimuovi|elimina|cancella)\b/.test(text)) return [{ op: 'removeCatalogItem', itemId: item.id }];

  if (/\b(?:di nuovo disponibil[ei]|torna(?:no)? disponibil[ei]|disponibil[ei] di nuovo|e tornat[oaie]|c'e di nuovo|ce di nuovo)\b/.test(text)) {
    return [{ op: 'setItemAvailability', itemId: item.id, available: true }];
  }
  if (/\b(?:finit[oaie]|esaurit[oaie]|terminat[oaie]|non (?:c'e|ce|e) piu|non (?:e |sono )?disponibil[ei]|non abbiamo piu|manca(?:no)?)\b/.test(text)) {
    return [{ op: 'setItemAvailability', itemId: item.id, available: false }];
  }

  const price = findPrice(text);
  if (price !== null && /\b(?:costa|costano|prezzo|euro|a)\b|€/.test(text)) {
    return [{ op: 'setItemPrice', itemId: item.id, price }];
  }
  return null;
}

// ---------- contatti e notizie ----------

function interpretContact(text: string, original: string): ChangeOp[] | null {
  const email = original.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/);
  if (email && /\b(?:email|e-mail|mail|posta)\b/.test(text)) return [{ op: 'setContact', field: 'email', value: email[0] }];

  const phone = original.match(/(?:telefono|numero|tel\.?|cellulare|whatsapp)\D{0,25}(\+?\d[\d\s./-]{5,}\d)/i);
  if (phone) return [{ op: 'setContact', field: 'phone', value: phone[1].replace(/\s+/g, ' ').trim() }];

  const address = original.match(/(?:nuovo indirizzo|l'indirizzo è|l'indirizzo e|indirizzo:|ci siamo trasferiti in|ci trovate in|nuova sede in)\s*:?\s*(.+)$/i);
  if (address) return [{ op: 'setContact', field: 'address', value: address[1].trim() }];

  const description = original.match(/^\s*(?:descrizione|chi siamo)\s*:\s*(.+)$/i);
  if (description) return [{ op: 'setContact', field: 'description', value: description[1].trim() }];
  return null;
}

function interpretPost(text: string, original: string, today: IsoDate): ChangeOp[] | null {
  const m = original.match(/^\s*(notizia|news|avviso|annuncio|evento|offerta|promo|promozione)\b\s*(.*)$/i);
  if (!m) return null;
  const word = normalize(m[1]);
  const kind = word === 'evento' ? 'event' : ['offerta', 'promo', 'promozione'].includes(word) ? 'offer' : 'news';
  let rest = m[2].trim();
  let startsAt: IsoDate | null = null;

  const colon = rest.indexOf(':');
  const head = colon >= 0 ? rest.slice(0, colon) : '';
  if (colon >= 0) rest = rest.slice(colon + 1).trim();
  if (kind === 'event' || kind === 'offer') {
    const target = findDays(normalize(head || text), today);
    if (target?.kind === 'dates') startsAt = target.dates[0];
  }
  if (!rest) return null;
  const title = rest.length > 80 ? `${rest.slice(0, 77)}…` : rest;
  return [{ op: 'addPost', kind, title: capitalize(title), body: capitalize(rest), startsAt, endsAt: null }];
}

/**
 * Trasforma un messaggio in operazioni.
 * @param today data di oggi nel fuso dell'attività, "YYYY-MM-DD"
 */
export function interpretMessage(message: string, data: BusinessData, today: IsoDate): Interpretation {
  const ops: ChangeOp[] = [];
  const unrecognized: string[] = [];

  for (const clause of splitClauses(message)) {
    const text = normalize(clause);
    const result =
      interpretPost(text, clause, today) ??
      interpretContact(text, clause) ??
      interpretCatalog(text, clause, data) ??
      interpretHours(text, clause, data, today);
    if (result && result.length) ops.push(...result);
    else unrecognized.push(clause);
  }
  return { ops, unrecognized };
}
