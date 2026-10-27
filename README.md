# CMS (nome da decidere)

Un CMS alternativo a WordPress in React e Node.js, pensato per due utenti:
il **freelance** che costruisce il sito e il **cliente** che lo aggiorna cliccando direttamente sulla pagina,
senza poter rompere il design.

## Struttura

```
packages/shared   Tipi dei blocchi e regole dei permessi (usati da tutte le app)
apps/api          NestJS + Prisma + PostgreSQL     → http://localhost:3000
apps/admin        React + Vite (editor)            → http://localhost:5173
apps/web          Next.js (sito pubblico, SEO)     → http://localhost:3001
```

## Avvio

Requisiti: Node.js 20+, Docker (per PostgreSQL).

```bash
npm install
npm run build:shared              # compila il pacchetto condiviso

cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env
cp apps/web/.env.example apps/web/.env.local

npm run db:up                     # avvia PostgreSQL
npm run db:migrate                # crea le tabelle (chiede un nome: "init")
npm run db:seed                   # sito di esempio "Pizzeria da Mario"

npm run dev:api                   # in tre terminali separati
npm run dev:admin
npm run dev:web
```

Utenti di prova (password `password123`):

| Email | Ruolo | Cosa vede |
| --- | --- | --- |
| freelance@example.com | builder | Modalità Costruttore: aggiunge, sposta, blocca i blocchi |
| cliente@example.com | client | Modalità Cliente: modifica solo i campi lasciati aperti |

Sito pubblico: http://localhost:3001/pizzeria-da-mario

## Come funziona il blocco del design

Ogni blocco ha `locked` ed `editableFields`. Quando un utente `client` salva, l'API confronta
la nuova bozza con quella salvata usando `findClientViolations` (in `packages/shared/src/permissions.ts`)
e risponde 403 se trova modifiche non permesse. L'admin usa la stessa funzione per avvisare prima del salvataggio.

```bash
npm test                          # test delle regole dei permessi
```

## API principali

| Metodo | Percorso | Note |
| --- | --- | --- |
| POST | /auth/register, /auth/login | Restituiscono un JWT |
| GET | /sites | Siti dell'utente con il suo ruolo |
| GET, POST | /sites/:siteId/pages | Creare pagine: solo owner/builder |
| PUT | /sites/:siteId/pages/:pageId/draft | Salva la bozza (controllo permessi) |
| POST | /sites/:siteId/pages/:pageId/publish | Copia la bozza nella versione pubblica |
| GET | /public/sites/:siteSlug/pages/:pageSlug | Lettura pubblica, nessuna autenticazione |

## Prossimi passi (fase 2)

- Upload media (`Media` è già nello schema)
- Editor per gallerie e immagini
- "Annulla" tramite `PageRevision`
- Impostazioni del tema dall'admin
