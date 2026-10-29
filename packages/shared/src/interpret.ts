import type { BusinessData, CatalogItem, IsoDate, Time, TimeSlot, Weekday } from './types';
import { isPossibleSlot, type ChangeOp } from './operations';
import { addDays, dateRange, nextWeekday, upcomingDate } from './dates';
import { categoryProfile } from './categories';
import { interpretSite } from './interpret-site';

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

const NUMBER_WORDS: Record<string, number> = {
  una: 1, uno: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10,
  undici: 11, dodici: 12, tredici: 13, quattordici: 14, quindici: 15, sedici: 16, diciassette: 17, diciotto: 18,
  diciannove: 19, venti: 20, ventuno: 21, ventidue: 22, ventitre: 23, ventiquattro: 24,
};
const NUMBER_WORD_ALT = Object.keys(NUMBER_WORDS).sort((a, b) => b.length - a.length).join('|');

/**
 * Gli orari come li scrive la gente diventano cifre: "alle otto e mezza" → "alle 8:30",
 * "all'una di notte" → "all'1", "alle 4 del pomeriggio" → "alle 16", "ore 9" e "9h" → "9".
 */
function wordTimes(text: string): string {
  return text
    .replace(/\bmezzogiorno\b/g, '12')
    .replace(/\bmezzanotte\b/g, '24')
    .replace(new RegExp(`\\b(dalle|alle|all'|le|fino alle|fino a|verso le|ore|e)\\s*(${NUMBER_WORD_ALT})\\b`, 'g'), (_, p: string, w: string) => `${p} ${NUMBER_WORDS[w]}`)
    .replace(/\b(dall[e']|all[e']|fino(?: alle| a)?)\s*(?:ore|h)\s+/g, '$1 ')
    .replace(/\b(\d{1,2})\s*h\b/g, '$1')
    .replace(/\b(\d{1,2})\s+e\s+mezz[ao]\b/g, '$1:30')
    .replace(/\b(\d{1,2})\s+e\s+(?:un\s+)?quarto\b/g, '$1:15')
    .replace(/\b(\d{1,2})\s+meno\s+(?:un\s+)?quarto\b/g, (_, h: string) => `${Number(h) - 1}:45`)
    // "le 4 del pomeriggio", "le 8 di sera": dopo mezzogiorno. "di notte" e "di mattina" restano come sono.
    .replace(/\b(\d{1,2})(?:[:.](\d{2}))?\s+(?:del|di|della)\s+(?:pomeriggio|sera)\b/g, (m: string, h: string, mm?: string) =>
      Number(h) < 12 ? `${Number(h) + 12}${mm ? `:${mm}` : ''}` : m.replace(/\s+(?:del|di|della)\s+\w+$/, ''))
    .replace(/\b(\d{1,2}(?:[:.]\d{2})?)\s+(?:di|del)\s+(?:notte|mattina|mattino)\b/g, '$1');
}

/** "dalle 8 alle 18", "dalle 8 fino 18", "dall'una alle 3", "8-18", "8:00 - 18:00", "9-13 e 15-19". */
function findRanges(text: string): TimeSlot[] {
  const out: TimeSlot[] = [];
  const push = (h1: string, m1: string | undefined, h2: string, m2: string | undefined) => {
    const opens = toTime(h1, m1);
    const closes = toTime(h2, m2);
    if (opens && closes) out.push({ opens, closes });
  };
  const words = new RegExp(`dall[e']\\s*${TIME}\\s*(?:fino\\s+alle|fino\\s+all'|fino\\s+a|fino|alle|all'|a|[-–])\\s*${TIME}`, 'g');
  let rest = text;
  for (const m of text.matchAll(words)) {
    push(m[1], m[2], m[3], m[4]);
    rest = rest.replace(m[0], ' ');
  }
  // Trattino tra due orari, ma non tra due giorni del mese ("10-20 agosto") né tra prezzi ("5-6 euro").
  const dash = new RegExp(`(?<![\\d/.,:])${TIME}\\s*[-–]\\s*${TIME}(?![\\d/,]|\\s*(?:${MONTH_ALT}|euro|€))`, 'g');
  for (const m of rest.matchAll(dash)) push(m[1], m[2], m[3], m[4]);
  return out.filter((s) => s.opens !== s.closes);
}

