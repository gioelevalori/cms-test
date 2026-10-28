# cms-test — contesto per Claude Code

CMS "senza pagine né pannello": i dati dell'attività (orari, menu/catalogo, post, contatti) sono il cuore.
Il titolare scrive cosa cambia (chat in admin o WhatsApp) → anteprima → conferma → sito + schema.org aggiornati.
Lingua dell'utente e dell'interfaccia: italiano.

## Regole di lavoro
- Per tutta la parte grafica (admin, sito pubblico, demo) usare la skill **Impeccable** (`npx skills add pbakaus/impeccable`, comandi /impeccable, /audit, /polish, /typeset…).
- Non scrivere segreti (token, app secret, DATABASE_URL) nel repo o in chat: vanno solo nelle env di Render / `.env` locale.

## Struttura (npm workspaces)
- `packages/shared` — tipi, ChangeOp (`applyOps`, `describeOp`, `isValidOp`), `interpretMessage` (regole in italiano), `toSchemaOrg`, layout. Test: `npm test -w packages/shared`.
- `apps/api` — NestJS 11 + Prisma 6 + PostgreSQL. Moduli: business, changes (propose/confirm/reject/undo con snapshot before/after, 409 se i dati sono cambiati), interpreter (fallback Claude opzionale con `ANTHROPIC_API_KEY`), pages, public, auth, whatsapp (webhook Cloud API con firma HMAC su rawBody, dedupe `InboundMessage`, pulsanti `confirm:<id>`/`reject:<id>`). Seed: `cliente@example.com`, `freelance@example.com` (password da `SEED_PASSWORD`), attività `pizzeria-da-mario`.
- `apps/admin` — React 19 + Vite 6 + TanStack Query, HashRouter.
- `apps/web` — Next.js 15 app router, sito pubblico `/[site]/[[...slug]]`, `/privacy`.
- `apps/demo` — demo statica per GitHub Pages (localStorage).
- `scripts/e2e.mjs` — e2e API + WhatsApp con Graph mock. CI: `.github/workflows/ci.yml`; Pages: `pages.yml`; Render: `render.yaml`.

## Deploy (Render, workspace "cms-test")
- API: https://cms-test-api-svb9.onrender.com (`/health`)
- Sito: https://cms-test-web.onrender.com/pizzeria-da-mario
- Admin: https://cms-test-admin.onrender.com
- Demo: https://gioelevalori.github.io/cms-test/
- DB Render free: scade il 2026-11-26.

## WhatsApp — stato al 2026-10-28 (da completare)
- Env su Render API: WHATSAPP_PHONE_NUMBER_ID (numero di test +1 555 181 5223), WHATSAPP_TOKEN (temporaneo 24h → sostituire con token permanente/utente di sistema), WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN (cambiato il 28/10), WHATSAPP_API_VERSION=v26.0.
- Funziona: webhook "Test" dalla dashboard Meta arriva e la firma è valida. App Meta "Messaggi" pubblicata. WABA 1593822615767138 iscritta all'app (subscribed_apps).
- Non funziona ancora: i messaggi reali non arrivano. `GET {phone_number_id}?fields=webhook_configuration` non restituisce URL; `override_callback_uri` fallisce con "(#100) Before override the current callback uri, your app must be subscribed…".
- Prossimo passo: su Meta → WhatsApp → Configurazione, rifare "Verifica e salva" del webhook con il nuovo WHATSAPP_VERIFY_TOKEN (valore nelle env di Render), certificato client OFF, campo `messages` iscritto (off/on); poi ricontrollare `webhook_configuration` e rimandare "Sabato chiudiamo alle 15". Diagnosi via log app su Render (messaggi "Webhook ricevuto", "Verifica webhook…", "Invio WhatsApp fallito").
