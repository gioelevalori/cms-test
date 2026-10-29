import type { Prisma } from '@prisma/client';
import { categoryProfile } from '@cms/shared';

/** Le voci del menu "Cosa posso fare" (lista WhatsApp: titolo fino a 24 caratteri, descrizione fino a 72). */
export const TIP_TOPICS = [
  { id: 'hours', title: 'Orari', description: 'Giorni e fasce di apertura' },
  { id: 'catalog', title: 'Menu e prezzi', description: 'Aggiungi voci, cambia prezzi, segna cosa è finito' },
  { id: 'closures', title: 'Chiusure e ferie', description: 'Un giorno chiuso, orario ridotto, ferie' },
  { id: 'posts', title: 'Novità ed eventi', description: 'Eventi, offerte e avvisi sul sito' },
  { id: 'photos', title: 'Foto e logo', description: 'Copertina, logo, galleria, foto di una voce' },
  { id: 'contacts', title: 'Contatti', description: 'Telefono, indirizzo, email, descrizione' },
  { id: 'look', title: 'Aspetto del sito', description: 'Stile, colore, frase sotto il nome, social' },
  { id: 'ideas', title: 'Idee per il sito', description: 'Cosa aggiungere per farlo rendere di più' },
] as const;
export type TipTopic = (typeof TIP_TOPICS)[number]['id'];
export const isTipTopic = (v: string): v is TipTopic => TIP_TOPICS.some((t) => t.id === v);

/** Cosa c'è già sul sito: serve per suggerire quello che manca, non quello che c'è. */
export interface SiteState {
  name: string;
  slug: string;
  category: string;
  hours: number;
  catalog: number;
  photos: number;
  posts: number;
  hasAddress: boolean;
  hasPhone: boolean;
  hasDescription: boolean;
  hasLogo: boolean;
  hasCover: boolean;
  hasTagline: boolean;
  hasHighlights: boolean;
  hasSocial: boolean;
}

export async function siteState(db: Prisma.TransactionClient, businessId: string): Promise<SiteState> {
  const b = await db.business.findUniqueOrThrow({
    where: { id: businessId },
    select: {
      name: true, slug: true, category: true, address: true, phone: true, description: true, logoUrl: true, coverUrl: true, theme: true,
      _count: { select: { openingHours: true, catalog: true, photos: true, posts: true } },
    },
  });
  const site = (b.theme && typeof b.theme === 'object' && !Array.isArray(b.theme) ? b.theme : {}) as {
    tagline?: string; highlights?: string[]; links?: Record<string, string>;
  };
  return {
    name: b.name,
    slug: b.slug,
    category: b.category,
    hours: b._count.openingHours,
    catalog: b._count.catalog,
    photos: b._count.photos,
    posts: b._count.posts,
    hasAddress: Boolean(b.address),
    hasPhone: Boolean(b.phone),
    hasDescription: Boolean(b.description),
    hasLogo: Boolean(b.logoUrl),
    hasCover: Boolean(b.coverUrl),
    hasTagline: Boolean(site.tagline),
    hasHighlights: Boolean(site.highlights?.length),
    hasSocial: Object.values(site.links ?? {}).some(Boolean),
  };
}

const quote = (s: string) => `«${s}»`;

/** Un esempio di voce nuova adatto al tipo di attività ("Aggiungi lo spritz a 5 euro…"). */
function addExample(category: string) {
  const p = categoryProfile(category);
  return p.examples.find((e) => /^aggiungi/i.test(e)) ?? `Aggiungi ${p.defaultSection.toLowerCase()} a 10 euro`;
}

/**
 * Subito dopo il collegamento: cosa manca sul sito, ognuna con la frase da mandare.
 * Al massimo tre, dalla più utile, così il messaggio resta corto.
 */
export function welcomeText(s: SiteState): string {
  const p = categoryProfile(s.category);
  const missing: string[] = [];
  if (!s.hours) missing.push(`• Gli orari: ${quote('Il martedì dalle 9 alle 18')}`);
  if (!s.catalog) missing.push(`• ${p.catalogTitle}: ${quote(addExample(s.category))}`);
  if (!s.hasAddress) missing.push(`• L'indirizzo: ${quote('Il nuovo indirizzo è Via Roma 1, Pescara')}`);
  if (!s.hasPhone) missing.push(`• Il telefono: ${quote('Il nuovo numero di telefono è 085 123456')}`);
  if (!s.hasCover && !s.photos) missing.push('• Una foto: mandamela con scritto "copertina"');
  if (!s.hasLogo) missing.push('• Il logo: mandalo come foto con scritto "logo"');
  if (!s.hasDescription) missing.push(`• Due righe su di voi: ${quote('Descrizione: …')}`);

  const head = `Fatto! Da questo numero ora aggiorni il sito di ${s.name}. Solo tu puoi farlo: gli altri numeri vengono ignorati.`;
  const how = 'Scrivimi come lo diresti a un collaboratore: ti mostro sempre l’anteprima e cambio il sito solo se confermi.';
  if (!missing.length) {
    return `${head}\n\n${how}\n\nIl sito ha già tutto l'essenziale. Prova per esempio:\n${p.examples.slice(0, 3).map((e) => `• ${quote(e)}`).join('\n')}`;
  }
  return `${head}\n\n${how}\n\nPer completare il sito, inizia da qui:\n${missing.slice(0, 3).join('\n')}`;
}

