import { FormEvent, useEffect, useRef, useState } from 'react';
import type { ChangeOp } from '@cms/shared';
import type { HistoryEntry } from './storage';

export interface Pending {
  message: string;
  ops: ChangeOp[];
  summary: string[];
  unrecognized: string[];
}

interface Props {
  businessName: string;
  accent: string;
  examples: string[];
  history: HistoryEntry[];
  pending: Pending | null;
  notice: string;
  onSend: (text: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onUndo: () => void;
}

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M3.4 20.4 21 12 3.4 3.6l.1 6.5L15 12 3.5 13.9z" fill="currentColor" />
    </svg>
  );
}

function Ticks() {
  return (
    <svg className="ticks" viewBox="0 0 18 12" width="16" height="11" aria-label="letto">
      <path d="m1 6.5 3.2 3.2L10.6 2.6M7.4 9.7l.4.4L14.4 2.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Conversazione WhatsApp simulata: stessa sequenza del bot reale (anteprima → Conferma / Annulla). */
export function Chat({ businessName, accent, examples, history, pending, notice, onSend, onConfirm, onCancel, onUndo }: Props) {
  const [text, setText] = useState('');
  const logRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // All'apertura la chat resta in cima, sul benvenuto e sugli esempi; poi segue l'ultimo messaggio.
  const seen = useRef({ count: history.length, pending });
  useEffect(() => {
    const log = logRef.current;
    const first = seen.current.count === history.length && seen.current.pending === pending;
    seen.current = { count: history.length, pending };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (log && !(first && history.length === 0 && !notice)) log.scrollTo({ top: log.scrollHeight, behavior: first || reduce ? 'auto' : 'smooth' });
  }, [history.length, pending, notice]);

  useEffect(() => {
    if (pending?.ops.length) confirmRef.current?.focus({ preventScroll: true });
  }, [pending]);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText('');
  }

  function pick(example: string) {
    onSend(example);
    setText('');
  }

  const past = [...history].reverse();

  return (
    <section className="chat" aria-label={`Chat con l'assistente del sito di ${businessName}`}>
      <div className="wa-head">
        <span className="avatar" style={{ background: accent }} aria-hidden="true">{businessName.charAt(0)}</span>
        <div>
          <p className="wa-name">{businessName}</p>
          <p className="wa-sub">Assistente del sito · scrivi come su WhatsApp</p>
        </div>
      </div>

      <ol className="wa-log" ref={logRef} aria-live="polite">
        <li className="bubble in">
          Ciao! Scrivimi cosa cambia, come lo diresti a un collaboratore. Ti mostro l'anteprima e aggiorno il sito solo quando confermi.
        </li>

        {past.length === 0 && !pending && (
          <li className="bubble in wa-starters">
            Per provare, tocca una frase:
            <div className="wa-starter-list">
              {examples.map((ex) => (
                <button key={ex} className="wa-starter" onClick={() => pick(ex)}>{ex}</button>
              ))}
            </div>
          </li>
        )}

        {past.map((h, i) => (
          <li key={h.id} className="pair">
            <div className="bubble out">{h.message}<span className="meta">{hhmm(h.at)} <Ticks /></span></div>
            <div className="bubble in">
              Fatto, il sito è aggiornato:
              <ul>{h.summary.map((s, j) => <li key={j}>{s}</li>)}</ul>
              {i === past.length - 1 && !pending && (
                <button className="wa-action" onClick={onUndo}>Annulla questa modifica</button>
              )}
            </div>
          </li>
        ))}

        {notice && <li className="bubble in" role="status">{notice}</li>}

        {pending && (
          <li className="pair">
            <div className="bubble out">{pending.message}<span className="meta">adesso <Ticks /></span></div>
            {pending.ops.length > 0 ? (
              <div className="bubble in">
                Ecco cosa cambierà:
                <ul>{pending.summary.map((s, j) => <li key={j}>{s}</li>)}</ul>
                {pending.unrecognized.length > 0 && (
                  <p className="wa-note">Questa parte non l'ho capita: “{pending.unrecognized.join('”, “')}”</p>
                )}
                <div className="wa-buttons">
                  <button ref={confirmRef} className="wa-action" onClick={onConfirm}>Conferma</button>
                  <button className="wa-action" onClick={onCancel}>Annulla</button>
                </div>
              </div>
            ) : (
              <div className="bubble in">
                Non ho capito cosa cambiare. Prova a scrivere giorno e orario, oppure la voce e il prezzo, come negli esempi qui sotto.
              </div>
            )}
          </li>
        )}
      </ol>

      {!pending?.ops.length && (past.length > 0 || pending) && (
        <div className="wa-suggest" role="group" aria-label="Frasi di esempio">
          {examples.map((ex) => (
            <button key={ex} className="wa-chip" onClick={() => pick(ex)}>{ex}</button>
          ))}
        </div>
      )}

      <form className="wa-compose" onSubmit={submit}>
        <label className="sr-only" htmlFor="wa-input">Messaggio</label>
        <textarea
          id="wa-input"
          ref={inputRef}
          rows={1}
          value={text}
          placeholder="Scrivi cosa cambia…"
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }}
        />
        <button type="submit" className="wa-send" disabled={!text.trim()} aria-label="Invia">
          <SendIcon />
        </button>
      </form>
    </section>
  );
}
