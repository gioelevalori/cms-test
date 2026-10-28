import { useEffect, useMemo, useState } from 'react';
import { applyOps, describeOp, interpretMessage, toSchemaOrg, todayIn, type ChangeOp } from '@cms/shared';
import { SitePreview } from './SitePreview';
import { Chat, type Pending } from './Chat';
import { loadState, resetState, saveState, type HistoryEntry } from './storage';

const newId = () => Math.random().toString(36).slice(2, 10);

export function App() {
  const [state, setState] = useState(loadState);
  const [pending, setPending] = useState<Pending | null>(null);
  const [showSchema, setShowSchema] = useState(false);
  const today = useMemo(() => todayIn('Europe/Rome'), []);

  useEffect(() => saveState(state), [state]);

  function send(text: string) {
    const { ops, unrecognized } = interpretMessage(text, state.data, today);
    setPending({
      message: text,
      ops,
      summary: ops.map((op: ChangeOp) => describeOp(op, state.data)),
      unrecognized,
    });
  }

  function confirm() {
    if (!pending || pending.ops.length === 0) return;
    const entry: HistoryEntry = { id: newId(), message: pending.message, summary: pending.summary, before: state.data, at: new Date().toISOString() };
    setState({ data: applyOps(state.data, pending.ops, newId), history: [entry, ...state.history].slice(0, 20) });
    setPending(null);
  }

  function undo() {
    const [last, ...rest] = state.history;
    if (last) setState({ data: last.before, history: rest });
  }

  function restart() {
    setState(resetState());
    setPending(null);
  }

  return (
    <div className="wall">
      <div className="stage">
      <header className="ledge-top">
        <p className="hook">Il sito della tua attività si aggiorna con un messaggio WhatsApp.</p>
        <p className="fine">
          Demo: scrivi nella chat come faresti su WhatsApp e guarda la lavagna cambiare. Tutto resta nel tuo browser, nessun messaggio viene inviato.{' '}
          <button className="text-btn" onClick={restart}>Ricomincia da capo</button>
        </p>
      </header>

        <Chat
          businessName={state.data.name}
          history={state.history}
          pending={pending}
          onSend={send}
          onConfirm={confirm}
          onCancel={() => setPending(null)}
          onUndo={undo}
        />

        <main className="frame" aria-label="Anteprima del sito">
          <SitePreview data={state.data} today={today} />
          <div className="tray">
            <span className="chalk-sticks" aria-hidden="true"><i /><i /><i /></span>
            <span className="tray-note">Anteprima di un sito d'esempio: attività e dati sono inventati</span>
            <button className="text-btn" aria-expanded={showSchema} onClick={() => setShowSchema(!showSchema)}>
              {showSchema ? 'Nascondi' : 'Mostra'} cosa legge Google
            </button>
          </div>
        </main>
      </div>

      {showSchema && (
        <section className="schema" aria-label="Dati schema.org">
          <p>Gli stessi dati, nel formato schema.org che Google usa per orari e menu. Si aggiornano insieme alla lavagna.</p>
          <pre>{JSON.stringify(toSchemaOrg(state.data, 'https://example.com'), null, 2)}</pre>
        </section>
      )}
    </div>
  );
}
