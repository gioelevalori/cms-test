import type { BusinessData } from './types';
import type { ChangeOp } from './operations';
import { categoryProfile } from './categories';
import { COLORS, linkUrl, type LinkId, type LookId, type SectionId } from './site';

/** Parole del titolare per ogni stile ("rendi il sito più elegante"). */
const LOOK_WORDS: [RegExp, LookId][] = [
  [/\b(elegant[ei]|raffinat[oa]|chic|classic[oa])\b/, 'atelier'],
  [/\b(cald[oa]|tradizional[ei]|rustic[oa]|accogliente|trattoria)\b/, 'trattoria'],
  [/\b(decis[oa]|forte|industrial[ei]|modern[oa]|grintos[oa])\b/, 'bottega'],
  [/\b(pulit[oa]|semplice|minimal[ei]?|luminos[oa]|professional[ei]|chiar[oa]|sobri[oa])\b/, 'clinica'],
  [/\b(energic[oa]|sportiv[oa]|scur[oa]|dark|nero)\b/, 'energia'],
];

/** Come il titolare chiama ogni sezione. Il menu ha tanti nomi a seconda dell'attività. */
function sectionOf(words: string, data: BusinessData): SectionId | null {
  const w = words.replace(/^(?:la|le|il|i|gli|lo|l')\s*/, '').replace(/^sezione\s+/, '').trim();
  const catalogTitle = categoryProfile(data.category).catalogTitle.toLowerCase();
  const table: [RegExp, SectionId][] = [
    [/^(?:punti di forza|vantaggi)$/, 'highlights'],
    [new RegExp(`^(?:menu|menu del giorno|listino|servizi|prezzi|prodotti|catalogo|trattamenti|prestazioni|carta|${catalogTitle})$`), 'catalog'],
    [/^(?:chi siamo|presentazione|descrizione|storia)$/, 'about'],
    [/^(?:orari|orario)$/, 'hours'],
    [/^(?:novita|notizie|eventi|news|avvisi)$/, 'posts'],
    [/^(?:galleria|foto|fotografie|immagini)$/, 'gallery'],
    [/^(?:dove siamo|mappa|posizione|indirizzo)$/, 'where'],
  ];
  return table.find(([re]) => re.test(w))?.[1] ?? null;
}

/**
 * Frasi sulla veste del sito: stile, colore, frase sotto il nome, punti di forza,
 * sezioni (mostra, nascondi, sposta, rinomina) e social. Null se la frase parla d'altro.
 * @param text frase già normalizzata (minuscolo, senza accenti)
 * @param original la stessa frase com'è stata scritta, per copiare i testi
 */
export function interpretSite(text: string, original: string, data: BusinessData): ChangeOp[] | null {
  // Testi: "slogan: …", "punti di forza: a, b, c"
  const tagline = original.match(/^\s*(?:slogan|motto|frase(?: sotto il nome)?|sottotitolo)\s*:\s*(.*)$/i);
  if (tagline) return [{ op: 'setTagline', text: tagline[1].trim().slice(0, 160) }];
  const highlights = original.match(/^\s*(?:punti di forza|vantaggi)\s*:\s*(.+)$/i);
  if (highlights) {
    const items = highlights[1].split(/\s*,\s*|\s+e\s+/).map((s) => s.trim()).filter(Boolean).slice(0, 3);
    return items.length ? [{ op: 'setHighlights', items: items.map((i) => i.slice(0, 80)) }] : null;
  }

  // Titolo di una sezione: "titolo menu: La nostra cucina", "chiama la galleria: Il locale"
  const title = original.match(/^\s*(?:titolo(?: della sezione)?|chiama(?: la sezione)?|rinomina(?: la sezione)?)\s+([^:]+?)\s*:\s*(.*)$/i);
  if (title) {
    const section = sectionOf(title[1].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), data);
    if (section) return [{ op: 'setSectionTitle', section, title: title[2].trim().slice(0, 60) }];
  }

  // Social: "instagram: @pizzeriamario", "il nostro facebook è facebook.com/mario"
  const social = text.match(/\b(instagram|facebook|tiktok|sito web)\b/);
  if (social) {
    const network: LinkId = social[1] === 'sito web' ? 'website' : (social[1] as LinkId);
    if (/^(?:togli|rimuovi|elimina|cancella)\b/.test(text)) return [{ op: 'setLink', network, url: null }];
    const value = original.match(/(https?:\/\/\S+|(?:www\.)?(?:instagram|facebook|tiktok)\.com\/\S+|@[\w.]+)\s*$/i)?.[1]
      ?? original.match(/:\s*([\w.@/-]+)\s*$/)?.[1];
    const url = value ? linkUrl(network, value)?.replace(/^http:\/\//i, 'https://') : null;
    return url ? [{ op: 'setLink', network, url }] : null;
  }

  // Colore: "colore verde", "metti il blu come colore", "colore #2448d8"
  if (/\bcolor[ei]\b/.test(text)) {
    const hex = text.match(/#[0-9a-f]{6}\b/)?.[0];
    if (hex) return [{ op: 'setAccent', color: hex }];
    const name = Object.keys(COLORS).sort((a, b) => b.length - a.length).find((c) => new RegExp(`\\b${c}\\b`).test(text));
    if (name) return [{ op: 'setAccent', color: COLORS[name] }];
  }

  // Stile: "stile elegante", "rendi il sito più moderno", "voglio un sito scuro"
  if (/\b(stile|look|aspetto|sito)\b/.test(text) && !/\b(sezione|instagram|facebook)\b/.test(text)) {
    const look = LOOK_WORDS.find(([re]) => re.test(text))?.[1];
    if (look) return [{ op: 'setLook', look }];
  }

  // Sezioni: "nascondi la galleria", "mostra gli orari", "metti le foto in alto"
  const visibility = text.match(/^(nascondi|togli|rimuovi|mostra|rimetti|fai vedere)\s+(?:la sezione\s+)?(.+?)(?:\s+dal sito|\s+sul sito)?$/);
  if (visibility) {
    const section = sectionOf(visibility[2], data);
    if (section) return [{ op: 'setSectionVisible', section, visible: /^(mostra|rimetti|fai vedere)/.test(visibility[1]) }];
  }
  const move = text.match(/^(?:metti|sposta|porta)\s+(?:la sezione\s+)?(.+?)\s+(in alto|in cima|per prim[aoie]|all'inizio|in fondo|alla fine|per ultim[aoie]|piu su|piu in alto|piu giu|piu in basso)$/);
  if (move) {
    const section = sectionOf(move[1], data);
    const where = move[2];
    const to = /alto|cima|prim|inizio/.test(where) ? (/piu/.test(where) ? 'up' : 'first') : /piu/.test(where) ? 'down' : 'last';
    if (section) return [{ op: 'moveSection', section, to }];
  }
  return null;
}
