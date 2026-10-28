import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { api, type WhatsAppLink } from '../api/client';

const formatNumber = (digits: string) => `+${digits}`;
/** In locale l'API non riceve i messaggi WhatsApp: Meta li manda solo al server online. */
const LOCAL_API = /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(import.meta.env.VITE_API_URL ?? 'http://localhost:3000');

/**
 * Collega il numero da cui il titolare aggiornerà il sito scrivendo su WhatsApp.
 * Niente numero da digitare: il titolare invia un codice dal suo telefono e il numero
 * da cui arriva viene collegato. Solo quel numero può poi cambiare il sito.
 */
export function WhatsAppCard({ businessId, businessName }: { businessId: string; businessName: string }) {
  const qc = useQueryClient();
  const [link, setLink] = useState<WhatsAppLink | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Mentre il codice è in attesa, controllo ogni 3 secondi se il numero è arrivato.
  const me = useQuery({ queryKey: ['me'], queryFn: api.me, refetchInterval: link ? 3000 : false });
  const linkedHere = Boolean(me.data?.whatsapp && me.data.whatsappBusinessId === businessId);
  const linkedElsewhere = Boolean(me.data?.whatsapp && !linkedHere);

  useEffect(() => {
    if (linkedHere) setLink(null);
  }, [linkedHere]);

  useEffect(() => {
    if (!link) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [link]);

  useEffect(() => {
    if (!link?.link) return setQr(null);
    QRCode.toDataURL(link.link, { margin: 1, width: 360, color: { dark: '#12161b', light: '#ffffff' } }).then(setQr, () => setQr(null));
  }, [link]);

  async function start() {
    setError(null);
    setBusy(true);
    try {
      setLink(await api.whatsAppLink(businessId));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function unlink() {
    setError(null);
    setBusy(true);
    try {
      await api.unlinkWhatsApp();
      qc.invalidateQueries({ queryKey: ['me'] });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const secondsLeft = link ? Math.max(0, Math.round((new Date(link.expiresAt).getTime() - now) / 1000)) : 0;
  const expired = Boolean(link) && secondsLeft === 0;

  return (
    <section className="card wa-card">
      <h2>Aggiorna da WhatsApp</h2>
      {LOCAL_API && (
        <p className="error">
          Stai usando il pannello locale. I messaggi WhatsApp arrivano al server online, quindi i codici generati qui non funzionano:
          collega il numero dal pannello online.
        </p>
      )}

      {linkedHere && !link && (
        <div className="wa-linked">
          <p className="wa-status"><span className="wa-dot" aria-hidden="true" />Collegato: <strong>{formatNumber(me.data!.whatsapp!)}</strong></p>
          <p>
            Da questo numero aggiorni il sito di {businessName} scrivendo all'assistente, ad esempio “Sabato chiudiamo alle 15”.
            Ricevi l'anteprima e confermi con un tocco. Messaggi da altri numeri vengono ignorati.
          </p>
          <button className="ghost small" onClick={unlink} disabled={busy}>Scollega</button>
        </div>
      )}

      {!linkedHere && !link && (
        <div>
          {linkedElsewhere ? (
            <p>Il tuo numero {formatNumber(me.data!.whatsapp!)} aggiorna un'altra attività. Collegalo a {businessName} per aggiornare questo sito.</p>
          ) : (
            <p>Collega il tuo WhatsApp: poi aggiorni orari, prezzi e novità scrivendo un messaggio. Non serve digitare il numero.</p>
          )}
          <button onClick={start} disabled={busy}>{busy ? 'Un attimo…' : 'Collega WhatsApp'}</button>
        </div>
      )}

      {link && !expired && (
        <div className="wa-steps">
          {qr && <img className="wa-qr" src={qr} alt={`Codice QR che apre WhatsApp con il messaggio ${link.message}`} />}
          <ol>
            <li>
              {link.link ? (
                <>Inquadra il codice con il telefono, oppure <a className="button" href={link.link} target="_blank" rel="noreferrer">Apri WhatsApp</a></>
              ) : (
                <>Apri WhatsApp sul tuo telefono e scrivi all'assistente</>
              )}
            </li>
            <li>Invia il messaggio già pronto: <code className="wa-code">{link.message}</code></li>
            <li>Fatto: questa pagina si aggiorna da sola quando il numero è collegato.</li>
          </ol>
          <p className="hint">
            {link.number ? `Numero dell'assistente: ${formatNumber(link.number)}. ` : ''}
            Il codice vale ancora {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')} e si usa una volta sola.
          </p>
          <button className="ghost small" onClick={() => setLink(null)}>Annulla</button>
        </div>
      )}

      {expired && (
        <div>
          <p>Il codice è scaduto.</p>
          <button onClick={start} disabled={busy}>Genera un nuovo codice</button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </section>
  );
}
