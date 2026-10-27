import type { IsoDate, Weekday } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

export function toIsoDate(y: number, m: number, d: number): IsoDate {
  return `${y}-${pad(m)}-${pad(d)}`;
}

function parts(date: IsoDate): [number, number, number] {
  const [y, m, d] = date.split('-').map(Number);
  return [y, m, d];
}

/** Aggiunge giorni a una data, senza problemi di fuso orario. */
export function addDays(date: IsoDate, days: number): IsoDate {
  const [y, m, d] = parts(date);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return toIsoDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

export function weekdayOf(date: IsoDate): Weekday {
  const [y, m, d] = parts(date);
  const js = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = domenica
  return (js === 0 ? 7 : js) as Weekday;
}

/** Il prossimo giorno con quel weekday, oggi compreso. */
export function nextWeekday(today: IsoDate, weekday: Weekday): IsoDate {
  const diff = (weekday - weekdayOf(today) + 7) % 7;
  return addDays(today, diff);
}

/** Data con giorno e mese: se è già passata quest'anno, usa l'anno prossimo. */
export function upcomingDate(today: IsoDate, month: number, day: number): IsoDate {
  const [y] = parts(today);
  const candidate = toIsoDate(y, month, day);
  return candidate < today ? toIsoDate(y + 1, month, day) : candidate;
}

export function dateRange(from: IsoDate, to: IsoDate): IsoDate[] {
  const out: IsoDate[] = [];
  for (let d = from; d <= to && out.length < 366; d = addDays(d, 1)) out.push(d);
  return out;
}

export function todayIn(timeZone = 'Europe/Rome', now = new Date()): IsoDate {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  return f.format(now);
}

export function formatDateIt(date: IsoDate): string {
  const [y, m, d] = parts(date);
  const months = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  return `${d} ${months[m - 1]} ${y}`;
}
