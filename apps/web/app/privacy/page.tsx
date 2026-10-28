export const metadata = { title: 'Informativa sulla privacy – cms-test' };

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem', lineHeight: 1.6 }}>
      <h1>Informativa sulla privacy</h1>
      <p>Ultimo aggiornamento: 28 ottobre 2026.</p>
      <p>
        cms-test è un progetto sperimentale che permette ai titolari di un&apos;attività di aggiornare il
        proprio sito (orari, menu, notizie, contatti) anche tramite messaggi WhatsApp.
      </p>
      <h2>Dati trattati</h2>
      <ul>
        <li>Email e password (cifrata) degli utenti registrati.</li>
        <li>Numero WhatsApp collegato volontariamente dall&apos;utente.</li>
        <li>Testo dei messaggi inviati al servizio, usato solo per proporre e applicare le modifiche richieste.</li>
        <li>I dati pubblici dell&apos;attività mostrati sul sito.</li>
      </ul>
      <h2>Finalità</h2>
      <p>
        I dati servono esclusivamente a far funzionare il servizio. Non vengono venduti né usati per
        pubblicità. I messaggi WhatsApp sono gestiti tramite la WhatsApp Business Platform di Meta.
      </p>
      <h2>Conservazione e cancellazione</h2>
      <p>
        L&apos;utente può scollegare il proprio numero in qualsiasi momento dal pannello e chiedere la
        cancellazione dei propri dati contattando il titolare.
      </p>
      <h2>Contatti</h2>
      <p>Titolare del trattamento: Gioele Valori.</p>
    </main>
  );
}
