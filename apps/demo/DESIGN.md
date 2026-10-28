---
name: cms-test demo
description: Il sito della pizzeria scritto a gesso su una lavagna, aggiornato da una chat WhatsApp.
colors:
  wall: "#3b2a1d"
  wall-deep: "#2c1f15"
  frame-wood: "#6b4a2f"
  frame-edge: "#4a3220"
  slate: "#23292b"
  chalk: "#f1efe8"
  chalk-soft: "rgba(241, 239, 232, .72)"
  chalk-faint: "rgba(241, 239, 232, .32)"
  chalk-yellow: "#f4d35e"
  chalk-pink: "#f4a7b9"
  wa-bg: "#0b141a"
  wa-panel: "#202c33"
  wa-out: "#005c4b"
  wa-text: "#e9edef"
  wa-meta: "#8696a0"
  wa-link: "#53bdeb"
  wa-green: "#00a884"
typography:
  display:
    fontFamily: "'Cabin Sketch', 'Patrick Hand', cursive"
    fontSize: "clamp(44px, 6vw, 88px)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "'Cabin Sketch', 'Patrick Hand', cursive"
    fontSize: "clamp(28px, 2.6vw, 36px)"
    fontWeight: 700
  title:
    fontFamily: "'Patrick Hand', 'Segoe Print', cursive"
    fontSize: "clamp(24px, 2.4vw, 32px)"
    fontWeight: 400
  body:
    fontFamily: "'Patrick Hand', 'Segoe Print', cursive"
    fontSize: "23px"
    fontWeight: 400
    lineHeight: 1.2
  label:
    fontFamily: "'Patrick Hand', 'Segoe Print', cursive"
    fontSize: "18px"
    fontWeight: 400
  chat:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.38
rounded:
  board: "2px"
  frame: "6px"
  bubble: "9px"
  action: "7px"
  phone: "38px"
  pill: "999px"
spacing:
  gutter: "clamp(16px, 3vw, 40px)"
  frame: "clamp(14px, 1.8vw, 24px)"
  board-x: "clamp(22px, 3.4vw, 56px)"
  column-gap: "clamp(28px, 4vw, 64px)"
components:
  link-chalk:
    textColor: "{colors.chalk-yellow}"
    typography: "{typography.label}"
  wa-bubble-in:
    backgroundColor: "{colors.wa-panel}"
    textColor: "{colors.wa-text}"
    rounded: "{rounded.bubble}"
    padding: "7px 10px 8px"
  wa-bubble-out:
    backgroundColor: "{colors.wa-out}"
    textColor: "{colors.wa-text}"
    rounded: "{rounded.bubble}"
    padding: "7px 10px 8px"
  wa-action:
    backgroundColor: "rgba(255, 255, 255, .06)"
    textColor: "{colors.wa-link}"
    rounded: "{rounded.action}"
    padding: "8px 10px"
  wa-chip:
    backgroundColor: "{colors.wa-panel}"
    textColor: "{colors.wa-text}"
    rounded: "{rounded.pill}"
    padding: "7px 12px"
  wa-send:
    backgroundColor: "{colors.wa-green}"
    textColor: "{colors.wa-bg}"
    rounded: "{rounded.pill}"
    size: "44px"
  wa-input:
    backgroundColor: "#2a3942"
    textColor: "{colors.wa-text}"
    rounded: "22px"
    padding: "11px 16px"
---

# Design System: cms-test demo

## Overview

**Creative North Star: "La lavagna del locale"**

La demo è una parete di bottega: una lavagna in ardesia dentro una cornice di legno, su cui il sito dell'attività è scritto a gesso. Il titolare non vede un pannello: vede la lavagna che riscriverebbe a mano ogni mattina, e un telefono appoggiato contro di essa da cui la aggiorna scrivendo come su WhatsApp.

Due materiali, due voci. Tutto ciò che è il sito è gesso su ardesia, scritto a mano, con colori di gesso assegnati per ruolo. Tutto ciò che è il canale è l'interfaccia scura di WhatsApp, riconoscibile e senza gesso. Il momento firma lega i due: alla conferma in chat, le righe cambiate della lavagna vengono cancellate con la spugna e riscritte.

