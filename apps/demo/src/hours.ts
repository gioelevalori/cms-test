import { weekdayOf, type BusinessData, type IsoDate, type TimeSlot, type Weekday } from '@cms/shared';

/** "09:00" → "9", "14:30" → "14:30": orari compatti da tabellone. */
const compact = (t: string | null) => (t ?? '').replace(/^0/, '').replace(/:00$/, '');

export const slotText = (s: TimeSlot) => `${compact(s.opens)}-${compact(s.closes)}`;

export function daySlots(data: BusinessData, d: Weekday): TimeSlot[] {
  return data.openingHours.filter((h) => h.weekday === d);
}

/** Orario di oggi per il tabellone, tenendo conto delle variazioni. */
export function todayHours(data: BusinessData, today: IsoDate): { text: string; closed: boolean; special: boolean } {
  const special = data.specialHours.find((s) => s.date === today);
  if (special) {
    return special.closed
      ? { text: 'CHIUSO', closed: true, special: true }
      : { text: slotText({ opens: special.opens ?? '', closes: special.closes ?? '' }), closed: false, special: true };
  }
  const slots = daySlots(data, weekdayOf(today));
  return slots.length ? { text: slots.map(slotText).join(' '), closed: false, special: false } : { text: 'CHIUSO', closed: true, special: false };
}
