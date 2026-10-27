# cms-test

> Nome provvisorio del progetto.

Un CMS **senza pagine e senza pannello** per piccole attività. Il titolare scrive cosa cambia
("Sabato chiudiamo alle 15", "La carbonara è finita"), vede l'anteprima, conferma, e il sito si aggiorna.
Il centro del modello sono i **dati dell'attività** (orari, menu, notizie, contatti): il sito è solo uno dei modi di mostrarli.

## Come funziona

```
"Sabato chiudiamo alle 15"
        │  interprete (regole in italiano, opzionalmente Claude)
        ▼
ChangeOp[]  ──►  anteprima "31 ottobre 2026: 12:00–15:00"  ──►  conferma
        │                                                        │
        ▼                                                        ▼
  Change (proposta)                          dati attività aggiornati → sito, schema.org
```

- Ogni modifica è un `Change` con i dati **prima** e **dopo**: si può annullare.
- Se i dati cambiano tra proposta e conferma, la conferma viene rifiutata (409) invece di sovrascrivere.
- L'AI può solo **proporre** operazioni, che vengono sempre validate (`isValidOp`).
- Il cliente modifica i dati; solo il costruttore modifica la struttura delle pagine.

## Struttura

```
packages/shared   Tipi, operazioni pure (applyOps), interprete italiano, schema.org — con test
apps/api          NestJS + Prisma + PostgreSQL              → http://localhost:3000
apps/admin        React + Vite: chat, dati, cronologia      → http://localhost:5173
apps/web          Next.js: sito pubblico generato dai dati  → http://localhost:3001
```

## Avvio in locale

Requisiti: Node.js 20+, Docker.

```bash
npm install
npm run build:shared

cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env
cp apps/web/.env.example apps/web/.env.local

npm run db:up        # PostgreSQL
npm run db:push      # crea le tabelle
npm run db:seed      # "Pizzeria da Mario" di esempio

npm run dev:api      # tre terminali separati
npm run dev:admin
npm run dev:web
```

Utenti di prova (password `password123`):

| Email | Ruolo |
| --- | --- |
| cliente@example.com | Cliente: chat e dati |
| freelance@example.com | Costruttore: anche la struttura delle pagine |

Sito pubblico: http://localhost:3001/pizzeria-da-mario

### Interpretazione con Claude (facoltativa)

Senza configurazione funziona l'interprete a regole. Con `ANTHROPIC_API_KEY` in `apps/api/.env`, le frasi che le regole
non capiscono vengono passate a Claude; le operazioni restituite sono validate prima di essere proposte.

## Frasi capite dall'interprete a regole

| Esempio | Effetto |
| --- | --- |
| Sabato chiudiamo alle 15 | Orario speciale per il prossimo sabato |
| Domani siamo chiusi per inventario | Chiusura con nota |
| Dal 10 al 20 agosto chiusi per ferie | Chiusura per ogni giorno dell'intervallo |
| Il lunedì siamo chiusi / Ogni domenica dalle 12 alle 15 | Orario settimanale |
| Sabato orario normale | Rimuove l'eccezione |
| La margherita costa 7 euro | Prezzo |
| La carbonara è finita / è di nuovo disponibile | Disponibilità |
| Aggiungi la diavola a 8 euro nella sezione pizze / Togli la diavola | Menu |
| Il nuovo numero è 333 1234567 / nuova email: … | Contatti |
| Evento il 12 dicembre: serata jazz | Notizie, eventi, offerte |

## Test

```bash
npm test             # test unitari del pacchetto condiviso
npm run e2e          # test end-to-end (API avviata + seed)
```

La CI su GitHub Actions esegue build, test unitari, test end-to-end con PostgreSQL e un controllo del sito pubblico.

## API

| Metodo | Percorso | Note |
| --- | --- | --- |
| POST | /auth/login | JWT |
| GET | /businesses, /businesses/:id | Attività dell'utente, dati completi |
| POST | /businesses/:id/chat | Messaggio → modifica proposta con anteprima |
| POST | /businesses/:id/changes | Operazioni strutturate (pulsanti dell'admin) |
| GET | /businesses/:id/changes | Cronologia |
| POST | /changes/:id/confirm, /reject, /undo | Conferma, scarta, annulla |
| GET, PUT | /businesses/:id/pages/:slug | Struttura delle pagine (PUT solo costruttore) |
| GET | /public/businesses/:slug | Dati pubblici + schema.org |
