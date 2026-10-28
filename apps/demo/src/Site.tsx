import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { WEEKDAY_NAMES, addDays, formatDateIt, weekdayOf, type BusinessData, type IsoDate, type Weekday } from '@cms/shared';
import { daySlots, slotText, todayHours } from './hours';
import type { SampleBusiness } from './sample';

const euro = (n: number | null) => (n === null ? '' : `${n.toFixed(2).replace('.', ',')} €`);
/** Foto servita da Unsplash (licenza gratuita), ritagliata alla larghezza richiesta. */
const photo = (id: string, w: number, h?: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}${h ? `&h=${h}` : ''}&q=75&auto=format&fit=crop`;
const DAYS = [1, 2, 3, 4, 5, 6, 7] as Weekday[];
const CHANGED_MS = 2400;

/** Icone dei siti d'esempio: tratto unico da 1,8, ereditano il colore del testo. */
function Icon({ d }: { d: string }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
const PinIcon = () => <Icon d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />;
const PhoneIcon = () => <Icon d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z" />;
const ClockIcon = () => <Icon d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4.5l3 2" />;
const ChatIcon = () => <Icon d="M4 19.5 5.3 16A8 8 0 1 1 8 18.7L4 19.5Z" />;
const CheckIcon = () => <Icon d="m5 12.5 4.5 4.5L19 7.5" />;

/** Testo di ogni parte del sito, per chiave: serve a segnare cosa è appena cambiato. */
function siteParts(data: BusinessData, today: IsoDate): Map<string, string> {
  const parts = new Map<string, string>();
  parts.set('today', todayHours(data, today).text);
  for (const i of data.catalog) parts.set(`item-${i.id}`, `${i.name}|${i.description}|${i.price}|${i.available}`);
  for (const s of data.specialHours) parts.set(`special-${s.date}`, JSON.stringify(s));
  for (const p of data.posts) parts.set(`post-${p.id}`, `${p.title}|${p.body}|${p.startsAt}`);
  for (const d of DAYS) parts.set(`day-${d}`, daySlots(data, d).map(slotText).join(' '));
  return parts;
}

/** Anteprima del sito dell'attività: intestazione, contenuti generati dai dati, piè di pagina. */
export function Site({ sample, data, today }: { sample: SampleBusiness; data: BusinessData; today: IsoDate }) {
  const scroller = useRef<HTMLDivElement>(null);
  const parts = useMemo(() => siteParts(data, today), [data, today]);
  const previous = useRef({ id: sample.id, parts });
  const [changed, setChanged] = useState<Set<string>>(new Set());

  useEffect(() => {
    const before = previous.current;
    previous.current = { id: sample.id, parts };
    if (before.id !== sample.id) {
      scroller.current?.scrollTo({ top: 0 });
      setChanged(new Set());
      return;
    }
    const keys = [...parts].filter(([k, v]) => before.parts.get(k) !== v).map(([k]) => k);
    if (keys.length === 0) return;
    setChanged(new Set(keys));
    const t = setTimeout(() => setChanged(new Set()), CHANGED_MS);
    return () => clearTimeout(t);
  }, [parts, sample.id]);

  // Porto in vista la prima parte cambiata, dentro l'anteprima.
  useEffect(() => {
    if (changed.size === 0) return;
    // Scorre solo l'anteprima, non la pagina intorno (scrollIntoView muoverebbe anche quella).
    const box = scroller.current;
    const target = box?.querySelector<HTMLElement>('.is-changed');
    if (!box || !target) return;
    const offset = target.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollTo({ top: Math.max(0, offset - box.clientHeight / 2 + target.offsetHeight / 2), behavior: reduce ? 'auto' : 'smooth' });
  }, [changed]);

  const mark = (key: string) => (changed.has(key) ? 'is-changed' : '');
  const hours = todayHours(data, today);
  const todayWd = weekdayOf(today);
  const upcoming = data.specialHours.filter((s) => s.date >= today && s.date <= addDays(today, 30));
  const sections = [...new Set(data.catalog.map((i) => i.section))];
  const style = { '--accent': sample.accent } as CSSProperties;
  const anchor = (part: string) => `${sample.id}-${part}`;
  const todayText = hours.closed ? 'Oggi chiuso' : `Oggi aperto ${hours.text.replace(/-/g, '–').replace(/ /g, ' e ')}`;
  const allPhotos = [sample.photos.hero, ...sample.photos.gallery];
  const credits = allPhotos.filter((p, i) => allPhotos.findIndex((q) => q.author === p.author) === i);
  const mapUrl =`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`;

  // "Scrivici" sul sito d'esempio porta alla chat della demo: è lo stesso canale.
  function toChat() {
    const input = document.getElementById('wa-input');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    input?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    input?.focus({ preventScroll: true });
  }

  return (
    <section className="preview" tabIndex={-1} aria-label={`Anteprima del sito di ${data.name}`}>
      <div className="preview-bar">
        <span className="preview-url">{sample.domain}</span>
        <span className="preview-note">Anteprima del sito</span>
      </div>

      <div className="site" data-look={sample.look} style={style} ref={scroller}>
        <div className="site-topbar">
          <span className="topbar-item topbar-address"><PinIcon />{data.address}</span>
          <span className="topbar-item topbar-phone"><PhoneIcon />{data.phone}</span>
          <span className="topbar-item"><ClockIcon />{todayText}</span>
        </div>
        <header className="site-header">
          <a className="site-brand" href={`#${anchor('top')}`}>
            <span className="site-logo" aria-hidden="true">{data.name.charAt(0)}</span>
            <span>
              <span className="site-name">{data.name}</span>
              <span className="site-tagline">{sample.tagline}</span>
            </span>
          </a>
          <nav className="site-nav" aria-label="Menu del sito">
            <a href={`#${anchor('catalogo')}`}>{sample.catalogTitle}</a>
            <a href={`#${anchor('orari')}`}>Orari</a>
            <a href={`#${anchor('contatti')}`}>Contatti</a>
          </nav>
          <div className="site-ctas">
            <button className="site-cta site-cta-ghost" onClick={toChat} aria-label="Scrivici"><ChatIcon /><span className="cta-label">Scrivici</span></button>
            <a className="site-cta" href={`#${anchor('contatti')}`}>Chiama</a>
          </div>
        </header>

        <div className="site-hero" id={anchor('top')}>
          <img
            className="site-hero-img"
            src={photo(sample.photos.hero.id, 1400)}
            srcSet={`${photo(sample.photos.hero.id, 800)} 800w, ${photo(sample.photos.hero.id, 1400)} 1400w, ${photo(sample.photos.hero.id, 2000)} 2000w`}
            sizes="(max-width: 899px) 100vw, 60vw"
            alt={sample.photos.hero.alt}
          />
          <div className="site-hero-text">
          <h1>{data.name}</h1>
          <p className="site-lead">{data.description}</p>
          <p className={`site-status ${hours.closed ? 'is-closed' : ''} ${mark('today')}`}>
            <span className="dot" aria-hidden="true" />
            {todayText}
          </p>
          {upcoming.length > 0 && (
            <ul className="site-notices">
              {upcoming.slice(0, 3).map((s) => (
                <li key={s.date} className={mark(`special-${s.date}`)}>
                  <strong>{formatDateIt(s.date)}</strong> {s.closed ? 'chiuso' : `aperto ${s.opens}–${s.closes}`}{s.note ? ` · ${s.note}` : ''}
                </li>
              ))}
              {upcoming.length > 3 && <li>e altri {upcoming.length - 3} giorni</li>}
            </ul>
          )}
          </div>
        </div>

        <ul className="site-highlights" aria-label="Punti di forza">
          {sample.highlights.map((h) => (
            <li key={h}><CheckIcon />{h}</li>
          ))}
        </ul>

        <section className="site-section" id={anchor('catalogo')} aria-labelledby={anchor('catalogo-t')}>
          <h2 id={anchor('catalogo-t')}>{sample.catalogTitle}</h2>
          <div className="site-catalog">
            {sections.map((section) => (
              <div key={section} className="site-group">
                {sections.length > 1 && <h3>{section}</h3>}
                <ul>
                  {data.catalog.filter((i) => i.section === section).map((i) => (
                    <li key={i.id} className={`${i.available ? '' : 'is-out'} ${mark(`item-${i.id}`)}`}>
                      <span className="item-text">
                        <span className="item-name">{i.name}</span>
                        {i.description && <span className="item-desc">{i.description}</span>}
                      </span>
                      <span className="item-price">{i.available ? euro(i.price) : 'Non disponibile'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <div className="site-section site-split" id={anchor('orari')}>
          <section aria-labelledby={anchor('orari-t')}>
            <h2 id={anchor('orari-t')}>Orari</h2>
            <ul className="site-hours">
              {DAYS.map((d) => {
                const slots = daySlots(data, d);
                return (
                  <li key={d} className={`${d === todayWd ? 'is-today' : ''} ${mark(`day-${d}`)}`}>
                    <span>{WEEKDAY_NAMES[d]}{d === todayWd && <span className="today-tag">oggi</span>}</span>
                    <span className="hours-slots">
                      {slots.length ? slots.map((s) => <span key={s.opens}>{s.opens}–{s.closes}</span>) : 'Chiuso'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
          <section aria-labelledby={anchor('news-t')}>
            <h2 id={anchor('news-t')}>Novità</h2>
            {data.posts.length === 0 ? (
              <p className="site-quiet">Nessuna novità al momento.</p>
            ) : (
              <ul className="site-news">
                {data.posts.slice(0, 3).map((p) => (
                  <li key={p.id} className={mark(`post-${p.id}`)}>
                    {p.startsAt && <span className="news-date">{formatDateIt(p.startsAt)}</span>}
                    <span className="news-title">{p.title}</span>
                    {p.body !== p.title && <span className="news-body">{p.body}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="site-section site-where" aria-labelledby={anchor('dove-t')}>
          <h2 id={anchor('dove-t')}>Dove siamo</h2>
          <div className="where-body">
            <p className="where-address"><PinIcon />{data.address}</p>
            <p className="where-hours">{todayText}</p>
            <a className="site-cta" href={mapUrl} target="_blank" rel="noopener noreferrer">Apri la mappa</a>
          </div>
        </section>

        <section className="site-section site-gallery-wrap" aria-labelledby={anchor('foto-t')}>
          <h2 id={anchor('foto-t')}>{sample.galleryTitle}</h2>
          <div className="site-gallery">
            {sample.photos.gallery.map((p) => (
              <img key={p.id} src={photo(p.id, 700, 520)} alt={p.alt} />
            ))}
          </div>
        </section>

        <footer className="site-footer" id={anchor('contatti')}>
          <div className="footer-brand">
            <span className="site-logo" aria-hidden="true">{data.name.charAt(0)}</span>
            <span>
              <span className="site-name">{data.name}</span>
              <span className="site-tagline">{sample.tagline}</span>
            </span>
          </div>
          {/* Il telefono resta testo: i numeri d'esempio sono inventati e potrebbero esistere davvero. */}
          <address className="footer-contacts">
            <span>{data.address}</span>
            <span>Tel. {data.phone}</span>
            <a href={`mailto:${data.email}`}>{data.email}</a>
          </address>
          <nav className="footer-links" aria-label="Sezioni del sito">
            <a href={`#${anchor('catalogo')}`}>{sample.catalogTitle}</a>
            <a href={`#${anchor('orari')}`}>Orari</a>
            <span>{hours.closed ? 'Oggi chiuso' : `Oggi ${hours.text.replace(/-/g, '–').replace(/ /g, ' e ')}`}</span>
          </nav>
          <p className="footer-legal">© {today.slice(0, 4)} {data.name} · Sito d'esempio, dati inventati · Aggiornato via messaggio con cms-test</p>
          <p className="footer-credits">
            Foto su Unsplash di{' '}
            {credits.map((c, i) => (
              <span key={c.page}>
                {i > 0 && (i === credits.length - 1 ? ' e ' : ', ')}
                <a href={c.page} target="_blank" rel="noopener noreferrer">{c.author}</a>
              </span>
            ))}
          </p>
        </footer>
      </div>
    </section>
  );
}
