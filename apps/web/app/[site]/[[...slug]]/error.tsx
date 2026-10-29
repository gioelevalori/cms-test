'use client';

import { startTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const RETRY_MS = 6000;
const MAX_AUTO = 5;

/**
 * Se i dati non arrivano (di solito l'API che si sta ancora svegliando), il visitatore non vede un errore:
 * vede che il sito sta arrivando, e la pagina riprova da sola. Dopo qualche tentativo resta il pulsante.
 */
export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const [tries, setTries] = useState(0);

  const retry = () => startTransition(() => {
    router.refresh();
    reset();
  });

  useEffect(() => {
    if (tries >= MAX_AUTO) return;
    const t = setTimeout(() => {
      setTries((n) => n + 1);
      retry();
    }, RETRY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tries]);

  const waiting = tries < MAX_AUTO;
  return (
    <main className="waking" aria-live="polite">
      <div className="waking-card">
        {waiting && <span className="waking-bar" aria-hidden="true"><span /></span>}
        <h1>{waiting ? 'Il sito si sta caricando…' : 'Il sito non risponde'}</h1>
        <p>{waiting ? 'Ci vuole qualche secondo: la pagina si aggiorna da sola.' : 'Riprova tra poco: di solito basta un minuto.'}</p>
        {!waiting && <button type="button" onClick={() => { setTries(0); retry(); }}>Riprova</button>}
      </div>
    </main>
  );
}
