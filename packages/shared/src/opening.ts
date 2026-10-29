import { addDays, weekdayOf } from './dates';
import { WEEKDAY_NAMES, type BusinessData, type IsoDate, type Time, type TimeSlot } from './types';

/** Ora corrente "HH:MM" nel fuso dell'attività. */
export function timeIn(timeZone = 'Europe/Rome', now = new Date()): Time {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return f.format(now);
}

/** Una fascia che chiude dopo mezzanotte (19–02) o a mezzanotte (19–00). */
const overnight = (s: TimeSlot) => s.closes <= s.opens;

/** Le fasce di apertura di un giorno preciso, variazioni comprese. */
export function slotsOn(data: BusinessData, date: IsoDate): TimeSlot[] {
  const regular = data.openingHours.filter((h) => h.weekday === weekdayOf(date)).map(({ opens, closes }) => ({ opens, closes }));
  const special = data.specialHours.find((s) => s.date === date);
  if (!special) return regular;
  if (special.closed) return [];
  if (special.opens && special.closes) return [{ opens: special.opens, closes: special.closes }];
  // Dati vecchi con solo apertura o solo chiusura: il resto viene dall'orario solito.
  if (special.opens) return [{ opens: special.opens, closes: regular.at(-1)?.closes ?? '23:59' }];
  if (special.closes) return [{ opens: regular[0]?.opens ?? '00:00', closes: special.closes }];
  return regular;
}

export interface OpenStatus {
  open: boolean;
  /** Aperto, ma chiude entro mezz'ora. */
  closingSoon: boolean;
  /** "Aperto ora", "Chiude tra poco", "Chiuso ora". */
  label: string;
  /** "chiude alle 23:30", "apre domani alle 12"; vuoto se non riapre entro una settimana. */
  detail: string;
}

/** "09:00" → "9", "14:30" → "14:30". */
const compact = (t: Time) => t.replace(/^0(?=\d)/, '').replace(/:00$/, '');
const minutes = (t: Time) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** Aperto o chiuso in questo momento, e quando cambia. */
export function openStatus(data: BusinessData, today: IsoDate, now: Time): OpenStatus {
  const openUntil = (closes: Time, minutesLeft: number): OpenStatus => {
    const closingSoon = minutesLeft <= 30;
    return { open: true, closingSoon, label: closingSoon ? 'Chiude tra poco' : 'Aperto ora', detail: `chiude alle ${compact(closes)}` };
  };

  // Una fascia di ieri sera può essere ancora aperta dopo mezzanotte.
  const lastNight = slotsOn(data, addDays(today, -1)).find((s) => overnight(s) && now < s.closes);
  if (lastNight) return openUntil(lastNight.closes, minutes(lastNight.closes) - minutes(now));

  const slots = slotsOn(data, today);
  const current = slots.find((s) => s.opens <= now && (overnight(s) || now < s.closes));
  if (current) {
    const left = overnight(current) ? 24 * 60 - minutes(now) + minutes(current.closes) : minutes(current.closes) - minutes(now);
    return openUntil(current.closes, left);
  }

  const closed = (detail: string): OpenStatus => ({ open: false, closingSoon: false, label: 'Chiuso ora', detail });
  const later = slots.find((s) => s.opens > now);
  if (later) return closed(`apre alle ${compact(later.opens)}`);
  for (let i = 1; i <= 7; i++) {
    const date = addDays(today, i);
    const first = slotsOn(data, date)[0];
    if (!first) continue;
    const day = i === 1 ? 'domani' : WEEKDAY_NAMES[weekdayOf(date)].toLowerCase();
    return closed(`apre ${day} alle ${compact(first.opens)}`);
  }
  return closed('');
}
