import { FormEvent, useEffect, useRef, useState } from 'react';
import { api, ApiError, type Change, type ChatResult } from '../api/client';

interface Props {
  businessId: string;
  /** Messaggi d'esempio adatti a questa attività. */
  examples: string[];
  onApplied: () => void;
  /** La proposta in attesa (o nessuna), per mostrare il sito com'è con la modifica. */
  onPending?: (changeId: string | null) => void;
  previewHref: (changeId: string) => string;
  /** Una frase da mettere nella casella (dalla lista "Completa il sito"); `key` cambia a ogni richiesta. */
  prefill?: { text: string; key: number };
}

/** Il cuore del CMS: si scrive cosa cambia, si vede l'anteprima, si conferma. */
export function Chat({ businessId, examples, onApplied, onPending, previewHref, prefill }: Props) {
  const [message, setMessage] = useState('');
  const [result, setResultState] = useState<ChatResult | null>(null);
  const setResult = (r: ChatResult | null) => {
    setResultState(r);
    onPending?.(r?.status === 'proposed' ? r.id : null);
  };
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!prefill) return;
    setMessage(prefill.text);
    box.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Il cursore va in fondo, dove si completa la frase.
    setTimeout(() => { box.current?.focus(); box.current?.setSelectionRange(prefill.text.length, prefill.text.length); }, 300);
  }, [prefill?.key]);
  // La conferma resta visibile qualche secondo, poi si ritira da sola.
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 3500);
    return () => clearTimeout(t);
  }, [done]);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    setError(null);
    setDone(false);
    setResult(null);
    try {
      setResult(await api.chat(businessId, message.trim()));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function decide(change: Change, confirm: boolean) {
    setBusy(true);
    setError(null);
    try {
      if (confirm) {
        await api.confirm(change.id);
        setMessage('');
        setDone(true);
        onApplied();
      } else {
        await api.reject(change.id);
      }
      setResult(null);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? err.message : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card chat">
      <h2>Cosa cambia oggi?</h2>
      <form onSubmit={send}>
        <textarea
          ref={box}
          rows={3}
          value={message}
          placeholder="Scrivi come parleresti a un collaboratore…"
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button type="submit" disabled={busy || !message.trim()}>Invia</button>
      </form>

      {!result && (
        <div className="examples">
          {examples.map((ex) => (
            <button key={ex} className="chip" type="button" onClick={() => setMessage(ex)}>{ex}</button>
          ))}
        </div>
      )}

      {error && <p className="error">{error}</p>}
      {done && <p className="done-note" role="status">Fatto: il sito è aggiornato.</p>}

      {result?.status === 'not_understood' && (
        <div className="proposal muted">
          <p>Non ho capito questo messaggio. Prova con una frase come quelle di esempio.</p>
        </div>
      )}

      {result && result.status === 'proposed' && (
        <div className="proposal">
          <p className="label">Ecco cosa cambierà:</p>
          <ul>{result.summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
          <a className="preview-link" href={previewHref(result.id)} target="_blank" rel="noreferrer">Guarda l'anteprima del sito ↗</a>
          {result.unrecognized.length > 0 && (
            <p className="hint">Non ho capito: “{result.unrecognized.join('”, “')}”</p>
          )}
          <div className="actions">
            <button disabled={busy} onClick={() => decide(result, true)}>Conferma</button>
            <button className="ghost" disabled={busy} onClick={() => decide(result, false)}>Annulla</button>
          </div>
        </div>
      )}
    </section>
  );
}
