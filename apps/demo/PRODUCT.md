# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Titolari di piccole attività di qualsiasi settore** (ristorazione, parrucchieri ed estetica, negozi, studi professionali, artigiani, palestre…) che provano la demo per capire se il prodotto fa per loro. Spesso arrivano da telefono, hanno poco tempo e non sono tecnici: devono capire cosa fa in pochi secondi e provarlo senza registrarsi, con un esempio vicino al loro mestiere.
- **Freelance e piccole agenzie** che costruiscono siti per i clienti e vogliono lasciare a loro gli aggiornamenti quotidiani senza insegnargli un pannello. Valutano se il prodotto regge per clienti di settori diversi.

Il prodotto non è legato alla ristorazione: nessun settore deve sembrare quello "vero".

## Product Purpose

Un CMS "senza pagine né pannello": il titolare scrive cosa cambia come parlerebbe a un collaboratore ("Sabato chiudiamo alle 15", "La carbonara è finita"), vede l'anteprima, conferma, e sito e dati per Google (schema.org) si aggiornano. La demo deve far vivere questo giro completo: messaggio → anteprima della modifica → conferma → sito aggiornato, con possibilità di annullare.

Successo della demo: il visitatore sceglie un'attività simile alla sua (o a quella di un suo cliente), prova almeno un messaggio, vede il sito cambiare e capisce che si fa da WhatsApp.

## Positioning

Il centro sono i dati dell'attività (orari, catalogo di prodotti o servizi con prezzi, notizie ed eventi, contatti), non le pagine; valgono uguali per un ristorante, un parrucchiere o uno studio. Il freelance costruisce la struttura una volta, il cliente la tiene aggiornata scrivendo. Non c'è un pannello da imparare: si aggiorna scrivendo, anche da WhatsApp, con conferma esplicita prima di ogni modifica e annullamento sempre possibile.

## Operating Context

- Canale principale nel prodotto completo: WhatsApp (anteprima con pulsanti Conferma / Annulla; si può rispondere "sì"/"no", "annulla", "aiuto"). Nella demo WhatsApp è simulato.
- Canale secondario: chat nell'admin web.
- La demo è statica (GitHub Pages): interprete, anteprima e dati girano nel browser, salvati in localStorage. Nessuna API, nessun account.

## Capabilities and Constraints

- Interprete a regole in italiano (`interpretMessage` di `@cms/shared`); frasi non capite vanno segnalate con gentilezza e suggerimenti.
- Tipi di modifica: orari settimanali, chiusure/orari speciali e ferie, prezzi e disponibilità di prodotti o servizi, nuove voci, eventi e notizie.
- La demo offre più attività d'esempio a scelta, di settori diversi, ognuna con i suoi dati e le sue frasi d'esempio.
- Ruoli: il cliente cambia i dati; il freelance (owner/builder) cambia anche la struttura delle pagine.
- L'anteprima del sito usa gli stessi blocchi e dati del sito pubblico Next.js (`DEFAULT_LAYOUT`).
- Cronologia con annulla dell'ultima modifica; vista dei dati schema.org.
- Base path di pubblicazione `/cms-test/`.
- Lingua: italiano.

## Brand Commitments

Nessuna. "cms-test" è un nome provvisorio: nessun logo, colore o font vincolante.

## Evidence on Hand

- Attività di esempio fittizie, da dichiarare come tali: oggi solo "Pizzeria da Mario", Penne (PE) (`src/sample.ts`); le altre vanno create.
- Frasi di esempio in `src/App.tsx`.
- Nessuna testimonianza, cliente reale, prezzo del servizio o numero d'uso: non inventarli.

## Product Principles

1. Si capisce provando: la prima azione è scrivere (o toccare) un messaggio, non leggere spiegazioni.
2. Mai modifiche a sorpresa: ogni cambiamento passa da anteprima e conferma, e si può annullare.
3. Parla come il titolare: italiano semplice, niente gergo tecnico.
4. Nessun settore è il protagonista: l'identità del prodotto non prende in prestito il mondo di un mestiere.
5. Il risultato si vede: dopo la conferma il cambiamento sul sito è evidente.
6. WhatsApp è il canale naturale del titolare; il browser è il posto dove provarlo.

## Accessibility & Inclusion

Uso frequente da telefono: testo leggibile, aree tocco ampie, contrasto adeguato (WCAG AA).
