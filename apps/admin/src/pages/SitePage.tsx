import { FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { canEditStructure } from '@cms/shared';
import { api } from '../api/client';

export function SitePage() {
  const { siteId = '' } = useParams();
  const qc = useQueryClient();
  const site = useQuery({ queryKey: ['site', siteId], queryFn: () => api.site(siteId) });
  const pages = useQuery({ queryKey: ['pages', siteId], queryFn: () => api.pages(siteId) });
  const [title, setTitle] = useState('');

  const create = useMutation({
    mutationFn: () => api.createPage(siteId, title, title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')),
    onSuccess: () => { setTitle(''); qc.invalidateQueries({ queryKey: ['pages', siteId] }); },
  });

  const isBuilder = site.data ? canEditStructure(site.data.role) : false;

  return (
    <main className="container">
      <header className="topbar">
        <div><Link to="/">← Siti</Link><h1>{site.data?.name}</h1></div>
      </header>
      <ul className="list">
        {pages.data?.map((p) => (
          <li key={p.id} className="card">
            <Link to={`/sites/${siteId}/pages/${p.id}`}>{p.title}</Link>
            <span className={`badge ${p.status}`}>{p.status === 'published' ? 'Pubblicata' : 'Bozza'}</span>
          </li>
        ))}
      </ul>
      {isBuilder && (
        <form className="row" onSubmit={(e: FormEvent) => { e.preventDefault(); if (title) create.mutate(); }}>
          <input placeholder="Titolo nuova pagina" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button type="submit">Crea pagina</button>
        </form>
      )}
    </main>
  );
}
