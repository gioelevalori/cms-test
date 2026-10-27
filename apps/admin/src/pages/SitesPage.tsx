import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, setToken } from '../api/client';

export function SitesPage() {
  const navigate = useNavigate();
  const { data: sites, isLoading } = useQuery({ queryKey: ['sites'], queryFn: api.sites });

  return (
    <main className="container">
      <header className="topbar">
        <h1>I tuoi siti</h1>
        <button className="ghost" onClick={() => { setToken(null); navigate('/login'); }}>Esci</button>
      </header>
      {isLoading && <p>Caricamento…</p>}
      <ul className="list">
        {sites?.map((s) => (
          <li key={s.id} className="card">
            <Link to={`/sites/${s.id}`}>{s.name}</Link>
            <span className="badge">{s.role}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
