import { useEffect, useMemo, useState } from 'react';
import { applyOps, describeOp, interpretMessage, toSchemaOrg, todayIn, type ChangeOp } from '@cms/shared';
import { BusinessList } from './BusinessList';
import { Chat, type Pending } from './Chat';
import { Site } from './Site';
import { SAMPLES } from './sample';
import { loadState, resetState, saveState, type HistoryEntry } from './storage';

const newId = () => Math.random().toString(36).slice(2, 10);

export function App() {
  const [state, setState] = useState(loadState);
  const [selected, setSelected] = useState(SAMPLES[0].id);
  const [pending, setPending] = useState<Pending | null>(null);
  const [showSchema, setShowSchema] = useState(false);
  const today = useMemo(() => todayIn('Europe/Rome'), []);

  const sample = SAMPLES.find((s) => s.id === selected)!;
  const biz = state[selected];

  useEffect(() => saveState(state), [state]);

  function select(id: string) {
    setSelected(id);
    setPending(null);
  }

  function send(text: string) {
    const { ops, unrecognized } = interpretMessage(text, biz.data, today);
    setPending({ message: text, ops, summary: ops.map((op: ChangeOp) => describeOp(op, biz.data)), unrecognized });
  }

  function confirm() {
    if (!pending || pending.ops.length === 0) return;
    const entry: HistoryEntry = { id: newId(), message: pending.message, summary: pending.summary, before: biz.data, at: new Date().toISOString() };
    setState({ ...state, [selected]: { data: applyOps(biz.data, pending.ops, newId), history: [entry, ...biz.history].slice(0, 20) } });
    setPending(null);
    // Su schermi stretti il sito è sotto la chat: lo porto in vista per vedere la modifica.
    if (window.matchMedia('(max-width: 899px)').matches) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTimeout(() => document.querySelector('.preview')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }), 150);
    }
  }

  function undo() {
    const [last, ...rest] = biz.history;
    if (last) setState({ ...state, [selected]: { data: last.before, history: rest } });
  }

  function restart() {
    setState(resetState());
    setPending(null);
  }

  return (
    <div className="page">
      <nav className="topnav" aria-label="Menu principale">
        <a className="topnav-brand" href="#demo"><span className="topnav-mark" aria-hidden="true" />cms-test</a>
        <div className="topnav-links">
          <a href="#come-funziona">Come funziona</a>
          <a href="#freelance">Per i freelance</a>
        </div>
        <a className="topnav-cta" href="#demo">Prova ora</a>
      </nav>
      <header className="top" id="demo">
        <div className="top-copy">
          <h1>Il sito della tua attività si aggiorna con un messaggio.</h1>
          <p>
            Scrivi cosa cambia come faresti su WhatsApp, guarda l'anteprima e conferma: orari, prezzi e novità sul sito sono già aggiornati.
            Per ristoranti, negozi, saloni, studi, palestre. E per chi fa siti ai clienti: ogni cliente è una chat.
          </p>
        </div>
      </header>

      <div className="app">
        <BusinessList state={state} selected={selected} onSelect={select} />
        <Chat
          key={selected}
          businessName={biz.data.name}
          accent={sample.accent}
          examples={sample.examples}
          history={biz.history}
          pending={pending}
          onSend={send}
          onConfirm={confirm}
          onCancel={() => setPending(null)}
          onUndo={undo}
        />
        <Site sample={sample} data={biz.data} today={today} />
      </div>

      <section className="how" id="come-funziona" aria-labelledby="how-t">
        <h2 id="how-t">Come funziona</h2>
        <ol>
          <li><strong>Scrivi cosa cambia</strong> su WhatsApp, come a un collaboratore.</li>
          <li><strong>Guarda l'anteprima</strong> e conferma, oppure annulla.</li>
          <li><strong>Il sito è aggiornato</strong>, insieme ai dati che legge Google.</li>
        </ol>
        <p id="freelance">
          <strong>Per i freelance:</strong> costruisci il sito una volta, poi il cliente lo tiene aggiornato da solo scrivendo. Ogni cliente è una chat.
        </p>
      </section>

      <footer className="bottom">
        <p>Demo: attività e dati sono inventati, tutto resta nel tuo browser e nessun messaggio viene inviato.</p>
        <div className="bottom-actions">
          <button className="text-btn" aria-expanded={showSchema} onClick={() => setShowSchema(!showSchema)}>
            {showSchema ? 'Nascondi' : 'Mostra'} cosa legge Google
          </button>
          <button className="text-btn" onClick={restart}>Ricomincia da capo</button>
        </div>
        {showSchema && (
          <section className="schema" aria-label="Dati schema.org">
            <p>Gli stessi dati di {biz.data.name}, nel formato schema.org che Google usa per orari e listini. Si aggiornano insieme al sito.</p>
            <pre>{JSON.stringify(toSchemaOrg(biz.data, `https://${sample.domain}`), null, 2)}</pre>
          </section>
        )}
      </footer>
    </div>
  );
}
