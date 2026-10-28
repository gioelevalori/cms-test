---
name: cms-test demo
description: Un'app di messaggi in cui ogni attività è una chat, e accanto il suo sito che si aggiorna alla conferma.
colors:
  ground: "#eceef1"
  panel: "#ffffff"
  panel-soft: "#f4f6f8"
  line: "#e1e4e8"
  ink: "#12161b"
  ink-2: "#3f4751"
  muted: "#646d78"
  brand: "#2448d8"
  brand-deep: "#1b37ad"
  brand-soft: "#e8edff"
  mark: "#ffe58a"
  footer: "#14181d"
  energia-pop: "#c8f04b"
  open: "#1f9d55"
  closed: "#d64545"
typography:
  display:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "clamp(30px, 3.3vw, 46px)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  site-display:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "clamp(38px, 8cqi, 76px)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  site-atelier:
    fontFamily: "Gloock, Georgia, serif"
    fontWeight: 400
    letterSpacing: "-0.01em"
  site-bottega:
    fontFamily: "Archivo, Onest, sans-serif"
    fontWeight: 800
    letterSpacing: "-0.01em"
  site-trattoria:
    fontFamily: "Young Serif, Georgia, serif"
    fontWeight: 400
    letterSpacing: "-0.015em"
  site-energia:
    fontFamily: "Unbounded, Onest, sans-serif"
    fontWeight: 700
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "clamp(24px, 3.6cqi, 30px)"
    fontWeight: 700
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
  body:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
rounded:
  app: "22px"
  bubble: "16px"
  item: "14px"
  logo: "11px"
  control: "10px"
  pill: "999px"
spacing:
  page: "clamp(16px, 2.6vw, 36px)"
  site-x: "clamp(18px, 5cqi, 40px)"
  site-section: "clamp(36px, 7cqi, 60px)"
components:
  bubble-in:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.bubble}"
    padding: "10px 13px"
  bubble-out:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.panel}"
    rounded: "{rounded.bubble}"
    padding: "10px 13px"
  button-confirm:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.panel}"
    rounded: "{rounded.control}"
    padding: "9px 12px"
  button-confirm-hover:
    backgroundColor: "{colors.brand-deep}"
  button-secondary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 12px"
  starter:
    backgroundColor: "{colors.panel-soft}"
    textColor: "{colors.brand}"
    rounded: "{rounded.control}"
    padding: "9px 12px"
  list-item-current:
    backgroundColor: "{colors.brand-soft}"
    rounded: "{rounded.item}"
    padding: "11px 12px"
  message-input:
    backgroundColor: "{colors.panel-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "12px 16px"
  send:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.panel}"
    rounded: "{rounded.pill}"
    size: "46px"
---

# Design System: cms-test demo

## Overview

**Creative North Star: "Il bancone dei messaggi"**

La demo è il prodotto vero, non una sua metafora: un'app di messaggi chiara, in cui ogni attività è una chat, e accanto il sito di quell'attività, con intestazione e piè di pagina come un sito reale. Il titolare scrive come su WhatsApp, conferma, e vede la riga del sito illuminarsi. Il freelance vede che ogni cliente è una chat in più.

Due livelli, due voci. La cornice del prodotto è sobria e silenziosa: grigio freddo, bianco, linee sottili e un solo blu cobalto. I siti d'esempio invece hanno carattere, e ognuno il suo, come se li avessero fatti grafici diversi: foto vere, carattere proprio, impaginazione dell'hero propria. È la prova che il prodotto serve qualsiasi settore e che i dati restano gli stessi sotto qualunque veste. Il giallo compare solo per un attimo, su ciò che è appena cambiato.

Rifiutati in modo esplicito dall'utente: le metafore di un mestiere o di un oggetto (lavagna, tabellone) e ogni identità che leghi il prodotto alla ristorazione.

**Key Characteristics:**
- Una sola grande finestra in tre colonne: attività, conversazione, sito.
- Un solo colore del prodotto (cobalto) e una sola famiglia tipografica (Onest).
- Cinque siti d'esempio, cinque stili: colore, carattere, hero e galleria diversi.
- Siti credibili: barra informazioni, intestazione fissa con menu e due azioni, punti di forza, contenuti dai dati, "Dove siamo", galleria, piè di pagina.
- Una sola animazione d'autore: l'evidenziazione gialla di ciò che è cambiato.

