import { useEffect, useState } from 'react';
import type { PageBlock } from '@cms/shared';
import type { Page } from '../api/client';

const LABELS: Record<PageBlock['type'], string> = {
  hero: 'Copertina',
  about: 'Chi siamo',
  hours: 'Orari',
  catalog: 'Menu / listino',
  gallery: 'Galleria foto',
  posts: 'Notizie ed eventi',
  contacts: 'Contatti',
  text: 'Testo libero',
};

interface Props {
  page: Page;
  onSave: (layout: PageBlock[]) => void;
  busy: boolean;
}

/** Solo per il costruttore: ordine dei blocchi della pagina. I contenuti arrivano dai dati. */
export function LayoutEditor({ page, onSave, busy }: Props) {
  const [layout, setLayout] = useState(page.layout);
  useEffect(() => setLayout(page.layout), [page]);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= layout.length) return;
    const next = [...layout];
    [next[i], next[j]] = [next[j], next[i]];
    setLayout(next);
  };
  const dirty = JSON.stringify(layout) !== JSON.stringify(page.layout);

  return (
    <section className="card">
      <h2>Struttura della pagina “{page.title}”</h2>
      <p className="muted small">Visibile solo al costruttore. Il cliente può cambiare i dati, non la struttura.</p>
      <ol className="layout">
        {layout.map((b, i) => (
          <li key={b.id} className="row-between">
            <span>{LABELS[b.type]}</span>
            <span>
              <button className="ghost small" onClick={() => move(i, -1)}>↑</button>
              <button className="ghost small" onClick={() => move(i, 1)}>↓</button>
              <button className="ghost small danger" onClick={() => setLayout(layout.filter((_, j) => j !== i))}>✕</button>
            </span>
          </li>
        ))}
      </ol>
      <button disabled={busy || !dirty} onClick={() => onSave(layout)}>Salva struttura</button>
    </section>
  );
}
