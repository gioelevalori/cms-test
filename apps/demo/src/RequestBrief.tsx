import { useState, type FormEvent } from 'react';

const PHONE = (import.meta.env.VITE_CONTACT_WHATSAPP ?? '').replace(/\D/g, '');
const EMAIL = (import.meta.env.VITE_CONTACT_EMAIL ?? '').trim();

/** Prepara un riepilogo; nessun dato viene inviato dal modulo. */
export function RequestBrief() {
  const [business, setBusiness] = useState('');
  const [sector, setSector] = useState('');
  const [needs, setNeeds] = useState('');
  const [draft, setDraft] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  function resetDraft() { setDraft(''); setCopyStatus(''); }
  function prepare(event: FormEvent) {
    event.preventDefault();
    setCopyStatus('');
    setDraft([
      'Ciao! Ho provato la demo di cms-test e vorrei capire come usarlo per la mia attività.',
      `Attività: ${business.trim()}`,
      `Settore: ${sector}`,
      `Vorrei aggiornare: ${needs.trim() || 'orari, prezzi e novità del sito'}.`,
    ].join('\n'));
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopyStatus('Riepilogo copiato. Puoi incollarlo in una chat o in una email.');
    } catch {
      setCopyStatus('Copia automatica non disponibile. Puoi selezionare e copiare il testo qui sotto.');
    }
  }

  const destination = PHONE
    ? `https://wa.me/${PHONE}?text=${encodeURIComponent(draft)}`
    : EMAIL ? `mailto:${encodeURIComponent(EMAIL)}?subject=${encodeURIComponent(`Informazioni cms-test — ${business.trim()}`)}&body=${encodeURIComponent(draft)}` : null;

  return (
    <section className="request-section" id="richiesta" aria-labelledby="request-title">
      <div className="request-intro">
        <h2 id="request-title">Come lo useresti nella tua attività?</h2>
        <p>Prepara un breve riepilogo da condividere per parlare del tuo sito. Bastano il nome e il settore.</p>
        <p className="request-note">Il modulo non invia né salva i dati. Scegli tu se copiare il testo{PHONE || EMAIL ? ' o inviarlo con il tuo account' : ' e condividerlo'}.</p>
      </div>
      <form className="request-form" onSubmit={prepare}>
        <div className="request-fields">
          <label htmlFor="request-business">Nome dell'attività
            <input id="request-business" name="business" autoComplete="organization" required pattern={'.*\\S.*'} title="Scrivi il nome dell’attività." maxLength={120} value={business}
              onChange={(e) => { setBusiness(e.target.value); resetDraft(); }} placeholder="Es. Il tuo salone" />
          </label>
          <label htmlFor="request-sector">Settore
            <select id="request-sector" name="sector" required value={sector} onChange={(e) => { setSector(e.target.value); resetDraft(); }}>
              <option value="" disabled>Scegli il settore</option>
              {['Ristorante o bar', 'Parrucchiere o centro estetico', 'Negozio o artigiano', 'Studio professionale', 'Palestra o centro sportivo', 'Freelance o agenzia web', 'Altro'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <label htmlFor="request-needs">Cosa vuoi aggiornare più spesso? <span>(facoltativo)</span>
          <textarea id="request-needs" name="needs" rows={3} maxLength={1000} value={needs}
            onChange={(e) => { setNeeds(e.target.value); resetDraft(); }} placeholder="Es. Gli orari durante i festivi e i prezzi dei servizi" />
        </label>
        <button className="request-primary" type="submit">Prepara il riepilogo</button>
        {draft && (
          <div className="request-result">
            <label htmlFor="request-draft">Il tuo riepilogo, pronto da condividere</label>
            <textarea id="request-draft" rows={6} readOnly value={draft} />
            <div className="request-actions">
              <button className="request-secondary" type="button" onClick={copy}>Copia il riepilogo</button>
              {destination && <a className="request-primary" href={destination} {...(PHONE ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{PHONE ? 'Apri WhatsApp' : 'Apri la tua email'}</a>}
            </div>
          </div>
        )}
        <p className="request-feedback" role="status">{copyStatus || (draft ? 'Riepilogo pronto. Nessun dato è stato inviato.' : '')}</p>
      </form>
    </section>
  );
}