## Colors

Neutri freddi e luminosi per il prodotto, un cobalto deciso per le azioni, e i colori pieni dei siti d'esempio come unica nota calda.

### Primary
- **Cobalto** (brand): messaggi inviati, Conferma, link, frasi d'esempio, attività selezionata (su brand-soft), pallino "sito aggiornato". È il colore del prodotto e di nient'altro.

### Neutral
- **Grigio freddo** (ground): fondo della pagina.
- **Bianco** (panel) e **bianco fumo** (panel-soft): pannelli dell'app e fondo della conversazione.
- **Linea** (line): ogni divisione tra colonne, righe e sezioni.
- **Inchiostro** (ink), **inchiostro secondario** (ink-2), **grigio testo** (muted): titoli, testo, testo di supporto.
- **Notte** (footer): piè di pagina dei siti d'esempio.

### Tertiary
- **Giallo evidenziatore** (mark): solo sulla parte del sito appena cambiata, per 2,4 secondi.
- **Verde aperto / rosso chiuso** (open, closed): solo il pallino dello stato di oggi.

### Colori dei siti d'esempio
Ogni attività ha il suo colore (`accent` in `src/sample.ts`): vinaccia per il salone, ruggine per la ferramenta, rosso pomodoro per la pizzeria, verde petrolio per lo studio, indaco per la palestra. Tutti reggono il testo bianco (AA). Sul sito il colore va su logo, hero, Chiama, titoletti delle sezioni, giorno di oggi e date delle novità.

### Named Rules
**The One Product Color Rule.** Il cobalto è il prodotto; il colore di un'attività resta dentro il suo sito. I due non si mescolano mai.

**The Yellow Means Changed Rule.** Il giallo esiste solo per segnare ciò che è appena cambiato, e sparisce da solo.

## Typography

**Font:** Onest 400/500/600/700, servito dal progetto (`@fontsource/onest`).

**Character:** una grottesca contemporanea e rotonda, chiara nei numeri: abbastanza neutra per la cornice del prodotto, abbastanza piena nei pesi alti per gli hero dei siti.

### Hierarchy
- **Display** (600, clamp(30px, 3.3vw, 46px), 1.05, -0.03em): il titolo della pagina.
- **Site display** (700, clamp(38px, 8cqi, 76px), 0.98, -0.035em): il nome dell'attività nell'hero, misurato sulla larghezza dell'anteprima.
- **Headline** (700, clamp(24px, 3.6cqi, 30px)): sezioni del sito (Servizi, Orari, Novità).
- **Title** (600, 15.5–16px): nomi nell'elenco, voci del catalogo, nome nel header del sito.
- **Body** (400, 15–17px, 1.45–1.5): messaggi, descrizioni, testo di pagina (max 62ch).
- **Label** (600, 12–13px): titoletti dei gruppi del catalogo in maiuscolo con spaziatura, note, stato "oggi".

### Caratteri dei siti d'esempio
Solo dentro l'anteprima, per titoli, nome nel header e titoli di sezione (`--display` sul `.site`): Gloock per il salone, Archivo 800 in maiuscolo per la ferramenta, Young Serif per la pizzeria, Unbounded 700 in maiuscolo per la palestra; lo studio resta in Onest. Il testo corrente dei siti resta Onest. Tutti serviti dal progetto (`@fontsource`).

### Named Rules
**The Product Speaks Onest Rule.** La cornice del prodotto usa solo Onest; i caratteri dei siti non escono mai dall'anteprima.

**The Numbers Line Up Rule.** Prezzi e orari usano cifre tabulari e non vanno mai a capo a metà di una fascia oraria.

## Layout

Pagina centrata (max 1520px). In alto marchio, titolo e spiegazione. Sotto, una finestra unica alta clamp(600px, 100vh − 200px, 940px) in tre colonne: elenco attività 272px, conversazione 380px, anteprima del sito flessibile (228/340 sotto i 1240px). Il campo messaggio è sempre nel primo schermo. L'elenco termina con una nota che spiega che le attività sono inventate.