**Key Characteristics:**
- Ardesia scura come superficie del contenuto, legno come cornice e parete.
- Due grafie a mano: gesso a doppio tratto per titoli, scrittura leggibile per tutto il resto.
- Gesso colorato per ruolo, mai per decorazione.
- Il telefono è l'unico oggetto non di gesso, e porta l'azione primaria.
- Una sola animazione d'autore: la riscrittura a gesso.

## Colors

Una parete scura e calda, una lavagna fredda, gessi chiari: il contrasto viene dal gesso sull'ardesia, non da riempimenti colorati.

### Primary
- **Gesso giallo** (chalk-yellow): titoli di sezione, prezzi, link, anello di "oggi". È il gesso che il titolare userebbe per ciò che va trovato subito.

### Secondary
- **Gesso rosa** (chalk-pink): lo stato di oggi, le date degli avvisi, "finita!" e la barratura dei piatti esauriti. Segnala ciò che è cambiato o vale solo adesso.

### Neutral
- **Ardesia** (slate): il fondo della lavagna, con aloni di gesso cancellato molto leggeri.
- **Gesso** (chalk): testo principale; **gesso tenue** (chalk-soft) per descrizioni e testo secondario; **gesso velato** (chalk-faint) solo per puntini, tratteggi e divisori, mai per testo.
- **Legno cornice** (frame-wood) e **bordo legno** (frame-edge): cornice e mensola. **Parete** (wall, wall-deep): lo sfondo della pagina.
- **Palette WhatsApp** (wa-*): usata solo dentro il telefono, con i valori dell'interfaccia scura di WhatsApp.

### Named Rules
**The Chalk Roles Rule.** Giallo = da trovare (titoli, prezzi, azioni); rosa = adesso o cambiato (oggi, avvisi, esaurito); bianco = tutto il resto. Nessun terzo colore sulla lavagna.

**The Two Worlds Rule.** I colori wa-* non toccano mai la lavagna, e i gessi non entrano nel telefono (eccezione: l'iniziale gialla nell'avatar).

## Typography

**Display Font:** Cabin Sketch 700 (con Patrick Hand)
**Body Font:** Patrick Hand 400 (con Segoe Print)
**Chat Font:** stack di sistema, come WhatsApp

**Character:** Cabin Sketch ha il doppio tratto del gesso premuto due volte: solo per ciò che un titolare scriverebbe grande. Patrick Hand è una scrittura a mano regolare che resta leggibile a 18px, per menu, orari e avvisi.

### Hierarchy
- **Display** (700, clamp(44px, 6vw, 88px), 0.95): il nome dell'attività e la frase-gancio sopra la lavagna.
- **Headline** (700, clamp(28px, 2.6vw, 36px)): Menu, Avvisi, Orari, in gesso giallo.
- **Title** (400, clamp(24px, 2.4vw, 32px)): lo stato di oggi in rosa.
- **Body** (400, 21–23px, 1.2–1.25): piatti, avvisi, righe degli orari; cifre tabulari per prezzi e orari.
- **Label** (400, 17–19px): descrizioni, contatti, mensola, testi di servizio.

### Named Rules
**The No Tiny Chalk Rule.** Nessun testo di gesso sotto i 17px: se non ci sta, cambia la disposizione (come gli orari, passati da riga a elenco), non la dimensione.

## Layout

Una sola parete centrata (max 1480px, margini clamp(16px, 3vw, 40px)). Su desktop una griglia a due colonne: lavagna fluida e telefono da 380px (340px sotto i 1100px). Il telefono parte dal bordo alto della lavagna, la sovrappone di 84px ed è sticky; la sua altezza (clamp(520px, 100vh − 230px, 760px)) tiene il campo messaggio nel primo schermo. La lavagna è una griglia: intestazione a tutta larghezza, Menu a sinistra, Avvisi e Orari a destra, piede con descrizione e contatti, separato da un tratteggio.

Sotto i 1100px la lavagna diventa una colonna sola. Sotto i 900px l'ordine diventa: frase-gancio, chat, lavagna; il telefono perde la scocca e diventa un pannello. Dopo la conferma la pagina scorre fino alla prima riga riscritta. Ritmo: più spazio sopra un titolo che sotto; 32px tra sezioni in colonna singola.

## Elevation & Depth

La profondità è fisica e poca: la lavagna è incassata nella cornice, il telefono ci sta sopra. Niente card fluttuanti.

