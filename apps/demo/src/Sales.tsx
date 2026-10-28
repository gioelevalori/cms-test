/** Numero WhatsApp per i contatti commerciali (solo cifre), impostato alla build con VITE_CONTACT_WHATSAPP. */
const CONTACT = (import.meta.env.VITE_CONTACT_WHATSAPP ?? '').replace(/\D/g, '');

/** Link al contatto commerciale; senza numero configurato si torna alla demo. */
export const contactHref = CONTACT
  ? `https://wa.me/${CONTACT}?text=${encodeURIComponent('Ciao! Ho visto la demo di cms-test e vorrei saperne di più.')}`
  : '#demo';
export const hasContact = Boolean(CONTACT);

const FAQ = [
  {
    q: 'Devo installare un\'app o imparare un pannello?',
    a: 'No. Scrivi su WhatsApp, che usi già. Il pannello web c\'è, ma serve solo se vuoi vedere la cronologia o cambiare i dati dal computer.',
  },
  {
    q: 'Chi può cambiare il mio sito?',
    a: 'Solo i numeri che hai collegato tu, inviando il codice dal tuo telefono. Un messaggio da qualsiasi altro numero viene ignorato e non cambia nulla.',
  },
  {
    q: 'E se sbaglio a scrivere?',
    a: 'Prima di cambiare il sito ti mostro sempre l\'anteprima: confermi o annulli. E anche dopo, "annulla" riporta il sito com\'era.',
  },
  {
    q: 'Cosa capisce l\'assistente?',
    a: 'Orari della settimana, chiusure e ferie, orari speciali, prezzi, voci finite o tornate disponibili, nuove voci, eventi e novità. Se un messaggio non è chiaro, te lo dice invece di indovinare.',
  },
  {
    q: 'Google vede le modifiche?',
    a: 'Sì: insieme al sito si aggiornano i dati strutturati (schema.org) che Google usa per orari e listini.',
  },
  {
    q: 'Ho già un sito: devo rifarlo?',
    a: 'Dipende da com\'è fatto. Parliamone: spesso si collegano i dati che cambiano spesso e il resto resta com\'è.',
  },
];

/** Le sezioni sotto la demo: come funziona, sicurezza, freelance, domande, contatto. */
export function Sales() {
  return (
    <>
      <section className="sales-how" id="come-funziona" aria-labelledby="how-t">
        <h2 id="how-t">Come funziona</h2>
        <ol className="steps">
          <li>
            <span className="step-n" aria-hidden="true">1</span>
            <h3>Scrivi cosa cambia</h3>
            <p>Su WhatsApp, come lo diresti a un collaboratore: “Sabato chiudiamo alle 15”, “La carbonara è finita”.</p>
          </li>
          <li>
            <span className="step-n" aria-hidden="true">2</span>
            <h3>Guarda l'anteprima</h3>
            <p>Ricevi in risposta cosa cambierà sul sito, con i pulsanti Conferma e Annulla.</p>
          </li>
          <li>
            <span className="step-n" aria-hidden="true">3</span>
            <h3>Il sito è aggiornato</h3>
            <p>Orari, prezzi e novità cambiano subito, insieme ai dati che legge Google.</p>
          </li>
        </ol>
      </section>

      <section className="sales-split" id="sicurezza" aria-labelledby="sec-t">
        <div>
          <h2 id="sec-t">Solo il tuo numero può cambiare il sito</h2>
          <p>
            Colleghi il tuo WhatsApp in dieci secondi: dal pannello inquadri un codice QR e invii il messaggio già pronto.
            Il numero da cui arriva diventa l'unico che può aggiornare il tuo sito.
          </p>
          <p>Nessun numero da digitare, nessuna configurazione. Se cambi telefono, scolleghi e ricolleghi.</p>
        </div>
        <ul className="sec-demo" aria-label="Esempio: messaggi da due numeri diversi">
          <li className="sec-ok">
            <span className="sec-from">+39 333 ··· 4567 · il tuo numero</span>
            <span className="sec-msg">La margherita costa 7 euro</span>
            <span className="sec-result">Anteprima inviata, sito aggiornato alla conferma</span>
          </li>
          <li className="sec-no">
            <span className="sec-from">+39 347 ··· 1122 · un altro numero</span>
            <span className="sec-msg">La margherita costa 1 euro</span>
            <span className="sec-result">Ignorato: il sito non cambia</span>
          </li>
        </ul>
      </section>

      <section className="sales-split sales-freelance" id="freelance" aria-labelledby="fl-t">
        <div>
          <h2 id="fl-t">Per chi fa siti ai clienti</h2>
          <p>Costruisci il sito una volta, con il tuo stile. Poi il cliente lo tiene aggiornato da solo, scrivendo: niente più mail con “mi cambi l'orario di sabato?”.</p>
        </div>
        <ul className="checks">
          <li>Ogni cliente è una chat, tutti nello stesso posto.</li>
          <li>Il cliente cambia i dati; la struttura delle pagine resta tua.</li>
          <li>Cronologia di ogni modifica, con chi l'ha fatta e il pulsante annulla.</li>
          <li>Ogni sito con il suo aspetto: i dati sono gli stessi, la veste la decidi tu.</li>
        </ul>
      </section>

      <section className="sales-faq" id="domande" aria-labelledby="faq-t">
        <h2 id="faq-t">Domande</h2>
        <div className="faq">
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="sales-cta" aria-labelledby="cta-t">
        <h2 id="cta-t">Vuoi provarlo sulla tua attività?</h2>
        <p>Raccontaci che attività hai: ti mostriamo come sarebbe il tuo sito. Prezzi su richiesta.</p>
        <a className="cta-big" href={contactHref} {...(hasContact ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {hasContact ? 'Parliamone su WhatsApp' : 'Prova la demo'}
        </a>
      </section>
    </>
  );
}
