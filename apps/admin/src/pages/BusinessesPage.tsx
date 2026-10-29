import { useState, type CSSProperties, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CATEGORIES, photoUrl } from '@cms/shared';
import { api, setToken, SITE_URL, type BusinessSummary } from '../api/client';
import { ChatIcon, ClockIcon, ExitIcon, ExternalIcon, EyeIcon, ListIcon, PhotoIcon, PlusIcon } from '../components/Icons';

const ROLE_LABEL = { owner: 'Proprietario', builder: 'Costruttore', client: 'Cliente' };

/** "Bar Centrale & Co." → "bar-centrale-co": l'indirizzo del sito. */
const toSlug = (name: string) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

/** "adesso", "12 minuti fa", "ieri", "3 giorni fa", poi la data. */
function ago(iso: string, now = Date.now()): string {
  const min = Math.round((now - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'adesso';
  if (min < 60) return min === 1 ? 'un minuto fa' : `${min} minuti fa`;
  const h = Math.round(min / 60);
  if (h < 24) return h === 1 ? "un'ora fa" : `${h} ore fa`;
  const d = Math.round(h / 24);
  if (d === 1) return 'ieri';
  if (d < 7) return `${d} giorni fa`;
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
}

export function BusinessesPage() {
  const navigate = useNavigate();
  const me = useQuery({ queryKey: ['me'], queryFn: api.me });
  const { data, isLoading, error } = useQuery({ queryKey: ['businesses'], queryFn: api.businesses });
  const firstName = me.data?.name?.split(' ')[0];
  const empty = data && data.length === 0;

  return (
    <main className="container biz-page">
      <header className="biz-top">
        <div>
          <p className="biz-hello">{firstName ? `Ciao, ${firstName}` : 'Ciao'}</p>
          <h1>Le tue attività</h1>
        </div>
        <div className="biz-user">
          {me.data?.email && <span className="muted small">{me.data.email}</span>}
          <button className="ghost" onClick={() => { setToken(null); navigate('/login'); }}><ExitIcon size={16} />Esci</button>
        </div>
      </header>

      {error && <p className="error">{(error as Error).message}</p>}

      <div className="biz-layout">
      <div className="biz-main">

      {isLoading && (
        <ul className="biz-grid" aria-busy="true" aria-label="Caricamento delle attività">
          {[0, 1, 2].map((i) => <li key={i} className="biz-card is-skeleton"><span className="sk-cover" /><span className="sk-line" /><span className="sk-line short" /></li>)}
        </ul>
      )}

      {empty && (
        <section className="biz-welcome">
          <h2>Crea la tua prima attività</h2>
          <p>Ti bastano il nome e il tipo. Il resto lo scrivi dopo, come lo diresti a un collaboratore.</p>
          <ol className="welcome-steps">
            <li><ChatIcon /><span><strong>Scrivi cosa cambia</strong>"Sabato chiudiamo alle 15", "La diavola costa 8 euro"</span></li>
            <li><EyeIcon /><span><strong>Guarda l'anteprima</strong>Vedi il sito com'è con la modifica, prima che cambi</span></li>
            <li><PhotoIcon /><span><strong>Aggiungi logo e foto</strong>Dal pannello o mandandole su WhatsApp</span></li>
          </ol>
        </section>
      )}

      {data && data.length > 0 && (
        <ul className="biz-grid">
          {data.map((b, i) => <BusinessCard key={b.id} b={b} index={i} />)}
        </ul>
      )}

      </div>
      <NewBusiness first={Boolean(empty)} />
      </div>
    </main>
  );
}

function BusinessCard({ b, index }: { b: BusinessSummary; index: number }) {
  const style = { '--accent': b.accent, '--i': index } as CSSProperties;
  const statusClass = b.status.open ? (b.status.closingSoon ? 'is-soon' : 'is-open') : 'is-closed';
  return (
    <li className="biz-card" style={style}>
      <div className="biz-cover">
        {b.cover && <img src={photoUrl(b.cover, { w: 640, h: 260 })} alt="" loading="lazy" />}
        {b.pending > 0 && <span className="biz-pending">{b.pending === 1 ? '1 modifica da confermare' : `${b.pending} modifiche da confermare`}</span>}
      </div>
      <div className="biz-body">
        <span className="biz-mark">
          {b.logo ? <img src={photoUrl(b.logo, { w: 120 })} alt="" /> : b.name.charAt(0)}
        </span>
        <h2><Link className="biz-link" to={`/b/${b.id}`}>{b.name}</Link></h2>
        <p className="biz-meta">{b.categoryLabel} · {ROLE_LABEL[b.role]}</p>
        <p className={`biz-status ${statusClass}`}><span className="dot" />{b.status.label}{b.status.detail && <span className="muted"> · {b.status.detail}</span>}</p>
        <div className="biz-foot">
          <span><ListIcon size={15} />{b.items === 1 ? '1 voce' : `${b.items} voci`}</span>
          <span><PhotoIcon size={15} />{b.photos === 1 ? '1 foto' : `${b.photos} foto`}</span>
          <span><ClockIcon size={15} />{b.updatedAt ? `Aggiornato ${ago(b.updatedAt)}` : 'Mai aggiornato'}</span>
        </div>
        <a className="biz-site" href={`${SITE_URL}/${b.slug}`} target="_blank" rel="noreferrer">/{b.slug}<ExternalIcon size={14} /></a>
      </div>
    </li>
  );
}

/** Aggiunge un'attività: nome e tipo, il resto si scrive poi in chat o su WhatsApp. */
function NewBusiness({ first }: { first: boolean }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const slug = toSlug(name);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (slug.length < 2) return setError('Scrivi il nome dell\'attività.');
    if (!category) return setError('Scegli il tipo di attività.');
    setError(null);
    setBusy(true);
    try {
      const b = await api.createBusiness(name.trim(), slug, category);
      navigate(`/b/${b.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form className="card new-business" onSubmit={onSubmit}>
      <h2><PlusIcon size={18} />{first ? 'La tua attività' : 'Nuova attività'}</h2>
      <label>
        Nome
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Bar Centrale" maxLength={120} />
      </label>
      <p className="hint">{slug ? <>Il sito sarà su <strong>/{slug}</strong></> : 'Orari, menu e contatti li aggiungi dopo, scrivendo.'}</p>
      <fieldset className="category-pills">
        <legend>Tipo di attività</legend>
        {CATEGORIES.map((c) => (
          <label key={c.id} className={category === c.id ? 'is-on' : ''}>
            <input type="radio" name="category" value={c.id} checked={category === c.id} onChange={() => setCategory(c.id)} />
            {c.label}
          </label>
        ))}
      </fieldset>
      <p className="hint">Serve per i messaggi d'esempio, i nomi delle sezioni del sito e come ti presenta Google.</p>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? 'Un attimo…' : 'Crea attività'}</button>
    </form>
  );
}