/** La risposta a una voce del menu: come si fa, con esempi adatti all'attività. */
export function tipText(topic: TipTopic, s: SiteState, canStructure: boolean, siteUrl: string | null): string {
  const p = categoryProfile(s.category);
  const item = p.examples.find((e) => /^aggiungi/i.test(e));
  const lines = (title: string, examples: string[], note?: string) =>
    [`*${title}*`, '', 'Mandami un messaggio come questi:', ...examples.map((e) => `• ${quote(e)}`), ...(note ? ['', note] : [])].join('\n');

  switch (topic) {
    case 'hours':
      return lines('Orari', ['Il martedì dalle 9 alle 18', 'Il sabato dalle 9 alle 13 e dalle 16 alle 20', 'Il lunedì siamo chiusi'],
        'Puoi scriverne più di uno nello stesso messaggio.');
    case 'catalog':
      return lines(p.catalogTitle, [item ?? addExample(s.category), 'La margherita costa 7 euro', 'La carbonara è finita'],
        'Per rimetterla: «La carbonara è di nuovo disponibile». Con una foto e il nome della voce nella didascalia, la foto va su quella voce.');
    case 'closures':
      return lines('Chiusure e ferie', ['Domani siamo chiusi', 'Sabato apriamo dalle 10 alle 15', 'Dal 10 al 20 agosto chiusi per ferie'],
        'Valgono solo per quei giorni: poi il sito torna all’orario solito da solo.');
    case 'posts':
      return lines('Novità ed eventi', ['Evento il 12 dicembre: serata jazz dal vivo', 'Offerta: colazione a 3 euro fino a venerdì', 'Avviso: da lunedì nuovi orari'],
        'Compaiono nella sezione Novità del sito.');
    case 'photos':
      return [
        '*Foto e logo*', '',
        'Mandami una foto e scrivi nella didascalia:',
        '• «copertina»: diventa la foto grande in cima al sito',
        '• «logo»: diventa il logo (meglio con lo sfondo trasparente)',
        '• il nome di una voce, es. «diavola»: diventa la sua foto',
        '• niente: va nella galleria',
        '',
        'Anche qui vedi l’anteprima prima che cambi il sito.',
      ].join('\n');
    case 'contacts':
      return lines('Contatti', ['Il nuovo numero di telefono è 085 123456', 'Il nuovo indirizzo è Via Roma 1, Pescara', 'La nuova email è info@esempio.it', 'Descrizione: pizzeria di famiglia dal 1985']);
    case 'look':
      return lines('Aspetto del sito', [
        'Slogan: il bar della piazza dal 1972',
        'Punti di forza: dehors coperto, aperitivo dalle 18, parcheggio',
        'Instagram: @nomeattivita',
        ...(canStructure ? ['Stile elegante', 'Colore verde', 'Nascondi la galleria'] : []),
      ], canStructure
        ? 'Stili: calda, elegante, decisa, pulita, energica. Per spostare le sezioni trascinandole c’è “Modifica il sito” nel pannello.'
        : 'Stile, colore e sezioni li sceglie chi ha costruito il sito.');
    case 'ideas': {
      const ideas: string[] = [];
      if (!s.hasTagline) ideas.push('• Una frase sotto il nome che dica cosa vi rende diversi: «Slogan: …»');
      if (!s.hasHighlights) ideas.push('• Tre punti di forza sotto la copertina: «Punti di forza: …, …, …»');
      if (s.photos < 3) ideas.push('• Qualche foto in galleria: il locale, i prodotti, la squadra');
      if (!s.posts) ideas.push('• Un evento o un’offerta: fa vedere che il sito è vivo');
      if (!s.hasSocial) ideas.push('• Il collegamento al vostro Instagram o Facebook: «Instagram: @nome»');
      ideas.push('• Il codice QR del sito da stampare su menu, tavoli o vetrina: lo scarichi dal pannello, scheda “Il tuo sito”');
      ideas.push('• Avvisi per le chiusure: chi cerca su Google vede gli orari giusti anche a Natale e Ferragosto');
      return ['*Idee per il tuo sito*', '', ...ideas.slice(0, 5), ...(siteUrl ? ['', `Il tuo sito: ${siteUrl}`] : [])].join('\n');
    }
  }
}
