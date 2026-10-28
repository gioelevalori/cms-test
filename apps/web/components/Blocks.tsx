import { WEEKDAY_NAMES, addDays, categoryProfile, photoUrl, formatDateIt, todayIn, weekdayOf, type BusinessData, type PageBlock, type Weekday } from '@cms/shared';

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
  const soldOut = categoryProfile(data.category).catalogKind === 'menu' ? 'Esaurito' : 'Non disponibile';
  return (
    <section className="block" id="menu">
      <h2>{title}</h2>
      {sections.map((section) => (
        <div key={section} className="section">
          <h3>{section}</h3>
          <ul className="items">
            {data.catalog.filter((i) => i.section === section).map((i) => (
              <li key={i.id} className={i.available ? '' : 'sold-out'}>
                {i.image && <img className="thumb" src={photoUrl(i.image, { w: 160, h: 160 })} alt="" loading="lazy" width={64} height={64} />}
                <div className="text">
                  <span className="name">{i.name}</span>
                  {i.description && <span className="desc">{i.description}</span>}
                </div>
                <span className="price">{i.available ? euro(i.price) : soldOut}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function Gallery({ data, title }: { data: BusinessData; title: string }) {
  const photos = data.photos ?? [];
  if (photos.length === 0) return null;
  return (
    <section className="block gallery" id="foto">
      <h2>{title}</h2>
      <ul>
        {photos.map((p) => (
          <li key={p.id}>
            <figure>
              <img src={photoUrl(p.url, { w: 720, h: 540 })} alt={p.caption || `Foto di ${data.name}`} loading="lazy" width={360} height={270} />
              {p.caption && <figcaption>{p.caption}</figcaption>}
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** I siti creati prima della galleria non hanno il blocco: compare comunque, prima dei contatti. */
function withGallery(layout: PageBlock[], data: BusinessData): PageBlock[] {
  if (!data.photos?.length || layout.some((b) => b.type === 'gallery')) return layout;
  const at = layout.findIndex((b) => b.type === 'contacts');
  const gallery: PageBlock = { id: 'gallery-auto', type: 'gallery', options: { title: 'Foto' } };
  return at < 0 ? [...layout, gallery] : [...layout.slice(0, at), gallery, ...layout.slice(at)];
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
  const profile = categoryProfile(data.category);
  return (
    <>
      {withGallery(layout, data).map((block) => {
        const title = String(block.options.title ?? '');
        switch (block.type) {
          case 'hero':
            return (
              <header
                key={block.id}
                className={data.cover ? 'hero with-cover' : 'hero'}
                style={data.cover ? { backgroundImage: `linear-gradient(rgb(0 0 0 / .45), rgb(0 0 0 / .55)), url(${photoUrl(data.cover, { w: 1600 })})` } : undefined}
              >
                <h1>{data.name}</h1>
                {block.options.subtitle ? <p>{String(block.options.subtitle)}</p> : <p>{todayStatus(data, todayIn(timezone))}</p>}
                {data.catalog.length > 0 && <a className="cta" href="#menu">{profile.catalogCta}</a>}
              </header>
            );
          case 'about':
            return data.description ? (
              <section key={block.id} className="block"><h2>{title}</h2><p>{data.description}</p></section>
            ) : null;
          case 'hours':
            return <Hours key={block.id} data={data} title={title || 'Orari'} timezone={timezone} />;
          case 'catalog':
            return <Catalog key={block.id} data={data} title={title || profile.catalogTitle} />;
          case 'gallery':
            return <Gallery key={block.id} data={data} title={title || 'Foto'} />;
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
