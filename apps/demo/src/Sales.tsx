import { SAMPLES } from './sample';
import { RequestBrief } from './RequestBrief';

const EXAMPLES = [
  { title: 'Prezzi e listini', business: 'salone-giulia', index: 0 },
  { title: 'Orari speciali', business: 'pizzeria-mario', index: 0 },
  { title: 'Prodotti esauriti', business: 'ferramenta-rossi', index: 1 },
  { title: 'Ferie e chiusure', business: 'studio-bianchi', index: 0 },
  { title: 'Nuovi servizi', business: 'salone-giulia', index: 2 },
  { title: 'Eventi e novità', business: 'palestra-move', index: 3 },
];

const FAQ = [
  {
    q: 'Devo installare un\'app o imparare un pannello?',
    a: 'No. Scrivi su WhatsApp, che usi già. Il pannello web c\'è, ma serve solo se vuoi vedere la cronologia o cambiare i dati dal computer.',
  },
  {
    q: 'Chi può cambiare il mio sito?',
    a: 'I numeri collegati agli account autorizzati dell’attività. Il collegamento richiede un codice inviato dal telefono. I numeri non collegati non possono modificare i dati.',
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
    q: 'Si aggiorna anche Google Maps?',
    a: 'L’integrazione con la scheda Google Maps non è ancora disponibile. Il sito aggiorna i propri dati strutturati per i motori di ricerca; i tempi di lettura e pubblicazione dipendono da Google.',
  },
  {
    q: 'Ho già un sito: devo rifarlo?',
    a: 'Va verificato come è stato costruito e come collegarlo ai dati dell’attività. La demo mostra il risultato possibile; la compatibilità con il tuo sito richiede una valutazione.',
  },
  {
    q: 'Questa demo invia messaggi WhatsApp veri?',
    a: 'No. La conversazione è simulata nel browser e usa attività inventate. Puoi provare anteprima, conferma e annullamento senza registrarti. Il collegamento al tuo numero fa parte della configurazione del servizio completo.',
  },
  {
    q: 'Posso inviare foto o messaggi vocali?',
    a: 'Per ora gli aggiornamenti supportati sono testuali. Foto, messaggi vocali e promemoria sono possibili sviluppi futuri, senza una data di disponibilità annunciata.',
  },
  {
    q: 'Quanto costa?',
    a: 'Non è ancora pubblicato un listino del servizio. I prezzi che vedi nei cinque siti sono dati inventati delle attività di esempio.',
  },
  {
    q: 'Dove restano le prove che faccio qui?',
    a: 'Le modifiche alle attività di esempio restano nel browser di questo dispositivo. “Ricomincia da capo” ripristina tutti gli esempi. Il modulo per preparare una richiesta non salva né invia dati automaticamente.',
  },
];

/** Le sezioni sotto la demo: come funziona, sicurezza, freelance, domande, contatto. */
export function Sales({ onTryExample }: { onTryExample: (businessId: string, message: string) => void }) {
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
            <p>Dopo la conferma il sito mostra i nuovi dati. Scrivi “annulla” se vuoi ripristinare la modifica precedente.</p>
          </li>
        </ol>
      </section>

      <section className="sales-examples" id="esempi" aria-labelledby="examples-title">
        <div className="examples-intro">
          <h2 id="examples-title">Cosa scriveresti oggi?</h2>
          <p>Tocca un esempio: si apre la chat dell’attività giusta con l’anteprima. Sarai tu a confermare.</p>
        </div>
        <ul className="example-library">
          {EXAMPLES.map((example) => {
            const business = SAMPLES.find((s) => s.id === example.business)!;
            const message = business.examples[example.index];
            return <li key={example.title}>
              <button onClick={() => onTryExample(business.id, message)}>
                <span className="example-title">{example.title}<span className="example-sector">{business.sector}</span></span>
                <span className="example-message">“{message}”</span>
                <span className="example-action">Prova questo messaggio <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              </button>
            </li>;
          })}
        </ul>
      </section>

      <section className="sales-split" id="sicurezza" aria-labelledby="sec-t">
        <div>
          <h2 id="sec-t">Il tuo sito cambia solo con il tuo consenso</h2>
          <p>
            Colleghi il tuo WhatsApp dal pannello: inquadri un codice QR e invii il messaggio già pronto.
            Il numero viene associato al tuo account e all’attività scelta.
          </p>
          <p>Ogni richiesta passa da un’anteprima e dalla conferma. Puoi scollegare il numero dal pannello e consultare la cronologia delle modifiche.</p>
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
            <span className="sec-result">Numero non autorizzato: il sito non cambia</span>
          </li>
        </ul>
      </section>

      <section className="sales-split" id="iniziare" aria-labelledby="start-title">
        <div>
          <h2 id="start-title">Dalla prova al tuo sito</h2>
          <p>La demo ti fa provare il gesto quotidiano. Per usarlo nella tua attività servono i tuoi dati, un sito collegato e la configurazione di WhatsApp.</p>
        </div>
        <ol className="setup-list">
          <li><h3>Raccogliamo i dati</h3><p>Orari, listino o menu, contatti e informazioni da tenere aggiornate.</p></li>
          <li><h3>Prepariamo il sito</h3><p>Contenuti e aspetto adatti all’attività, con gli aggiornamenti collegati ai dati.</p></li>
          <li><h3>Colleghiamo WhatsApp</h3><p>Configurazione del servizio, verifica del numero e prova completa: messaggio, conferma e annullamento.</p></li>
        </ol>
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

      <RequestBrief />
    </>
  );
}
