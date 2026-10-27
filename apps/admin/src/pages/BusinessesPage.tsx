import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, setToken } from '../api/client';

const ROLE_LABEL = { owner: 'Proprietario', builder: 'Costruttore', client: 'Cliente' };

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
    </main>
  );
}
