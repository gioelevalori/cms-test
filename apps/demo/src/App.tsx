import { useEffect, useMemo, useState } from 'react';
import { applyOps, describeOp, interpretMessage, toSchemaOrg, todayIn, type ChangeOp } from '@cms/shared';
import { BusinessList } from './BusinessList';
import { Chat, type Pending } from './Chat';
import { Site } from './Site';
import { Sales } from './Sales';
import { SAMPLES } from './sample';
import { loadState, resetState, saveState, type HistoryEntry } from './storage';

const newId = () => Math.random().toString(36).slice(2, 10);

export function App() {
  const [state, setState] = useState(loadState);
  const [selected, setSelected] = useState(SAMPLES[0].id);
  const [pending, setPending] = useState<Pending | null>(null);
  const [showSchema, setShowSchema] = useState(false);
  const [notice, setNotice] = useState('');
  const today = useMemo(() => todayIn('Europe/Rome'), []);

  const sample = SAMPLES.find((s) => s.id === selected)!;
  const biz = state[selected];

  useEffect(() => saveState(state), [state]);

  function select(id: string) {
    setSelected(id);
    setPending(null);
    setNotice('');
  }

  function send(text: string) {
    const command = text.trim().replace(/[.!]+$/, '').toLocaleLowerCase('it');
    if (/^(sì|si|ok|conferma|confermo)$/.test(command)) {
      if (pending?.ops.length) confirm();
      else setNotice('Non ci sono modifiche da confermare. Scrivi cosa vuoi cambiare.');
      return;
    }
    if (/^(no|scarta)$/.test(command)) {
      cancel();
      return;
    }
    if (/^annulla( l['’]ultima)?( modifica)?$/.test(command)) { undo(); return; }
    if (/^(aiuto|help|ciao)$/.test(command)) {
      setNotice('Prova con un giorno e un orario, oppure con una voce del listino e il suo prezzo. Scrivi “sì” per confermare e “annulla” per ripristinare l’ultima modifica.');
      return;
    }
    setNotice('');
    const { ops, unrecognized } = interpretMessage(text, biz.data, today);
    setPending({ message: text, ops, summary: ops.map((op: ChangeOp) => describeOp(op, biz.data)), unrecognized });
  }

  function confirm() {
    if (!pending || pending.ops.length === 0) return;
    const entry: HistoryEntry = { id: newId(), message: pending.message, summary: pending.summary, before: biz.data, at: new Date().toISOString() };
    setState({ ...state, [selected]: { data: applyOps(biz.data, pending.ops, newId), history: [entry, ...biz.history].slice(0, 20) } });
    setPending(null);
    setNotice('Modifica confermata. Puoi vedere il risultato sul sito o scrivere “annulla” per tornare indietro.');
    // Su schermi stretti il sito è sotto la chat: lo porto in vista per vedere la modifica.
    if (window.matchMedia('(max-width: 899px)').matches) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTimeout(() => document.querySelector('.preview')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }), 150);
    }
  }

  function undo() {
    const [last, ...rest] = biz.history;
    if (last) {
      setState({ ...state, [selected]: { data: last.before, history: rest } });
      setPending(null);
      setNotice('Ultima modifica annullata: il sito è tornato com’era prima.');
    } else setNotice('Non ci sono modifiche da annullare per questa attività.');
  }

  function cancel() {
    setPending(null);
    setNotice(pending ? 'Proposta scartata. Il sito resta com’era.' : 'Non ci sono proposte da scartare. Scrivi cosa vuoi cambiare.');
  }

  function jumpTo(target: '.chat' | '.preview') {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelector(target)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  function tryExample(id: string, message: string) {
    setSelected(id);
    setNotice('');
    const data = state[id].data;
    const { ops, unrecognized } = interpretMessage(message, data, today);
    setPending({ message, ops, summary: ops.map((op) => describeOp(op, data)), unrecognized });
    requestAnimationFrame(() => jumpTo('.chat'));
  }

  function restart() {
    setState(resetState());
    setPending(null);
    setNotice('Demo ripristinata: tutte le attività sono tornate ai dati iniziali.');
  }

  return (
    <div className="page" id="inizio">
      <a className="skip-link" href="#demo">Vai alla demo</a>
      <nav className="topnav" aria-label="Menu principale">
        <a className="topnav-brand" href="#inizio"><span className="topnav-mark" aria-hidden="true" />cms-test</a>
        <div className="topnav-links">
          <a href="#come-funziona">Come funziona</a>
          <a href="#esempi">Esempi</a>
          <a href="#sicurezza">Sicurezza</a>
          <a href="#freelance">Per i freelance</a>
          <a href="#domande">Domande</a>
        </div>
        <a className="topnav-cta" href="#richiesta">Per la tua attività</a>
      </nav>
      <header className="top">
        <div className="top-copy">
          <h1>Il sito della tua attività si aggiorna con un messaggio.</h1>
          <p>
            Scrivi cosa cambia come faresti su WhatsApp, guarda l'anteprima e conferma: orari, prezzi e novità sul sito sono già aggiornati.
            Per ristoranti, negozi, saloni, studi, palestre. E per chi fa siti ai clienti: ogni cliente è una chat.
          </p>
        </div>
      </header>

      <main id="demo" tabIndex={-1}>
      <div className="demo-toolbar">
        <div>
          <h2>Prova un aggiornamento</h2>
          <p>Attività inventate. Nessun account e nessun messaggio WhatsApp inviato.</p>
        </div>
        <div className="demo-jumps">
          <button onClick={() => { jumpTo('.chat'); document.getElementById('wa-input')?.focus({ preventScroll: true }); }}>Vai alla chat</button>
          <button onClick={() => { jumpTo('.preview'); document.querySelector<HTMLElement>('.preview')?.focus({ preventScroll: true }); }}>Guarda il sito</button>
        </div>
      </div>
      <ol className="demo-progress" aria-label="Passaggi della demo">
        <li aria-current={!pending?.ops.length && !biz.history.length ? 'step' : undefined}>1. Scegli e scrivi</li>
        <li aria-current={pending?.ops.length ? 'step' : undefined}>2. Controlla e conferma</li>
        <li aria-current={!pending?.ops.length && biz.history.length ? 'step' : undefined}>3. Guarda il risultato</li>
      </ol>
      <div className="app">
        <BusinessList state={state} selected={selected} onSelect={select} />
        <Chat
          key={selected}
          businessName={biz.data.name}
          accent={sample.accent}
          examples={sample.examples}
          history={biz.history}
          pending={pending}
          notice={notice}
          onSend={send}
          onConfirm={confirm}
          onCancel={cancel}
          onUndo={undo}
        />
        <Site sample={sample} data={biz.data} today={today} />
      </div>

      <Sales onTryExample={tryExample} />
      </main>

      <footer className="bottom">
        <p>Demo: attività e dati sono inventati, tutto resta nel tuo browser e nessun messaggio viene inviato.</p>
        <div className="bottom-actions">
          <a href="#richiesta">Parliamo della tua attività</a>
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
