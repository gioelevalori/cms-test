import { FormEvent, useEffect, useMemo, useState } from 'react';
import { applyOps, describeOp, interpretMessage, toSchemaOrg, todayIn, type ChangeOp } from '@cms/shared';
import { SitePreview } from './SitePreview';
import { loadState, resetState, saveState, type HistoryEntry } from './storage';

const EXAMPLES = [
  'Sabato chiudiamo alle 15',
  'Domani siamo chiusi per inventario',
  'Dal 10 al 20 agosto chiusi per ferie',
  'La carbonara è finita',
  'La margherita costa 7 euro',
  'Aggiungi la diavola a 8 euro nella sezione pizze',
  'Evento il 12 dicembre: serata jazz dal vivo',
  'Il lunedì siamo chiusi',
];

const newId = () => Math.random().toString(36).slice(2, 10);

interface Proposal {
  message: string;
  ops: ChangeOp[];
  summary: string[];
  unrecognized: string[];
}

export function App() {
  const [state, setState] = useState(loadState);
  const [message, setMessage] = useState('');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [notUnderstood, setNotUnderstood] = useState(false);
  const [flash, setFlash] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const today = useMemo(() => todayIn('Europe/Rome'), []);

  useEffect(() => saveState(state), [state]);

  function send(e?: FormEvent) {
    e?.preventDefault();
    const text = message.trim();
    if (!text) return;
    const { ops, unrecognized } = interpretMessage(text, state.data, today);
    setNotUnderstood(ops.length === 0);
    setProposal(ops.length ? { message: text, ops, summary: ops.map((op) => describeOp(op, state.data)), unrecognized } : null);
  }

  function confirm() {
    if (!proposal) return;
    const entry: HistoryEntry = { id: newId(), message: proposal.message, summary: proposal.summary, before: state.data, at: new Date().toISOString() };
    setState({ data: applyOps(state.data, proposal.ops, newId), history: [entry, ...state.history].slice(0, 20) });
    setProposal(null);
    setMessage('');
    setFlash(true);
    setTimeout(() => setFlash(false), 900);
  }

  function undo() {
    const [last, ...rest] = state.history;
    if (last) setState({ data: last.before, history: rest });
  }

  return (
    <div className="app">
      <div className="banner">
        <strong>cms-test</strong> · demo statica: tutto gira nel tuo browser e i dati restano qui. La versione completa (API e
        database) è nel repository.
        <button className="link" onClick={() => { setState(resetState()); setProposal(null); }}>Ricomincia</button>
      </div>

      <div className="layout">
        <aside className="panel">
          <h2>Cosa cambia oggi?</h2>
          <p className="muted">Scrivi come parleresti a un collaboratore. Vedi l'anteprima, poi conferma.</p>
          <form onSubmit={send}>
            <textarea
              rows={3}
              value={message}
              placeholder="Es. Sabato chiudiamo alle 15"
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <button type="submit" disabled={!message.trim()}>Invia</button>
          </form>

          {!proposal && (
            <div className="examples">
              {EXAMPLES.map((ex) => (
                <button key={ex} className="chip" onClick={() => { setMessage(ex); setNotUnderstood(false); }}>{ex}</button>
              ))}
            </div>
          )}

          {notUnderstood && !proposal && (
            <div className="proposal muted-box">Non ho capito questo messaggio. Prova con una delle frasi di esempio.</div>
          )}

          {proposal && (
            <div className="proposal">
              <p className="label">Ecco cosa cambierà:</p>
              <ul>{proposal.summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
              {proposal.unrecognized.length > 0 && <p className="muted small">Non ho capito: “{proposal.unrecognized.join('”, “')}”</p>}
              <div className="actions">
                <button onClick={confirm}>Conferma</button>
                <button className="ghost" onClick={() => setProposal(null)}>Annulla</button>
              </div>
            </div>
          )}

          <h3>Cronologia</h3>
          {state.history.length === 0 && <p className="muted small">Ancora nessuna modifica.</p>}
          <ul className="history">
            {state.history.map((h, i) => (
              <li key={h.id}>
                <p className="quote">“{h.message}”</p>
                <ul>{h.summary.map((s, j) => <li key={j}>{s}</li>)}</ul>
                {i === 0 && <button className="ghost small" onClick={undo}>Annulla questa modifica</button>}
              </li>
            ))}
          </ul>

          <button className="link" onClick={() => setShowSchema(!showSchema)}>
            {showSchema ? 'Nascondi' : 'Mostra'} i dati per Google (schema.org)
          </button>
          {showSchema && <pre className="schema">{JSON.stringify(toSchemaOrg(state.data, 'https://example.com'), null, 2)}</pre>}
        </aside>

        <main className="preview">
          <div className="browser-bar"><span /><span /><span /><em>pizzeriadamario.it</em></div>
          <SitePreview data={state.data} today={today} highlight={flash} />
        </main>
      </div>
    </div>
  );
}
