import { WEEKDAY_NAMES, addDays, formatDateIt, todayIn, weekdayOf, type BusinessData, type PageBlock, type Weekday } from '@cms/shared';

const euro = (n: number | null) => (n === null ? '' : `${n.toFixed(2).replace('.', ',')} €`);
const DAYS = [1, 2, 3, 4, 5, 6, 7] as Weekday[];

function todayStatus(data: BusinessData, today: string): string {
  const special = data.specialHours.find((s) => s.date === today);
  if (special) return special.closed ? `Oggi chiuso${special.note ? ` (${special.note})` : ''}` : `Oggi aperto ${special.opens}–${special.closes}`;
  const slots = data.openingHours.filter((h) => h.weekday === weekdayOf(today));
  return slots.length ? `Oggi aperto ${slots.map((s) => `${s.opens}–${s.closes}`).join(' e ')}` : 'Oggi chiuso';
}

function Hours({ data, title, timezone }: { data: BusinessData; title: string; timezone: string }) {
  const today = todayIn(timezone);
  const horizon = addDays(today, 30);
  const upcoming = data.specialHours.filter((s) => s.date >= today && s.date <= horizon);
  return (
    <section className="block" id="orari">
      <h2>{title}</h2>
      <p className="today">{todayStatus(data, today)}</p>
      {upcoming.length > 0 && (
        <div className="notice">
          <strong>Variazioni</strong>
          <ul>
            {upcoming.map((s) => (
              <li key={s.date}>
                {formatDateIt(s.date)}: {s.closed ? 'chiuso' : `${s.opens}–${s.closes}`}
                {s.note ? ` (${s.note})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      <table>
        <tbody>
          {DAYS.map((d) => {
            const slots = data.openingHours.filter((h) => h.weekday === d);
            return (
              <tr key={d}>
                <th>{WEEKDAY_NAMES[d]}</th>
                <td>{slots.length ? slots.map((s) => `${s.opens}–${s.closes}`).join(', ') : 'chiuso'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function Catalog({ data, title }: { data: BusinessData; title: string }) {
  if (data.catalog.length === 0) return null;
  const sections = [...new Set(data.catalog.map((i) => i.section))];
  return (
    <section className="block" id="menu">
      <h2>{title}</h2>
      {sections.map((section) => (
        <div key={section} className="section">
          <h3>{section}</h3>
          <ul className="items">
            {data.catalog.filter((i) => i.section === section).map((i) => (
              <li key={i.id} className={i.available ? '' : 'sold-out'}>
                <div>
                  <span className="name">{i.name}</span>
                  {i.description && <span className="desc">{i.description}</span>}
                </div>
                <span className="price">{i.available ? euro(i.price) : 'Esaurito'}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function Posts({ data, limit }: { data: BusinessData; limit: number }) {
  const posts = data.posts.slice(0, limit);
  if (posts.length === 0) return null;
  return (
    <section className="block posts">
      {posts.map((p) => (
        <article key={p.id} className={`post ${p.kind}`}>
          {p.startsAt && <time>{formatDateIt(p.startsAt)}</time>}
          <h3>{p.title}</h3>
          {p.body !== p.title && <p>{p.body}</p>}
        </article>
      ))}
    </section>
  );
}

export function Blocks({ layout, data, timezone }: { layout: PageBlock[]; data: BusinessData; timezone: string }) {
  return (
    <>
      {layout.map((block) => {
        const title = String(block.options.title ?? '');
        switch (block.type) {
          case 'hero':
            return (
              <header key={block.id} className="hero">
                <h1>{data.name}</h1>
                {block.options.subtitle ? <p>{String(block.options.subtitle)}</p> : <p>{todayStatus(data, todayIn(timezone))}</p>}
                <a className="cta" href="#menu">Guarda il menu</a>
              </header>
            );
          case 'about':
            return data.description ? (
              <section key={block.id} className="block"><h2>{title}</h2><p>{data.description}</p></section>
            ) : null;
          case 'hours':
            return <Hours key={block.id} data={data} title={title || 'Orari'} timezone={timezone} />;
          case 'catalog':
            return <Catalog key={block.id} data={data} title={title || 'Menu'} />;
          case 'posts':
            return <Posts key={block.id} data={data} limit={Number(block.options.limit ?? 3)} />;
          case 'contacts':
            return (
              <section key={block.id} className="block" id="contatti">
                <h2>{title || 'Contatti'}</h2>
                {data.address && <p>{data.address}</p>}
                {data.phone && <p>Tel. <a href={`tel:${data.phone.replace(/\s/g, '')}`}>{data.phone}</a></p>}
                {data.email && <p><a href={`mailto:${data.email}`}>{data.email}</a></p>}
              </section>
            );
          case 'text':
            return (
              <section key={block.id} className="block"><h2>{title}</h2><p>{String(block.options.body ?? '')}</p></section>
            );
        }
      })}
    </>
  );
}
