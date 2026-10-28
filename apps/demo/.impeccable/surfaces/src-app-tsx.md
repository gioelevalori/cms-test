---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/SitePreview.tsx","src/styles.css"]
---

# Demo pubblica (GitHub Pages)

Scope: `apps/demo`, intera pagina. Mode: Persuade.
Audience: titolari di piccole attività, spesso da telefono. Job: provare a cambiare il sito scrivendo un messaggio, vederlo cambiare, capire che si fa da WhatsApp.
Action: scrivere (o toccare) un messaggio nella chat WhatsApp simulata, poi Conferma.
Proof: il giro completo dal vivo, con dati di esempio dichiarati come esempio. Nessuna testimonianza o numero inventato.
Constraints: stessa logica (`interpretMessage`, `applyOps`, `toSchemaOrg`, storage locale, annulla), base `/cms-test/`, italiano.
Unresolved: il sito pubblico reale (`apps/web`) non ha ancora l'aspetto della lavagna; decidere se portarlo nello stesso mondo.

## Direction contract

THESIS: Il sito è la lavagna che il titolare riscrive ogni giorno: un messaggio su WhatsApp, e il gesso si cancella e si riscrive. Rifiuta la demo SaaS a due card bianche (chat a sinistra, sito a destra).

OWN-WORLD: Ardesia scura con aloni di gesso, cornice di legno su parete scura di legno; scrittura a gesso bianca, gialla per titoli e prezzi, rosa per lo stato di oggi; titolo in gesso a doppio tratto (Cabin Sketch), testo a mano leggibile (Patrick Hand). L'unico oggetto non di gesso è il telefono, appoggiato contro la lavagna dal suo bordo alto, con l'interfaccia WhatsApp scura; la mensola in basso tiene i gessetti (adattamento: un telefono poggiato sulla mensola porterebbe il campo messaggio sotto la piega a 1440×900).

STORY: Capisce in una riga cosa fa il prodotto, tocca una frase d'esempio, vede l'anteprima in chat, conferma, guarda la lavagna riscriversi, e sa che può farlo dal suo WhatsApp.

FIRST VIEWPORT: Desktop: sulla parete, sopra la lavagna, la frase-gancio in gesso e la riga su cosa fa la demo con Ricomincia (adattamento: sulla cornice non c'era spazio leggibile). La lavagna dentro la cornice: nome in gesso grande e stato di oggi in rosa; sotto, Menu a sinistra, Avvisi e Orari a destra. Orari come elenco verticale dei 7 giorni, con oggi cerchiato a gesso (adattamento: la riga di 7 colonne era illeggibile a 390px). La cornice finisce in una mensola con i gessetti. A destra il telefono parte dal bordo alto della lavagna e la sovrappone, con la chat aperta, le frasi d'esempio come risposte rapide e il campo messaggio, sempre nel primo schermo: è l'azione primaria. Mobile: prima la chat (azione), poi la lavagna; dopo la conferma si scorre alla prima riga riscritta.

FORM: La lavagna, n. 1 della lista ordinata (scelta dall'utente come pick). seed:8d8da9464f9682e1
Interazione firma: alla conferma le righe cambiate si cancellano con una passata di spugna (sfocatura e dissolvenza) e si riscrivono a gesso da sinistra a destra (clip-path), una sola volta, con prefers-reduced-motion rispettato.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
