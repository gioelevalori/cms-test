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
- `packages/shared` contiene anche: `categories.ts` (tipi di attività: esempi, nomi sezioni, schema.org), `site.ts` + `interpret-site.ts` (aspetto del sito: 5 stili, colore, testi, sezioni, social; salvato in `Business.theme`), foto (`setCover`/`addPhoto`/`setItemImage`, solo URL Cloudinary, `interpretPhoto` per le didascalie). Stile/colore/sezioni (`STRUCTURE_OPS`) solo per owner/builder.
- Logo: op `setLogo` (`Business.logoUrl`), da pannello (scheda "Logo e foto") o WhatsApp con "logo" nella didascalia; sul sito in testata, piè di pagina, favicon e schema.org `logo`.
- Anteprima: `GET /public/businesses/:slug/preview/:changeId` (dati `after` della proposta) → sito `/<slug>/anteprima/<id>` con barra in cima, noindex. Nel pannello la scheda "Il tuo sito" (iframe telefono/computer) passa all'anteprima finché c'è una proposta; su WhatsApp il link arriva se `PUBLIC_SITE_URL` è impostato.
- Editor a tutto schermo (stile Personalizza di WordPress): pannello `/#/b/:id/modifica` (`EditorPage.tsx`) + pagina `/<slug>/modifica` sul sito (`EditorCanvas.tsx`, noindex, `frame-ancestors` solo pannello; origini in `apps/web/lib/admin-origins.mjs`, `ADMIN_ORIGIN` le sostituisce). La bozza (operazioni, in localStorage) si applica nel pannello con `applyOps` e arriva all'iframe via postMessage (`packages/shared/src/editor.ts`); sezioni trascinabili sulla pagina e nella barra laterale, foto della galleria trascinabili. "Pubblica" = una proposta con `compactOps` + conferma. Nuove op: `setSectionOrder` (struttura), `setPhotoOrder`.
- Stato "Aperto ora / chiude alle…" calcolato da `openStatus` (shared/opening.ts) all'ora della richiesta; lo usano il sito e `GET /businesses` (pagina "Le tue attività").
- Movimento: sito con entrate allo scorrimento (`components/Reveal.tsx`, IntersectionObserver) e animazioni legate allo scroll solo per testata e copertina; tutto con `prefers-reduced-motion`.
- Password dimenticata: `POST /auth/forgot-password` (risposta sempre uguale, max 3/ora, link 30 min, salvata solo l'impronta sha256 in `PasswordReset`) → email con Resend (`RESEND_API_KEY`, `MAIL_FROM`; senza chiave il link va nei log) → pannello `/#/reimposta?codice=…` → `POST /auth/reset-password` (una volta sola, poi entra). Link costruito dalla prima voce di `ADMIN_ORIGIN`.
- CI: il test di affidabilità WhatsApp gira prima di avviare l'API (con l'API accesa la sua coda consuma gli stessi messaggi).
- Foto: `POST /businesses/:id/photos` → Cloudinary con `CLOUDINARY_URL` (da impostare su Render; senza, le foto rispondono "non ancora attive"). Da WhatsApp: foto con didascalia.
- `apps/admin` — React 19 + Vite 6 + TanStack Query, HashRouter. Registrazione dal login, "Nuova attività" con tipo. Pagina attività = lavoro quotidiano (chat, Oggi, WhatsApp, cronologia, Completa il sito, Il tuo sito con QR via `qrcode`, Come ti vede Google, dati); aspetto, foto e anteprima solo nell'editor (`?pannello=photos|texts|social|look|sections` lo apre su un pannello). Dev: `npm run dev -w @cms/admin -- --force` se Vite serve una @cms/shared vecchia.
- `apps/web` — Next.js 15 app router, sito pubblico `/[site]` (componente `Site.tsx`, stili in `globals.css` portati dalla demo), `/privacy`.
- `apps/demo` — demo statica per GitHub Pages (localStorage).
- `scripts/e2e.mjs` — e2e API + WhatsApp con Graph mock. CI: `.github/workflows/ci.yml`; Pages: `pages.yml`; Render: `render.yaml`.

## Deploy (Render, workspace "cms-test")
- API: https://cms-test-api-svb9.onrender.com (`/health`)
- Sito: https://cms-test-web.onrender.com/pizzeria-da-mario
- Admin: https://cms-test-admin.onrender.com
- Demo: https://gioelevalori.github.io/cms-test/
- DB Render free: scade il 2026-11-26.

## WhatsApp — stato al 2026-10-28 (funziona con il numero di test)
- Env su Render API: WHATSAPP_PHONE_NUMBER_ID (1432024326656829, numero di test +1 555 181 5223), WHATSAPP_TOKEN (temporaneo 24h → sostituire con token permanente/utente di sistema), WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN, WHATSAPP_API_VERSION=v26.0.
- App Meta giusta: "Messaggi" ID 1570687451411867 (webhook verso l'API Render, campo `messages` iscritto). Esiste una seconda app omonima (1095259659924870) senza webhook: era l'unica iscritta alla WABA ed era il motivo per cui i messaggi reali non arrivavano.
- Risolto il 28/10: `POST 1593822615767138/subscribed_apps` dal Graph Explorer dell'app 1570687451411867. Messaggio reale ricevuto e risposta inviata.
- Da fare: token permanente (utente di sistema, permessi whatsapp_business_messaging + whatsapp_business_management) in WHATSAPP_TOKEN su Render; numero vero al posto di quello di test; eliminare o rinominare l'app doppione. Diagnosi via log app su Render ("Webhook ricevuto", "Messaggio da", "Invio WhatsApp fallito").
