import { DEFAULT_LAYOUT, WEEKDAY_NAMES, addDays, formatDateIt, weekdayOf, type BusinessData, type IsoDate, type Weekday } from '@cms/shared';

const euro = (n: number | null) => (n === null ? '' : `${n.toFixed(2).replace('.', ',')} €`);
const DAYS = [1, 2, 3, 4, 5, 6, 7] as Weekday[];

function todayStatus(data: BusinessData, today: IsoDate): string {
  const special = data.specialHours.find((s) => s.date === today);
  if (special) return special.closed ? `Oggi chiuso${special.note ? ` (${special.note})` : ''}` : `Oggi aperto ${special.opens}–${special.closes}`;
  const slots = data.openingHours.filter((h) => h.weekday === weekdayOf(today));
  return slots.length ? `Oggi aperto ${slots.map((s) => `${s.opens}–${s.closes}`).join(' e ')}` : 'Oggi chiuso';
}

/** Anteprima del sito pubblico: stessi blocchi del sito Next.js, generati dagli stessi dati. */
export function SitePreview({ data, today, highlight }: { data: BusinessData; today: IsoDate; highlight: boolean }) {
  const horizon = addDays(today, 30);
  const upcoming = data.specialHours.filter((s) => s.date >= today && s.date <= horizon);
  const sections = [...new Set(data.catalog.map((i) => i.section))];

  return (
    <div className={`site ${highlight ? 'flash' : ''}`}>
      {DEFAULT_LAYOUT.map((block) => {
        switch (block.type) {
          case 'hero':
            return (
              <header key={block.id} className="s-hero">
                <h1>{data.name}</h1>
                <p>{todayStatus(data, today)}</p>
              </header>
            );
          case 'posts':
            return data.posts.length ? (
              <section key={block.id} className="s-block s-posts">
                {data.posts.slice(0, 3).map((p) => (
                  <article key={p.id} className={`s-post ${p.kind}`}>
                    {p.startsAt && <time>{formatDateIt(p.startsAt)}</time>}
                    <h3>{p.title}</h3>
                    {p.body !== p.title && <p>{p.body}</p>}
                  </article>
                ))}
              </section>
            ) : null;
          case 'catalog':
            return (
              <section key={block.id} className="s-block">
                <h2>Menu</h2>
                {sections.map((section) => (
                  <div key={section}>
                    <h3>{section}</h3>
                    <ul className="s-items">
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
          case 'hours':
            return (
              <section key={block.id} className="s-block">
                <h2>Orari</h2>
                {upcoming.length > 0 && (
                  <div className="s-notice">
                    <strong>Variazioni</strong>
                    <ul>
                      {upcoming.map((s) => (
                        <li key={s.date}>{formatDateIt(s.date)}: {s.closed ? 'chiuso' : `${s.opens}–${s.closes}`}{s.note ? ` (${s.note})` : ''}</li>
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
          case 'about':
            return (
              <section key={block.id} className="s-block"><h2>Chi siamo</h2><p>{data.description}</p></section>
            );
          case 'contacts':
            return (
              <section key={block.id} className="s-block">
                <h2>Contatti</h2>
                <p>{data.address}</p>
                <p>Tel. {data.phone}</p>
                <p>{data.email}</p>
              </section>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
