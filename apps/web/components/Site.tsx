import { Fragment, type CSSProperties, type ReactNode } from 'react';
import {
  LINKS, WEEKDAY_NAMES, addDays, categoryProfile, formatDateIt, openStatus, photoUrl, resolveSite, timeIn, todayIn, weekdayOf,
  type BusinessData, type IsoDate, type SectionId, type TimeSlot, type Weekday,
} from '@cms/shared';
import { Reveal } from './Reveal';

const euro = (n: number | null) => (n === null ? '' : `${n.toFixed(2).replace('.', ',')} €`);
const DAYS = [1, 2, 3, 4, 5, 6, 7] as Weekday[];
/** "09:00" → "9", "14:30" → "14:30": orari compatti. */
const compact = (t: string | null) => (t ?? '').replace(/^0/, '').replace(/:00$/, '');
const slotText = (s: TimeSlot) => `${compact(s.opens)}–${compact(s.closes)}`;
/** Orario di un giorno speciale; i dati vecchi possono avere solo apertura o solo chiusura. */
const specialText = (opens: string | null, closes: string | null) =>
  opens && closes ? `${compact(opens)}–${compact(closes)}` : opens ? `dalle ${opens}` : closes ? `fino alle ${closes}` : '';
const daySlots = (data: BusinessData, d: Weekday) => data.openingHours.filter((h) => h.weekday === d);

/** Orario di oggi, tenendo conto delle variazioni. */
function todayText(data: BusinessData, today: IsoDate): { text: string; closed: boolean } {
  const special = data.specialHours.find((s) => s.date === today);
  if (special) return special.closed ? { text: 'Oggi chiuso', closed: true } : { text: `Oggi aperto ${specialText(special.opens, special.closes)}`.trim(), closed: false };
  const slots = daySlots(data, weekdayOf(today));
  return slots.length ? { text: `Oggi aperto ${slots.map(slotText).join(' e ')}`, closed: false } : { text: 'Oggi chiuso', closed: true };
}

/** Icone a tratto unico, ereditano il colore del testo. */
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
const CheckIcon = () => <Icon d="m5 12.5 4.5 4.5L19 7.5" />;
const ListIcon = () => <Icon d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />;

/** "Pizze rosse" → "pizze-rosse": ancore per le sottosezioni del catalogo. */
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Il logo dell'attività; senza logo, l'iniziale del nome nel colore del sito. Il nome è sempre scritto accanto. */
function Mark({ data }: { data: BusinessData }) {
  if (!data.logo) return <span className="site-logo" aria-hidden="true">{data.name.charAt(0)}</span>;
  return (
    <span className="site-logo-img">
      <img src={photoUrl(data.logo, { w: 240 })} alt="" height={44} loading="eager" />
    </span>
  );
}

const ANCHOR: Record<SectionId, string> = {
  highlights: 'punti-di-forza', catalog: 'catalogo', about: 'chi-siamo', hours: 'orari', posts: 'novita', gallery: 'foto', where: 'dove-siamo',
};

/**
 * Il sito dell'attività: tutto viene dai dati e dalle impostazioni del sito
 * (stile, colore, testi, ordine e visibilità delle sezioni, social).
 */