/** L'orario dopo un verbo, anche con qualche parola in mezzo: "chiudiamo prima, alle 16". */
function findTimeAfter(text: string, verbs: string): Time | null {
  const m = text.match(new RegExp(`\\b(?:${verbs})\\b[^\\d]{0,20}?\\b(?:alle|all'|verso le|a)\\s*${TIME}`));
  return m ? toTime(m[1], m[2]) : null;
}

function findClose(t: string): Time | null {
  const after = findTimeAfter(t, 'chiud\\w*|chiusura|fino');
  if (after) return after;
  // "fino 18", senza "alle".
  const bare = t.match(new RegExp(`\\bfino\\s+${TIME}\\b`));
  return bare ? toTime(bare[1], bare[2]) : null;
}
function findOpen(t: string): Time | null {
  const after = findTimeAfter(t, 'apr\\w*|apertura|apriremo');
  if (after) return after;
  // "fino all'una, dalle 18": un "dalle" senza il suo "alle" è l'apertura.
  const from = t.match(new RegExp(`\\bdall[e']\\s*${TIME}\\b`));
  return from ? toTime(from[1], from[2]) : null;
}
const isClosed = (t: string) =>
  /\bchius[oiae]\b|\bnon apriamo\b|\bnon (?:siamo|saremo) aperti\b|\bferie\b|\bvacanz[ae]\b|\bnon lavoriamo\b|\b(?:giorno di )?riposo\b/.test(t);
const isBackToNormal = (t: string) => /\borari[oi]? (normale|regolare|solito|abituale)\b/.test(t);

type DayTarget = { kind: 'weekly'; weekdays: Weekday[] } | { kind: 'dates'; dates: IsoDate[] };

const ALL_DAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];
const WD = `(${WEEKDAY_ALT})`;

/** "dal lunedì al venerdì", "da lunedì a venerdì", "lunedì-venerdì": i giorni in mezzo compresi (anche venerdì → lunedì). */
function weekdaySpan(text: string): Weekday[] | null {
  const m = text.match(new RegExp(`\\b(?:dal|da)\\s+${WD}\\s+(?:fino\\s+)?(?:al|a)\\s+${WD}\\b`))
    ?? text.match(new RegExp(`\\b${WD}\\s*[-–]\\s*${WD}\\b`));
  if (!m) return null;
  const from = WEEKDAYS[m[1]];
  const to = WEEKDAYS[m[2]];
  const out: Weekday[] = [];
  for (let d = from; ; d = ((d % 7) + 1) as Weekday) {
    out.push(d);
    if (d === to || out.length === 7) break;
  }
  return out;
}

/** "tranne il lunedì", "escluso la domenica", "eccetto sabato e domenica": i giorni da togliere. */
function exceptDays(text: string): Weekday[] {
  const m = text.match(/\b(?:tranne|eccetto|escluso|esclusa|esclusi|salvo)\b(.*)$/);
  if (!m) return [];
  return [...m[1].matchAll(new RegExp(`\\b${WD}\\b`, 'g'))].map((x) => WEEKDAYS[x[1]]);
}

/**
 * Settimanale o una data precisa? Si guarda come la gente lo dice:
 * "il lunedì", "ogni lunedì", "tutti i lunedì", "dal lunedì al venerdì", "tutti i giorni" → sempre;
 * "lunedì", "questo lunedì", "lunedì prossimo", "domani", "il 25 dicembre" → solo quel giorno.
 * Più giorni elencati con i loro orari ("lunedì e martedì 9-13") sono un orario della settimana.
 */
