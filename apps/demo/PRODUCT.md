# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Titolari di piccole attività (pizzerie, bar, ristoranti, negozi) che provano la demo per capire se il prodotto fa per loro. Spesso arrivano da telefono, hanno poco tempo e non sono tecnici: devono capire cosa fa in pochi secondi e provarlo senza registrarsi.

## Product Purpose

Un CMS "senza pagine né pannello": il titolare scrive cosa cambia come parlerebbe a un collaboratore ("Sabato chiudiamo alle 15", "La carbonara è finita"), vede l'anteprima, conferma, e sito e dati per Google (schema.org) si aggiornano. La demo deve far vivere questo giro completo: messaggio → anteprima della modifica → conferma → sito aggiornato, con possibilità di annullare.

Successo della demo: il titolare prova almeno un messaggio, vede il sito cambiare e capisce che potrebbe farlo da WhatsApp.

## Positioning

Il centro sono i dati dell'attività (orari, menu, notizie, contatti), non le pagine. Non c'è un pannello da imparare: si aggiorna scrivendo, anche da WhatsApp, con conferma esplicita prima di ogni modifica e annullamento sempre possibile.

## Operating Context

- Canale principale nel prodotto completo: WhatsApp (anteprima con pulsanti Conferma / Annulla; si può rispondere "sì"/"no", "annulla", "aiuto"). Nella demo WhatsApp è simulato.
- Canale secondario: chat nell'admin web.
- La demo è statica (GitHub Pages): interprete, anteprima e dati girano nel browser, salvati in localStorage. Nessuna API, nessun account.

## Capabilities and Constraints

- Interprete a regole in italiano (`interpretMessage` di `@cms/shared`); frasi non capite vanno segnalate con gentilezza e suggerimenti.
- Tipi di modifica: orari settimanali, chiusure/orari speciali e ferie, prezzi e disponibilità del menu, nuove voci, eventi e notizie.
- L'anteprima del sito usa gli stessi blocchi e dati del sito pubblico Next.js (`DEFAULT_LAYOUT`).
- Cronologia con annulla dell'ultima modifica; vista dei dati schema.org.
- Base path di pubblicazione `/cms-test/`.
- Lingua: italiano.

## Brand Commitments

Nessuna. "cms-test" è un nome provvisorio: nessun logo, colore o font vincolante.

## Evidence on Hand

- Attività di esempio: "Pizzeria da Mario", Penne (PE) (`src/sample.ts`) — fittizia.
- Frasi di esempio in `src/App.tsx`.
- Nessuna testimonianza, cliente reale, prezzo del servizio o numero d'uso: non inventarli.

## Product Principles

1. Si capisce provando: la prima azione è scrivere (o toccare) un messaggio, non leggere spiegazioni.
2. Mai modifiche a sorpresa: ogni cambiamento passa da anteprima e conferma, e si può annullare.
3. Parla come il titolare: italiano semplice, niente gergo tecnico.
4. Il risultato si vede: dopo la conferma il cambiamento sul sito è evidente.
5. WhatsApp è il canale naturale del titolare; il browser è il posto dove provarlo.

## Accessibility & Inclusion

Uso frequente da telefono: testo leggibile, aree tocco ampie, contrasto adeguato (WCAG AA).
