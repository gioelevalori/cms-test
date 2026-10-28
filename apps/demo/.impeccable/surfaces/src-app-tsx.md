---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/Site.tsx","src/BusinessList.tsx","src/Chat.tsx","src/styles.css"]
---

# Demo pubblica (GitHub Pages)

Scope: `apps/demo`, intera pagina. Mode: Persuade.
Audience: titolari di attività di qualsiasi settore e freelance che fanno siti per clienti; spesso da telefono.
Action: scegliere un'attività, scrivere (o toccare) un messaggio, Conferma.
Proof: il giro completo dal vivo su cinque attività inventate di settori diversi, dichiarate come esempio; ogni sito d'esempio ha intestazione e piè di pagina come un sito vero.
Constraints: stessa logica (`interpretMessage`, `applyOps`, `toSchemaOrg`, storage locale, annulla), base `/cms-test/`, italiano.
Unresolved: il sito pubblico reale (`apps/web`) non segue ancora questo aspetto.
History: dopo l'approvazione l'utente ha chiesto foto, siti diversi tra loro e più elementi utili (header ecc.). Rifiutate "La lavagna" (legata alla ristorazione) e "Il tabellone" (all'utente non è piaciuto); l'utente ha chiesto niente metafore, un sito con header e footer, "bello di design".

## Direction contract

THESIS: La demo è un prodotto vero: un'app di messaggi in cui ogni attività è una chat, e accanto il suo sito, che cambia mentre confermi. Rifiuta sia la landing SaaS con mockup di telefono sia le metafore (lavagna, tabellone).

OWN-WORLD: Cornice chiara e nitida: fondo grigio freddo, pannelli bianchi divisi da linee sottili, inchiostro quasi nero, blu cobalto come unico colore del prodotto (messaggi inviati, Conferma, link). Una sola famiglia, Onest. I siti d'esempio sono fatti come da grafici diversi: ognuno ha colore, carattere (Gloock, Archivo, Young Serif, Onest, Unbounded) e impaginazione dell'hero propri, foto vere da Unsplash, barra informazioni, intestazione fissa con menu, Scrivici e Chiama, punti di forza, Dove siamo, galleria e piè di pagina scuro. Il giallo segna solo ciò che è appena cambiato.

STORY: Capisce in una riga cosa fa, vede cinque attività di settori diversi, sceglie la sua, tocca una frase, conferma, vede la riga del sito illuminarsi.

FIRST VIEWPORT: In alto a sinistra marchio e titolo grande, a destra la frase di spiegazione. Sotto, una sola grande finestra arrotondata in tre colonne: elenco attività (272px), conversazione con esempi e campo messaggio (380px), anteprima del sito con barra indirizzo. Il campo messaggio è sempre nel primo schermo. Mobile: titolo, attività in riga orizzontale, chat, sito; dopo la conferma si scorre al sito.

FORM: La chat delle attività (n. 7 della lista del secondo giro, assegnata dal roll; scelta da Claude su richiesta dell'utente dopo il rifiuto del tabellone). seed:f1201e532985f45d
Interazione firma: alla conferma la parte del sito cambiata si illumina di giallo e sfuma in 2,4 s, e l'anteprima scorre fino a lei; con prefers-reduced-motion niente animazione.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