export function Site({ data, timezone }: { data: BusinessData; timezone: string }) {
  const site = resolveSite(data);
  const today = todayIn(timezone);
  const now = todayText(data, today);
  // Pagina sempre generata alla richiesta: l'ora è quella di chi apre il sito, nel fuso dell'attività.
  const live = openStatus(data, today, timeIn(timezone));
  const liveText = live.detail ? `${live.label} · ${live.detail}` : live.label;
  const todayWd = weekdayOf(today);
  const upcoming = data.specialHours.filter((s) => s.date >= today && s.date <= addDays(today, 30));
  const sections = [...new Set(data.catalog.map((i) => i.section))];
  const photos = data.photos ?? [];
  const phoneHref = data.phone ? `tel:${data.phone.replace(/[^\d+]/g, '')}` : null;
  const mapUrl = data.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}` : null;
  const links = LINKS.filter((l) => site.links[l.id]);
  // Senza frase scelta, sotto il nome va la descrizione e la sezione "Chi siamo" non la ripete.
  const lead = site.tagline || data.description;

  /** Una sezione ha qualcosa da mostrare? Le vuote non compaiono, così il sito non ha buchi. */
  const hasContent: Record<SectionId, boolean> = {
    highlights: site.highlights.length > 0,
    catalog: data.catalog.length > 0,
    about: Boolean(site.tagline && data.description),
    hours: data.openingHours.length > 0 || data.specialHours.length > 0,
    posts: data.posts.length > 0,
    gallery: photos.length > 0,
    where: Boolean(data.address),
  };
  const visible = site.order.filter((id) => !site.hidden.includes(id) && hasContent[id]);

  const heading = (id: SectionId) => <h2 id={`${ANCHOR[id]}-t`}>{site.titles[id]}</h2>;
  const render: Record<SectionId, () => ReactNode> = {
    highlights: () => (
      <ul className="site-highlights" aria-label={site.titles.highlights}>
        {site.highlights.map((h) => <li key={h}><CheckIcon />{h}</li>)}
      </ul>
    ),
    catalog: () => (
      <section className="site-section" id={ANCHOR.catalog} aria-labelledby={`${ANCHOR.catalog}-t`}>
        {heading('catalog')}
        {sections.length > 2 && (
          <nav className="site-jump" aria-label={`Sezioni di ${site.titles.catalog}`}>
            {sections.map((section) => <a key={section} href={`#${ANCHOR.catalog}-${slug(section)}`}>{section}</a>)}
          </nav>
        )}
        <div className="site-catalog">
          {sections.map((section) => (
            <div key={section} className="site-group" id={`${ANCHOR.catalog}-${slug(section)}`}>
              {sections.length > 1 && <h3>{section}</h3>}
              <ul>
                {data.catalog.filter((i) => i.section === section).map((i) => (
                  <li key={i.id} className={i.available ? '' : 'is-out'}>
                    {i.image && <img className="item-thumb" src={photoUrl(i.image, { w: 160, h: 160 })} alt="" width={56} height={56} loading="lazy" />}
                    <span className="item-text">
                      <span className="item-name">{i.name}</span>
                      {i.description && <span className="item-desc">{i.description}</span>}
                    </span>
                    <span className="item-price">{i.available ? euro(i.price) : categoryProfile(data.category).catalogKind === 'menu' ? 'Esaurito' : 'Non disponibile'}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    ),
    about: () => (
      <section className="site-section site-about" id={ANCHOR.about} aria-labelledby={`${ANCHOR.about}-t`}>
        {heading('about')}
        <p>{data.description}</p>
      </section>
    ),
    hours: () => (
      <section id={ANCHOR.hours} aria-labelledby={`${ANCHOR.hours}-t`}>
        {heading('hours')}
        <ul className="site-hours">
          {DAYS.map((d) => {
            const slots = daySlots(data, d);
            return (
              <li key={d} className={d === todayWd ? 'is-today' : ''}>
                <span>{WEEKDAY_NAMES[d]}{d === todayWd && <span className="today-tag">oggi</span>}</span>
                <span className="hours-slots">{slots.length ? slots.map((s) => <span key={s.opens}>{slotText(s)}</span>) : 'Chiuso'}</span>
              </li>
            );
          })}
        </ul>
      </section>
    ),
    posts: () => (
      <section id={ANCHOR.posts} aria-labelledby={`${ANCHOR.posts}-t`}>
        {heading('posts')}
        <ul className="site-news">
          {data.posts.slice(0, 4).map((p) => (
            <li key={p.id}>
              {p.startsAt && <span className="news-date">{formatDateIt(p.startsAt)}</span>}
              <span className="news-title">{p.title}</span>
              {p.body !== p.title && <span className="news-body">{p.body}</span>}
            </li>
          ))}
        </ul>
      </section>
    ),
    gallery: () => (
      <section className="site-section site-gallery-wrap" id={ANCHOR.gallery} aria-labelledby={`${ANCHOR.gallery}-t`}>
        {heading('gallery')}
        <div className="site-gallery">
          {photos.map((p) => (
            <figure key={p.id}>
              <img src={photoUrl(p.url, { w: 900, h: 675 })} alt={p.caption || `Foto di ${data.name}`} width={900} height={675} loading="lazy" />
              {p.caption && <figcaption>{p.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </section>
    ),
    where: () => (
      <section className="site-section site-where" id={ANCHOR.where} aria-labelledby={`${ANCHOR.where}-t`}>
        {heading('where')}
        <div className="where-body">
          <p className="where-address"><PinIcon />{data.address}</p>
          <p className="where-hours">{now.text}</p>
          {mapUrl && <a className="site-cta" href={mapUrl} target="_blank" rel="noopener noreferrer">Apri la mappa</a>}
        </div>
      </section>
    ),
  };

  // Orari e novità vicini stanno affiancati, come in un giornale; le altre sezioni a tutta larghezza.
  const blocks: ReactNode[] = [];
  for (let i = 0; i < visible.length; i++) {
    const id = visible[i];
    const next = visible[i + 1];
    if ((id === 'hours' && next === 'posts') || (id === 'posts' && next === 'hours')) {
      blocks.push(<div key={id} className="site-section site-split">{render[id]()}{render[next]()}</div>);
      i++;
    } else if (id === 'hours' || id === 'posts') {
      blocks.push(<div key={id} className="site-section">{render[id]()}</div>);
    } else {
      blocks.push(<Fragment key={id}>{render[id]()}</Fragment>);
    }
  }

  const nav = (['catalog', 'hours', 'gallery'] as SectionId[]).filter((id) => visible.includes(id));
  const style = { '--accent': site.accent } as CSSProperties;

  return (
    <div className="site" data-look={site.look} style={style}>
      <div className="site-topbar">
        {data.address && <span className="topbar-item topbar-address"><PinIcon />{data.address}</span>}
        {data.phone && <span className="topbar-item topbar-phone"><PhoneIcon />{data.phone}</span>}
        <span className="topbar-item"><ClockIcon />{liveText}</span>
      </div>
      <header className="site-header">
        <a className="site-brand" href="#top">
          <Mark data={data} />
          <span>
            <span className="site-name">{data.name}</span>
            {site.tagline && <span className="site-tagline">{site.tagline}</span>}
          </span>
        </a>
        {nav.length > 0 && (
          <nav className="site-nav" aria-label="Sezioni del sito">
            {nav.map((id) => <a key={id} href={`#${ANCHOR[id]}`}>{site.titles[id]}</a>)}
            <a href="#contatti">Contatti</a>
          </nav>
        )}
        <div className="site-ctas">
          {mapUrl && <a className="site-cta site-cta-ghost" href={mapUrl} target="_blank" rel="noopener noreferrer"><PinIcon /><span className="cta-label">Indicazioni</span></a>}
          {phoneHref && <a className="site-cta" href={phoneHref}><PhoneIcon />Chiama</a>}
        </div>
      </header>

      <main id="top">
        <div className={`site-hero ${data.cover ? '' : 'no-photo'}`}>
          {data.cover && (
            <img
              className="site-hero-img"
              src={photoUrl(data.cover, { w: 1400 })}
              srcSet={`${photoUrl(data.cover, { w: 800 })} 800w, ${photoUrl(data.cover, { w: 1400 })} 1400w, ${photoUrl(data.cover, { w: 2000 })} 2000w`}
              sizes="(max-width: 899px) 100vw, 60vw"
              alt=""
            />
          )}
          <div className="site-hero-text">
            <h1>{data.name}</h1>
            {lead && <p className="site-lead">{lead}</p>}
            <p className={`site-status ${live.open ? (live.closingSoon ? 'is-soon' : '') : 'is-closed'}`}>
              <span className="dot" aria-hidden="true" />
              <strong>{live.label}</strong>
              {live.detail && <span className="status-detail">{live.detail}</span>}
            </p>
            {now.text !== 'Oggi chiuso' && <p className="site-today">{now.text}</p>}
            {upcoming.length > 0 && (
              <ul className="site-notices">
                {upcoming.slice(0, 3).map((s) => (
                  <li key={s.date}>
                    <strong>{formatDateIt(s.date)}</strong> {s.closed ? 'chiuso' : `aperto ${specialText(s.opens, s.closes)}`.trim()}{s.note ? ` · ${s.note}` : ''}
                  </li>
                ))}
                {upcoming.length > 3 && <li>e altri {upcoming.length - 3} giorni</li>}
              </ul>
            )}
          </div>
        </div>
        {blocks}
      </main>

      <footer className="site-footer" id="contatti">
        <div className="footer-brand">
          <Mark data={data} />
          <span>
            <span className="site-name">{data.name}</span>
            {site.tagline && <span className="site-tagline">{site.tagline}</span>}
          </span>
        </div>
        <address className="footer-contacts">
          {data.address && <span>{data.address}</span>}
          {data.phone && phoneHref && <a href={phoneHref}>Tel. {data.phone}</a>}
          {data.email && <a href={`mailto:${data.email}`}>{data.email}</a>}
        </address>
        <nav className="footer-links" aria-label="Social e collegamenti">
          {links.map((l) => <a key={l.id} href={site.links[l.id]} target="_blank" rel="noopener noreferrer">{l.label}</a>)}
          <span>{now.text}</span>
        </nav>
        <p className="footer-legal">© {today.slice(0, 4)} {data.name} · <a href="/privacy">Privacy</a></p>
      </footer>

      <Reveal />

      {/* Sul telefono le due cose che servono di più restano sempre a portata di pollice. */}
      {(phoneHref || mapUrl || nav.includes('catalog')) && (
        <nav className="site-dock" aria-label="Azioni rapide">
          {nav.includes('catalog') && <a href={`#${ANCHOR.catalog}`}><ListIcon />{site.titles.catalog}</a>}
          {mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer"><PinIcon />Indicazioni</a>}
          {phoneHref && <a className="is-primary" href={phoneHref}><PhoneIcon />Chiama</a>}
        </nav>
      )}
    </div>
  );
}