### Shadow Vocabulary
- **Incasso ardesia** (`box-shadow: inset 0 0 60px rgba(0,0,0,.55)`): bordi della lavagna più scuri, come l'ardesia sotto la cornice.
- **Cornice sulla parete** (`box-shadow: inset 0 0 0 3px #4a3220, 0 18px 40px rgba(0,0,0,.45)`): la cornice staccata dal muro.
- **Mensola** (`box-shadow: inset 0 3px 0 rgba(0,0,0,.3), 0 10px 18px rgba(0,0,0,.4)`): il bordo in rilievo dove poggiano i gessetti.
- **Telefono** (`box-shadow: 0 24px 50px rgba(0,0,0,.55), -6px 10px 24px rgba(0,0,0,.35)`): l'unico oggetto che proietta ombra sulla lavagna.

### Named Rules
**The Objects Only Rule.** Fanno ombra solo gli oggetti reali (cornice, mensola, gessetti, telefono). Testi e sezioni della lavagna non hanno ombre né contenitori.

## Shapes

La lavagna ha angoli quasi vivi (2px) e la cornice angoli appena smussati (6px). Il cerchio di "oggi" è un'ellisse irregolare (raggi 46/54/50/50 su 52/46/54/48) che segue il contenuto, come un giro di gesso fatto a mano. Il telefono ha i raggi di un telefono (38px); dentro, le forme sono quelle di WhatsApp: bolle a 9px con l'angolo di partenza a 2px, pillole per suggerimenti e invio. I gessetti sulla mensola sono rettangoli arrotondati di lunghezze diverse.

## Components

### Righe di gesso
Ogni riga della lavagna (piatto, avviso, giorno, contatti) è un'unità che può essere riscritta. **Riscrittura:** 1.6s, cubic-bezier(.16, 1, .3, 1); prima la spugna (sfocatura 6px e dissolvenza), poi il gesso da sinistra a destra (clip-path). Con prefers-reduced-motion non c'è animazione.

### Voce di menu
Nome in gesso, descrizione in gesso tenue, puntini tratteggiati fino al prezzo giallo. **Esaurito:** nome e descrizione in gesso tenue barrati in rosa (2px); al posto del prezzo "finita!" in rosa.

### Orari
Elenco verticale dei sette giorni (nome per esteso, fasce orarie che non si spezzano). Oggi è cerchiato in gesso giallo e il nome del giorno diventa giallo.

### Link di gesso
Testo giallo sottolineato a 1px (offset 4px), che diventa 2px al passaggio del mouse. Focus: contorno tratteggiato giallo a 2px, offset 3px, ovunque nella pagina.

### Telefono WhatsApp
- **Bolle:** in arrivo wa-panel, in uscita wa-out, con orario e spunte blu (SVG).
- **Azioni** (Conferma, Annulla, Annulla questa modifica, frasi d'esempio a chat vuota): pulsanti larghi in blu WhatsApp su un velo bianco del 6%, che sale all'11% al passaggio del mouse. Conferma prende il focus quando arriva l'anteprima.
- **Suggerimenti:** pillole wa-panel con bordo #2a3942, verde al passaggio del mouse; vanno a capo, con scorrimento verticale oltre 88px.
- **Campo messaggio:** pillola #2a3942, cursore verde; Invio manda, Maiusc+Invio va a capo. **Invio:** cerchio verde da 44px con icona SVG; disattivato, diventa grigio.

## Do's and Don'ts

### Do:
- **Do** scrivere ogni contenuto del sito sulla lavagna in gesso, con i ruoli giallo/rosa/bianco.
- **Do** far arrivare ogni modifica dalla chat, con anteprima e conferma, e mostrarla con la riscrittura a gesso.
- **Do** dichiarare come esempio i dati inventati (la mensola dice "sito d'esempio").
- **Do** temare le superfici del browser: selezione gialla su ardesia, focus tratteggiato giallo, barre di scorrimento color legno.

### Don't:
- **Don't** mettere card, contenitori bianchi o ombre attorno alle sezioni della lavagna.
- **Don't** usare il gesso velato (chalk-faint) per testo che va letto.
- **Don't** usare emoji o glifi come icone: le icone sono SVG.
- **Don't** aggiungere altre animazioni d'ingresso: la riscrittura è l'unico movimento d'autore.
