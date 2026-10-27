import type { Change } from '../api/client';

interface Props {
  changes: Change[];
  onUndo: (change: Change) => void;
  busy: boolean;
}

const STATUS = { proposed: 'In attesa', applied: 'Applicata', rejected: 'Scartata', undone: 'Annullata' };

export function History({ changes, onUndo, busy }: Props) {
  const lastApplied = changes.find((c) => c.status === 'applied');
  return (
    <section className="card">
      <h2>Cronologia</h2>
      {changes.length === 0 && <p className="muted">Ancora nessuna modifica.</p>}
      <ul className="plain history">
        {changes.map((c) => (
          <li key={c.id}>
            <div className="row-between">
              <span className={`badge ${c.status}`}>{STATUS[c.status]}</span>
              <span className="muted small">{new Date(c.createdAt).toLocaleString('it-IT')}{c.author ? ` · ${c.author}` : ''}</span>
            </div>
            {c.message && <p className="quote">“{c.message}”</p>}
            <ul>{c.summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
            {c.id === lastApplied?.id && (
              <button className="ghost small" disabled={busy} onClick={() => onUndo(c)}>Annulla questa modifica</button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
