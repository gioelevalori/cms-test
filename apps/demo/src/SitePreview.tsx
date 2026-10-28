import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { WEEKDAY_NAMES, addDays, formatDateIt, weekdayOf, type BusinessData, type IsoDate, type Weekday } from '@cms/shared';

const euro = (n: number | null) => (n === null ? '' : `${n.toFixed(2).replace('.', ',')} €`);
const DAYS = [1, 2, 3, 4, 5, 6, 7] as Weekday[];
const REWRITE_MS = 1800;

function todayStatus(data: BusinessData, today: IsoDate): string {
  const special = data.specialHours.find((s) => s.date === today);
  if (special) return special.closed ? `Oggi chiuso${special.note ? ` (${special.note})` : ''}` : `Oggi aperto ${special.opens}–${special.closes}`;
  const slots = data.openingHours.filter((h) => h.weekday === weekdayOf(today));
  return slots.length ? `Oggi aperto ${slots.map((s) => `${s.opens}–${s.closes}`).join(' e ')}` : 'Oggi chiuso';
}

const daySlots = (data: BusinessData, d: Weekday) =>
  data.openingHours.filter((h) => h.weekday === d).map((s) => `${s.opens}–${s.closes}`);

/** Testo di ogni riga della lavagna, per chiave: serve a capire cosa è stato riscritto. */
function boardLines(data: BusinessData, today: IsoDate, upcoming: BusinessData['specialHours']): Map<string, string> {
  const lines = new Map<string, string>();
  lines.set('name', data.name);
  lines.set('status', todayStatus(data, today));
  for (const i of data.catalog) lines.set(`item-${i.id}`, `${i.name}|${i.description}|${i.price}|${i.available}`);
  for (const p of data.posts.slice(0, 3)) lines.set(`post-${p.id}`, `${p.title}|${p.body}|${p.startsAt}`);
  for (const s of upcoming) lines.set(`special-${s.date}`, JSON.stringify(s));
  for (const d of DAYS) lines.set(`day-${d}`, daySlots(data, d).join(','));
  lines.set('about', data.description);
  lines.set('contacts', `${data.address}|${data.phone}|${data.email}`);
  return lines;
}

const Rewritten = createContext<Set<string>>(new Set());

/** Una riga di gesso: se il suo testo è appena cambiato, viene cancellata e riscritta. */
function Chalk({ k, as: Tag = 'div', className = '', children }: { k: string; as?: 'div' | 'li' | 'p' | 'h1' | 'article'; className?: string; children: ReactNode }) {
  const rewritten = useContext(Rewritten);
  return <Tag className={`${className} ${rewritten.has(k) ? 'rewrite' : ''}`.trim()}>{children}</Tag>;
}

/** Anteprima del sito: stessi blocchi del sito Next.js, generati dagli stessi dati, scritti sulla lavagna. */
export function SitePreview({ data, today }: { data: BusinessData; today: IsoDate }) {
  const horizon = addDays(today, 30);
  const upcoming = data.specialHours.filter((s) => s.date >= today && s.date <= horizon);
  const sections = [...new Set(data.catalog.map((i) => i.section))];
  const todayWd = weekdayOf(today);

  const lines = useMemo(() => boardLines(data, today, upcoming), [data, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const previous = useRef(lines);
  const [rewritten, setRewritten] = useState<Set<string>>(new Set());

  useEffect(() => {
    const before = previous.current;
    previous.current = lines;
    if (before === lines) return;
    const changed = new Set([...lines].filter(([k, v]) => before.get(k) !== v).map(([k]) => k));
    if (changed.size === 0) return;
    setRewritten(changed);
    const t = setTimeout(() => setRewritten(new Set()), REWRITE_MS);
    return () => clearTimeout(t);
  }, [lines]);

  // Su schermi stretti la lavagna è sotto la chat: porto in vista la prima riga riscritta.
  useEffect(() => {
    if (rewritten.size === 0 || !window.matchMedia('(max-width: 899px)').matches) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Dopo lo scorrimento della chat: due scorrimenti smooth insieme si annullano a vicenda.
    const t = setTimeout(() => {
      document.querySelector('.board .rewrite')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    }, 350);
    return () => clearTimeout(t);
  }, [rewritten]);

  return (
    <Rewritten.Provider value={rewritten}>
      <div className="board">
        <header className="b-head">
          <Chalk k="name" as="h1">{data.name}</Chalk>
          <Chalk k="status" as="p" className="b-status">{todayStatus(data, today)}</Chalk>
        </header>

        <section className="b-menu" aria-labelledby="b-menu-t">
          <h2 id="b-menu-t">Menu</h2>
          {sections.map((section) => (
            <div key={section} className="b-section">
              <h3>{section}</h3>
              <ul>
                {data.catalog.filter((i) => i.section === section).map((i) => (
                  <Chalk key={i.id} k={`item-${i.id}`} as="li" className={i.available ? 'b-item' : 'b-item sold-out'}>
                    <span className="b-dish">
                      <span className="b-name">{i.name}</span>
                      {i.description && <span className="b-desc">{i.description}</span>}
                    </span>
                    <span className="b-dots" aria-hidden="true" />
                    <span className="b-price">{i.available ? euro(i.price) : 'finita!'}</span>
                  </Chalk>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="b-news" aria-labelledby="b-news-t">
          <h2 id="b-news-t">Avvisi</h2>
          {upcoming.length === 0 && data.posts.length === 0 && <p className="b-quiet">Nessun avviso, tutto come al solito.</p>}
          <ul>
            {upcoming.map((s) => (
              <Chalk key={s.date} k={`special-${s.date}`} as="li" className="b-notice">
                <span className="b-when">{formatDateIt(s.date)}</span>
                {s.closed ? 'chiusi' : `aperti ${s.opens}–${s.closes}`}{s.note ? ` · ${s.note}` : ''}
              </Chalk>
            ))}
            {data.posts.slice(0, 3).map((p) => (
              <Chalk key={p.id} k={`post-${p.id}`} as="li" className={`b-post ${p.kind}`}>
                {p.startsAt && <span className="b-when">{formatDateIt(p.startsAt)}</span>}
                <span className="b-title">{p.title}</span>
                {p.body !== p.title && <span className="b-body">{p.body}</span>}
              </Chalk>
            ))}
          </ul>
        </section>

        <section className="b-hours" aria-labelledby="b-hours-t">
          <h2 id="b-hours-t">Orari</h2>
          <ol className="b-week">
            {DAYS.map((d) => {
              const slots = daySlots(data, d);
              return (
                <Chalk key={d} k={`day-${d}`} as="li" className={`${d === todayWd ? 'is-today' : ''} ${slots.length ? '' : 'is-closed'}`}>
                  <span className="b-day">{WEEKDAY_NAMES[d]}</span>
                  <span className="b-slots">
                    {slots.length ? slots.map((s) => <span key={s} className="b-slot">{s}</span>) : <span className="b-slot">chiuso</span>}
                  </span>
                  {d === todayWd && <span className="sr-only"> (oggi)</span>}
                </Chalk>
              );
            })}
          </ol>
        </section>

        <footer className="b-foot">
          <Chalk k="about" as="p" className="b-about">{data.description}</Chalk>
          <Chalk k="contacts" className="b-contacts">
            <span>{data.address}</span>
            <span>Tel. {data.phone}</span>
            <span>{data.email}</span>
          </Chalk>
        </footer>
      </div>
    </Rewritten.Provider>
  );
}
