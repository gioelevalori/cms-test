import { FormEvent, useState } from 'react';
import { api, ApiError, type Change, type ChatResult } from '../api/client';

interface Props {
  businessId: string;
  /** Messaggi d'esempio adatti a questa attività. */
  examples: string[];
  onApplied: () => void;
}

/** Il cuore del CMS: si scrive cosa cambia, si vede l'anteprima, si conferma. */
export function Chat({ businessId, examples, onApplied }: Props) {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<ChatResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    setError(null);
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

      {result?.status === 'not_understood' && (
        <div className="proposal muted">
          <p>Non ho capito questo messaggio. Prova con una frase come quelle di esempio.</p>
        </div>
      )}

      {result && result.status === 'proposed' && (
        <div className="proposal">
          <p className="label">Ecco cosa cambierà:</p>
          <ul>{result.summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
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