L'anteprima è un contenitore con le sue container query: sopra i 620px catalogo, orari/novità e piè di pagina vanno su più colonne; sotto i 560px il menu del sito scende sotto il marchio. Sotto i 900px di viewport l'ordine diventa titolo, attività in riga orizzontale, chat, sito; dopo la conferma la pagina scorre fino al sito.

## Elevation & Depth

Quasi tutto è piatto e diviso da linee. Ci sono solo due ombre.

### Shadow Vocabulary
- **Finestra dell'app** (`box-shadow: 0 1px 2px rgba(18,22,27,.06), 0 24px 60px -12px rgba(18,22,27,.18)`): stacca l'unica finestra dal fondo.
- **Fumetto in arrivo** (`box-shadow: 0 1px 1px rgba(18,22,27,.06)`): appena percettibile, sul fondo grigio della conversazione.

### Named Rules
**The Lines Not Cards Rule.** Le parti si separano con linee da 1px, non con card. Niente card dentro card.

## Shapes

Angoli morbidi e coerenti: finestra 22px, fumetti 16px (l'angolo da cui parlano a 5px), voci dell'elenco 14px, logo dei siti 11px, pulsanti e frasi d'esempio 10px, pillole per campo messaggio, invio, Chiama, stato di oggi e indirizzo.

## Components

### Elenco attività
Avatar tondo da 42px nel colore dell'attività, nome e ultimo messaggio (o settore). Attiva: fondo brand-soft. Un pallino cobalto da 10px segna le attività già aggiornate. Su telefono diventa una riga orizzontale scorrevole di avatar con nome (14px).

### Conversazione
- **Fumetti:** in arrivo bianchi, inviati in cobalto con orario e spunte.
- **Anteprima della modifica:** elenco puntato, poi Conferma (cobalto pieno, prende il focus) e Annulla (bianco con linea).
- **Frasi d'esempio:** a chat vuota, elenco verticale di pulsanti in cobalto; dopo il primo scambio, pillole che vanno a capo sopra il campo.
- **Campo messaggio:** pillola bianco fumo con linea; Invio manda, Maiusc+Invio va a capo. Invio: cerchio cobalto da 46px con icona SVG.

### Sito d'esempio
- **Barra indirizzo:** dominio `.example` in pillola e "Anteprima del sito".
- **Barra informazioni:** sopra l'intestazione, indirizzo, telefono e orario di oggi con icone SVG a tratto (l'indirizzo sparisce sotto i 560px di anteprima).
- **Intestazione fissa:** logo nel colore dell'attività, nome e sottotitolo, menu (catalogo, Orari, Contatti; va su una riga sua sotto gli 820px di anteprima), due azioni: "Scrivici" (contorno; nella demo porta alla chat, che è lo stesso canale) e "Chiama" (pieno).
- **Hero:** foto vera da Unsplash con nome enorme, descrizione, pillola con lo stato di oggi e pallino verde/rosso; eventuali variazioni d'orario sotto. L'impaginazione cambia con lo stile (vedi sotto).
- **Punti di forza:** tre frasi brevi con spunta, in riga sotto l'hero.
- **Dove siamo:** indirizzo, orario di oggi e "Apri la mappa" (ricerca Google Maps in una nuova scheda).
- **Galleria:** tre foto dell'attività, impaginate secondo lo stile (vedi sotto).
- **Crediti:** nel piè di pagina "Foto su Unsplash di …" con il nome di ogni autore, collegato alla pagina della foto (`author` e `page` in `src/sample.ts`).
- **Azioni su anteprima stretta:** sotto i 900px di anteprima "Scrivici" resta solo icona (con `aria-label`); il menu va a capo solo sotto i 640px.
- **Catalogo:** gruppi con titoletto colorato, righe nome/descrizione e prezzo; esaurito barrato con "Non disponibile".
- **Orari e novità:** due colonne; oggi evidenziato nel colore dell'attività con etichetta "oggi".
- **Piè di pagina:** scuro, marchio, contatti (email come link), sezioni e orario di oggi, riga legale con la nota "sito d'esempio". Il telefono resta testo: i numeri d'esempio sono inventati.