function findDays(text: string, today: IsoDate): DayTarget | null {
  const oneOff = /\b(?:questo|questa|quest'|prossim[oa]|domani|dopodomani|oggi|stasera|stamattina)\b/.test(text);
  const except = exceptDays(text);
  const weekly = (days: Weekday[]): DayTarget => ({ kind: 'weekly', weekdays: days.filter((d) => !except.includes(d)) });

  if (!oneOff) {
    if (/\b(?:tutti i giorni|ogni giorno|tutta la settimana|sempre aperti|7 giorni su 7|sette giorni su sette)\b/.test(text)) return weekly(ALL_DAYS);
    if (/\b(?:nei |i )?(?:giorni )?feriali\b|\bdal lunedi al venerdi\b/.test(text) && !weekdaySpan(text)) return weekly([1, 2, 3, 4, 5]);
    if (/\b(?:nel |il |ogni |tutti i )?(?:weekend|fine settimana|fine-settimana)\b/.test(text)) return weekly([6, 7]);
    const span = weekdaySpan(text);
    if (span) return weekly(span);
  }
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

  // I giorni nominati, nell'ordine; quelli dopo "tranne" non contano.
  const head = text.replace(/\b(?:tranne|eccetto|escluso|esclusa|esclusi|salvo)\b.*$/, '');
  const named = [...new Set([...head.matchAll(new RegExp(`\\b${WD}\\b`, 'g'))].map((m) => WEEKDAYS[m[1]]))];
  if (named.length && !oneOff) {
    // Settimanale: "ogni sabato", "il lunedì", "tutte le domeniche", "di domenica", "i sabati", "lunedì: 8-18".
    const marker = new RegExp(`\\b(?:ogni|tutti i|tutte le|il|la|i|le|di)\\s+${WD}\\b|\\b(?:sabati|domeniche)\\b|^${WD}\\s*:`).test(head);
    // Giorni con le loro fasce e nessun verbo ("lunedì 8-18", "martedì 9-13 e 15-19", "lunedì e martedì dalle 9 alle 13")
    // sono l'orario della settimana. Con un verbo ("sabato chiudiamo alle 15", "lunedì apriamo dalle 10") è solo quel giorno.
    const timetable = findRanges(wordTimes(text)).length > 0 && !/\b(?:apr\w*|chiud\w*|siamo|saremo|restiamo|resteremo|facciamo|faremo)\b/.test(text);
    if (marker || timetable) return weekly(named);
  }

  if (/\bweekend\b|\bfine settimana\b/.test(text)) {
    // "questo weekend", "il prossimo fine settimana": il sabato e la domenica in arrivo.
    let sat = nextWeekday(today, 6);
    if (/\bprossim[oa]\b/.test(text) && sat === today) sat = addDays(sat, 7);
    return { kind: 'dates', dates: [sat, addDays(sat, 1)] };
  }
  if (/\bdopodomani\b/.test(text)) return { kind: 'dates', dates: [addDays(today, 2)] };
  if (/\bdomani\b/.test(text)) return { kind: 'dates', dates: [addDays(today, 1)] };
  if (/\boggi\b|\bstasera\b|\bstamattina\b/.test(text)) return { kind: 'dates', dates: [today] };

  const dated = text.match(new RegExp(`\\b(\\d{1,2})\\s+(${MONTH_ALT})\\b`));
  if (dated) return { kind: 'dates', dates: [upcomingDate(today, MONTHS[dated[2]], Number(dated[1]))] };

  const numeric = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (numeric) {
    const d = Number(numeric[1]);
    const m = Number(numeric[2]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return { kind: 'dates', dates: [upcomingDate(today, m, d)] };
  }

  // Giorni singoli: "sabato", "questa domenica", "sabato prossimo", "sabato e domenica chiusi".
  if (named.length) {
    const dates = named.map((d) => {
      const date = nextWeekday(today, d);
      return /\bprossim[oa]\b/.test(text) && date === today ? addDays(date, 7) : date;
    });
    return { kind: 'dates', dates: [...new Set(dates)].sort() };
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

/** Una chiusura fino alle 6 di mattina è dopo mezzanotte (es. 19:00–02:00). */
const isAfterMidnight = (t: Time) => t <= '06:00';

/**
 * Applica "apriamo alle X" / "chiudiamo alle Y" alle fasce abituali del giorno:
 * chiudere alle 15 con 12–14:30 e 19–23:30 lascia 12–15. Null se l'orario contraddice
 * il giorno (es. chiudere alle 18 quando si apre alle 19).
 */
function adjustSlots(regular: TimeSlot[], open: Time | null, close: Time | null): TimeSlot[] | null {
  let slots = regular.map((s) => ({ ...s }));
  if (close) {
    if (!isAfterMidnight(close)) slots = slots.filter((s) => s.opens < close);
    if (!slots.length) return null;
    slots[slots.length - 1].closes = close;
  }
  if (open) {
    slots = slots.filter((s) => isAfterMidnight(s.closes) || s.closes > open);
    if (!slots.length) return null;
    slots[0].opens = open;
  }
  return slots.every((s) => isPossibleSlot(s.opens, s.closes)) ? slots : null;
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
    if (!target.weekdays.length) return null;
    if (ranges.length && !ranges.every((s) => isPossibleSlot(s.opens, s.closes))) return null;
    const ops: ChangeOp[] = [];
    // Tutti i giorni nominati, o nessuno: mai mezzo messaggio applicato.
    for (const weekday of target.weekdays) {
      if (closed && !hasTimes) ops.push({ op: 'setWeeklyHours', weekday, slots: [] });
      else if (ranges.length) ops.push({ op: 'setWeeklyHours', weekday, slots: ranges });
      else if (open || close) {
        const regular = regularDay(data, weekday).slots;
        if (!regular.length && !(open && close)) return null;
        const slots = regular.length ? adjustSlots(regular, open, close) : [{ opens: open!, closes: close! }];
        if (!slots || !slots.every((s) => isPossibleSlot(s.opens, s.closes))) return null;
        ops.push({ op: 'setWeeklyHours', weekday, slots });
      } else return null;
    }
    return ops;
  }

  const note = findNote(original);
  if (isBackToNormal(t)) return target.dates.map((date) => ({ op: 'removeSpecialHours' as const, date }));
  if (closed && !hasTimes) {
    return target.dates.map((date) => ({ op: 'setSpecialHours' as const, date, closed: true, opens: null, closes: null, note }));
  }
  if (!hasTimes) return null;
  // Un giorno speciale ha una sola fascia: "oggi 9-13 e 15-19" non si può salvare senza perderne una.
  if (ranges.length > 1) return null;

  const ops: ChangeOp[] = [];
  for (const date of target.dates) {
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay() || 7;
    const regular = regularDay(data, weekday as Weekday);
    let opens = ranges[0]?.opens ?? open ?? regular.opens;
    let closes = ranges[0]?.closes ?? close ?? regular.closes;
    if (!ranges.length && regular.slots.length) {
      const slots = adjustSlots(regular.slots, open, close);
      if (!slots) return null;
      opens = slots[0].opens;
      closes = slots[slots.length - 1].closes;
    }
    // Su un giorno di solito chiuso servono entrambi gli orari: "chiudiamo alle 15" da solo non dice quando si apre.
    if (!opens || !closes || !isPossibleSlot(opens, closes)) return null;
    ops.push({ op: 'setSpecialHours', date, closed: false, opens, closes, note });
  }
  return ops;
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
  // "costa 6", "a 6,50", "il prezzo dello spritz è 5,50" (il testo è senza accenti: è → e).
  const withVerb = text.match(/\b(?:costa|costano|prezzo|a|e|diventa|passa a)\s*(?:di\s*)?(\d+(?:[.,]\d{1,2})?)\s*$/);
  return withVerb ? parsePrice(withVerb[1]) : null;
}

// L'articolo è una parola a sé: "la lasagna" → "lasagna", ma "lasagna" resta intera.
const ARTICLES = /^(?:(?:il|lo|la|i|gli|le|un|uno|una)\s+|l'|un')/i;

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
      // Il prezzo in fondo, con la sua parola staccata: "lasagna 12 euro" non perde la "a" finale.
      .replace(/(?:\s+(?:a|al prezzo di|prezzo|da))?\s+\d+(?:[.,]\d{1,2})?\s*(?:€|euro)?\s*$/i, '')
      .replace(/\s*(?:al menu|al menù|al listino)\s*$/i, '')
      .replace(ARTICLES, '')
      .trim();
    if (!rest) return null;
    const lastSection = data.catalog.at(-1)?.section ?? categoryProfile(data.category).defaultSection;
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

  // "Il nuovo indirizzo è Via Roma 1": la "è" non fa parte dell'indirizzo.
  const address = original.match(/(?:nuovo indirizzo(?:\s+(?:è|e)(?=\s))?|indirizzo nuovo|l'indirizzo è|l'indirizzo e|indirizzo:|ci siamo trasferiti in|ci trovate in|nuova sede(?:\s+(?:è|e)(?=\s))?(?:\s+in)?)\s*:?\s*(.+)$/i);
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
      interpretSite(text, clause, data) ??
      interpretCatalog(text, clause, data) ??
      interpretHours(text, clause, data, today);
    if (result && result.length) ops.push(...result);
    else unrecognized.push(clause);
  }
  return { ops, unrecognized };
}

/**
 * Una foto arrivata con una didascalia (da WhatsApp o dal pannello) diventa:
 * logo o copertina se la didascalia lo dice, la foto di una voce nuova o esistente se la nomina,
 * altrimenti una foto della galleria con la didascalia.
 */
export function interpretPhoto(caption: string, url: string, data: BusinessData, today: IsoDate): Interpretation {
  const text = normalize(caption);
  if (/\blogo\b/.test(text)) return { ops: [{ op: 'setLogo', url }], unrecognized: [] };
  if (/\bcopertina\b/.test(text)) return { ops: [{ op: 'setCover', url }], unrecognized: [] };

  const fromText = text ? interpretMessage(caption, data, today) : { ops: [], unrecognized: [] };
  const added = fromText.ops.find((o) => o.op === 'addCatalogItem');
  if (added && added.op === 'addCatalogItem') {
    added.image = url;
    return fromText;
  }
  const item = findItem(text, data.catalog);
  if (item) return { ops: [{ op: 'setItemImage', itemId: item.id, url }], unrecognized: [] };

  const clean = caption.replace(/^\s*(?:foto|galleria|aggiungi(?: alla galleria)?|nella galleria)\s*:?\s*/i, '').trim();
  return { ops: [{ op: 'addPhoto', url, caption: clean.slice(0, 200) }], unrecognized: [] };
}

const formatEuro = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ','));

/**
 * Esempi per questa attività: quelli del suo tipo, più due costruiti su una sua voce vera
 * ("Diavola costa 9 euro"). Restano solo quelli che l'interprete capisce sui dati di oggi:
 * "chiudiamo alle 15" non compare se quel giorno di solito si è chiusi.
 */
export function examplesFor(data: BusinessData, today: IsoDate): string[] {
  const examples = ['Il martedì dalle 9 alle 18', ...categoryProfile(data.category).examples];
  const item = data.catalog.find((i) => i.available && i.price !== null);
  if (item) examples.splice(2, 0, `${item.name} costa ${formatEuro(item.price! + 1)} euro`, `${item.name} non disponibile`);
  const understood = examples.filter((e) => {
    const r = interpretMessage(e, data, today);
    return r.ops.length > 0 && r.unrecognized.length === 0;
  });
  // L'esempio degli orari serve solo a chi non li ha ancora scritti.
  return data.openingHours.length ? understood.filter((e) => e !== examples[0]) : understood;
}
