import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CATEGORIES } from '@cms/shared';
import { api, setToken } from '../api/client';

const ROLE_LABEL = { owner: 'Proprietario', builder: 'Costruttore', client: 'Cliente' };

/** "Bar Centrale & Co." → "bar-centrale-co": l'indirizzo del sito. */
const toSlug = (name: string) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

export function BusinessesPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({ queryKey: ['businesses'], queryFn: api.businesses });

  return (
    <main className="container">
      <header className="topbar">
        <h1>Le tue attività</h1>
        <button className="ghost" onClick={() => { setToken(null); navigate('/login'); }}>Esci</button>
      </header>
      {isLoading && <p>Caricamento…</p>}
      {error && <p className="error">{(error as Error).message}</p>}
      <ul className="list">
        {data?.map((b) => (
          <li key={b.id} className="card row-between">
            <Link to={`/b/${b.id}`}>{b.name}</Link>
            <span className="badge">{ROLE_LABEL[b.role]}</span>
          </li>
        ))}
      </ul>
      <NewBusiness />
    </main>
  );
}

/** Aggiunge un'attività: nome e indirizzo del sito, il resto si scrive poi in chat o su WhatsApp. */
function NewBusiness() {
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
      <h2>Nuova attività</h2>
      <label>
        Nome
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Bar Centrale" maxLength={120} />
      </label>
      <p className="hint">{slug ? `Il sito sarà su /${slug}` : 'Orari, menu e contatti li aggiungi dopo, scrivendo.'}</p>
      <label>
        Tipo di attività
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="" disabled>Scegli…</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </label>
      <p className="hint">Serve per i messaggi d'esempio, i nomi delle sezioni del sito e come ti presenta Google.</p>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? 'Un attimo…' : 'Crea attività'}</button>
    </form>
  );
}