### Gli stili dei siti (`data-look`)
- **Atelier (salone):** hero diviso, testo su tinta tenue a sinistra e foto a destra; logo tondo; galleria con una foto alta e due affiancate.
- **Bottega (ferramenta):** foto a tutto campo scurita, nome in maiuscolo con riga spessa nel colore dell'attività; angoli quasi vivi; punti di forza su fascia scura; prezzi grandi nel colore; galleria quadrata.
- **Trattoria (pizzeria):** fondo crema, foto a tutto campo con testo in basso su sfumatura scura; sezioni centrate; righe del menu punteggiate; galleria con una foto larga 21:9 e due sotto.
- **Clinica (studio):** tutto bianco, foto incorniciata con angoli da 22px accanto al testo; punti di forza in un riquadro tinto; galleria arrotondata.
- **Energia (palestra):** sito scuro, foto in bianco e nero fusa nel colore, verde lime (#c8f04b) per barra in alto, prezzi, oggi e azioni; galleria a striscia senza spazi, in bianco e nero.

I caratteri a peso unico (Gloock, Young Serif) non vengono mai ingrassati: `font-synthesis: none` sul sito e peso preso da `--display-weight`.

### Evidenziazione del cambiamento
La parte cambiata prende il giallo con un alone di 6px e sfuma in 2,4 s (cubic-bezier(.16,1,.3,1)); l'anteprima scorre per centrarla. Con prefers-reduced-motion nessuna animazione né scorrimento animato.

## Do's and Don'ts

### Do:
- **Do** tenere il cobalto come unico colore del prodotto e il colore di ogni attività dentro il suo sito.
- **Do** costruire ogni sito d'esempio come un sito vero: intestazione, menu, contenuti dai dati, piè di pagina.
- **Do** dichiarare sempre che attività e dati sono inventati, e usare domini `.example`.
- **Do** usare foto vere a licenza gratuita (Unsplash) con testo alternativo in italiano, e citarle nel piè di pagina.
- **Do** dare a ogni nuovo sito d'esempio uno stile suo (`look`), diverso dagli altri, con gli stessi blocchi di dati.
- **Do** mostrare ogni modifica con l'evidenziazione gialla e lo scorrimento fino a lei.

### Don't:
- **Don't** usare metafore di un mestiere o di un oggetto (lavagna, tabellone) per l'identità del prodotto.
- **Don't** far sembrare la ristorazione il settore "vero": tutte le attività hanno lo stesso peso.
- **Don't** separare le parti con card o ombre: linee da 1px.
- **Don't** rendere chiamabili i numeri di telefono d'esempio.
- **Don't** aggiungere animazioni d'ingresso: l'evidenziazione è l'unico movimento.

## Percorso della vetrina e richiesta informazioni

La demo resta la prima prova del prodotto. Il titolo e la spiegazione occupano due colonne sopra
i 1100px; l'altezza della finestra si adatta al viewport per mantenere visibile il campo messaggio
su desktop. Una riga di tre passaggi descrive scrittura, conferma e risultato. I collegamenti
“Vai alla chat” e “Guarda il sito” aiutano sugli schermi stretti e mantengono un focus accessibile.

La libreria di sei esempi usa righe aperte divise da linee, su due colonne o una sola da telefono.
Ogni esempio seleziona l'attività corretta e prepara una proposta, senza applicarla. I comandi
testuali “sì”, “no”, “annulla” e “aiuto” restituiscono un riscontro nella conversazione.

Il modulo finale prepara un riepilogo, senza salvarlo o inviarlo automaticamente. I campi usano
gli stessi token, controlli da almeno 46px e testi da 16px; il risultato resta selezionabile.
“Copia il riepilogo” funziona anche senza recapito commerciale. Con un numero o una email
configurati, compare un collegamento esplicito per aprire il canale con il testo preparato.
Nessun recapito, listino del servizio o prova sociale viene inventato.

Verifica del 28 ottobre 2026: viewport 1365×900, 768×1024 e 390×844, senza overflow della pagina.
Controllati esempio/prezzo, conferma testuale, annullamento, rifiuto, aiuto e copia del riepilogo.
