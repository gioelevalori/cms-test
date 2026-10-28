import type { BusinessData, OpeningHours, Weekday } from '@cms/shared';

/** Attività d'esempio della demo: tutte inventate, di settori diversi. */
/** Foto Unsplash a licenza gratuita: id dell'immagine, pagina d'origine e autore. */
export interface Photo {
  id: string;
  alt: string;
  author: string;
  page: string;
}

export interface SampleBusiness {
  id: string;
  /** Nome breve per il tabellone. */
  short: string;
  sector: string;
  domain: string;
  /** Titolo della sezione catalogo sul sito (menu, servizi, prodotti, corsi). */
  catalogTitle: string;
  /** Colore del sito d'esempio: ogni attività ha il suo. */
  accent: string;
  /** Frase breve sotto il nome, nell'intestazione del sito. */
  tagline: string;
  /** Stile del sito d'esempio: ognuno è fatto come da un grafico diverso. */
  look: 'atelier' | 'bottega' | 'trattoria' | 'clinica' | 'energia';
  /** Foto da Unsplash (licenza gratuita): id della foto e testo alternativo. */
  photos: { hero: Photo; gallery: Photo[] };
  galleryTitle: string;
  /** Tre punti di forza mostrati sotto l'hero del sito. */
  highlights: string[];
  examples: string[];
  data: BusinessData;
}

const week = (days: Weekday[], slots: [string, string][]): OpeningHours[] =>
  days.flatMap((weekday) => slots.map(([opens, closes]) => ({ weekday, opens, closes })));

export const SAMPLES: SampleBusiness[] = [
  {
    id: 'salone-giulia',
    short: 'Salone Giulia',
    sector: 'Parrucchiere',
    domain: 'salonegiulia.example',
    catalogTitle: 'Servizi',
    accent: '#a3305f',
    tagline: 'Parrucchiera a Pescara',
    look: 'atelier',
    galleryTitle: 'Il salone',
    highlights: ['Su appuntamento, anche su WhatsApp', 'Colori senza ammoniaca', 'Parcheggio in Corso Umberto'],
    photos: {
      hero: { id: '1580618672591-eb180b1a973f', alt: 'Una parrucchiera asciuga i capelli di una cliente con phon e spazzola', author: 'Adam Winger', page: 'https://unsplash.com/photos/FkAZqQJTbXM' },
      gallery: [
        { id: '1633681926022-84c23e8cb2d6', alt: 'Il salone con poltrone nere, specchi rotondi e un muro di mattoni', author: 'Benyamin Bohlouli', page: 'https://unsplash.com/photos/LGXN4OSQSa4' },
        { id: '1560869713-7d0a29430803', alt: 'Mani che arricciano una ciocca di capelli', author: 'Baylee Gramling', page: 'https://unsplash.com/photos/MMz03PyCOZg' },
        { id: '1595475884562-073c30d45670', alt: 'Spazzole, forbici e pennello per il colore', author: 'Adam Winger', page: 'https://unsplash.com/photos/KVVjmb3IIL8' },
      ],
    },
    examples: [
      'La piega costa 25 euro',
      'Sabato chiudiamo alle 15',
      'Aggiungi trattamento cheratina a 60 euro nella sezione trattamenti',
      'Dal 10 al 20 agosto chiusi per ferie',
      'Il lunedì siamo chiusi',
    ],
    data: {
      name: 'Salone Giulia',
      category: 'hairdresser',
      description: 'Taglio, colore e trattamenti su appuntamento, nel centro di Pescara.',
      phone: '085 111111',
      email: 'ciao@salonegiulia.example',
      address: 'Corso Umberto 12, Pescara',
      openingHours: week([2, 3, 4, 5, 6], [['09:00', '19:00']]),
      specialHours: [],
      catalog: [
        { id: 'sg-taglio', section: 'Taglio e piega', name: 'Taglio donna', description: 'Shampoo, taglio e piega', price: 35, available: true },
        { id: 'sg-piega', section: 'Taglio e piega', name: 'Piega', description: 'Corta o lunga', price: 22, available: true },
        { id: 'sg-uomo', section: 'Taglio e piega', name: 'Taglio uomo', description: '', price: 18, available: true },
        { id: 'sg-colore', section: 'Colore', name: 'Colore', description: 'Tinta completa', price: 55, available: true },
        { id: 'sg-balayage', section: 'Colore', name: 'Balayage', description: 'Schiariture sfumate a mano', price: 90, available: true },
      ],
      posts: [{ id: 'sg-post', kind: 'news', title: 'Prenota su WhatsApp', body: 'Scrivici giorno e servizio, ti confermiamo l\'orario.', startsAt: null, endsAt: null }],
    },
  },
  {
    id: 'ferramenta-rossi',
    short: 'Ferramenta Rossi',
    sector: 'Negozio',
    domain: 'ferramentarossi.example',
    catalogTitle: 'Prodotti',
    accent: '#b4441a',
    tagline: 'Ferramenta e colori dal 1972',
    look: 'bottega',
    galleryTitle: 'In negozio',
    highlights: ['Consegna in giornata in paese', 'Colori miscelati al momento', 'Duplicazione chiavi'],
    photos: {
      hero: { id: '1759200165738-6366977a73c6', alt: 'Parete del negozio piena di utensili e ferramenta', author: 'Darien Attridge', page: 'https://unsplash.com/photos/ciY4tc7539I' },
      gallery: [
        { id: '1602052793312-b99c2a9ee797', alt: 'Martello, pinze e guanti da lavoro appesi a un pannello forato', author: 'Mitchell Luo', page: 'https://unsplash.com/photos/G5i9LQ7sPOw' },
        { id: '1765744893064-dce3184289ef', alt: 'Scaffali in legno pieni di scatole con una scala', author: 'Artem Korolev', page: 'https://unsplash.com/photos/UHXBNCK7Hu4' },
        { id: '1631856954913-c751a44490ec', alt: 'Scaffale con tanti articoli diversi', author: 'Oxana Melis', page: 'https://unsplash.com/photos/KzT5IWf0yHQ' },
      ],
    },
    examples: [
      'Domani siamo chiusi per inventario',
      'Il trapano a batteria è finito',
      'Le viti da legno costano 4 euro',
      'Il sabato apriamo dalle 8 alle 13',
      'Evento il 15 novembre: dimostrazione di verniciatura',
    ],
    data: {
      name: 'Ferramenta Rossi',
      category: 'store',
      description: 'Ferramenta, colori e casalinghi dal 1972. Consegna in giornata in paese.',
      phone: '085 222222',
      email: 'info@ferramentarossi.example',
      address: 'Via Garibaldi 40, Montesilvano',
      openingHours: [...week([1, 2, 3, 4, 5], [['08:00', '12:30'], ['15:00', '19:00']]), ...week([6], [['08:00', '12:30']])],
      specialHours: [],
      catalog: [
        { id: 'fr-trapano', section: 'Utensili', name: 'Trapano a batteria', description: '18 V, due batterie', price: 89, available: true },
        { id: 'fr-set', section: 'Utensili', name: 'Set cacciaviti', description: '12 pezzi', price: 15, available: true },
        { id: 'fr-viti', section: 'Minuteria', name: 'Viti da legno', description: 'Scatola da 200', price: 3.5, available: true },
        { id: 'fr-vernice', section: 'Colori', name: 'Vernice per esterni', description: 'Latta da 2,5 litri', price: 28, available: true },
      ],
      posts: [],
    },
  },
  {
    id: 'pizzeria-mario',
    short: 'Pizzeria da Mario',
    sector: 'Ristorante',
    domain: 'pizzeriadamario.example',
    catalogTitle: 'Menu',
    accent: '#a61e22',
    tagline: 'Pizzeria con forno a legna',
    look: 'trattoria',
    galleryTitle: 'Dal forno',
    highlights: ['Forno a legna', 'Impasto a lunga lievitazione', 'Anche da asporto'],
    photos: {
      hero: { id: '1622880833523-7cf1c0bd4296', alt: 'Pizza appena sfornata davanti alla fiamma del forno a legna', author: 'Fabrizio Pullara', page: 'https://unsplash.com/photos/vHRFraV4U00' },
      gallery: [
        { id: '1564936281403-f92f66f89ee0', alt: 'Il forno a legna acceso', author: 'Louis Hansel', page: 'https://unsplash.com/photos/W75bFvPPrK8' },
        { id: '1579751626657-72bc17010498', alt: 'Pizza su un tagliere di legno', author: 'Nik Owens', page: 'https://unsplash.com/photos/40OJLYVWeeM' },
        { id: '1606152196365-d1ce5ea838b5', alt: 'Fiamme nel forno con una pizza in cottura', author: 'Klara Kulikova', page: 'https://unsplash.com/photos/RsiNFKMvqtg' },
      ],
    },
    examples: [
      'Sabato chiudiamo alle 15',
      'La carbonara è finita',
      'La margherita costa 7 euro',
      'Aggiungi la diavola a 8 euro nella sezione pizze',
      'Evento il 12 dicembre: serata jazz dal vivo',
    ],
    data: {
      name: 'Pizzeria da Mario',
      category: 'restaurant',
      description: 'Pizzeria di famiglia con forno a legna, nel centro storico dal 1985.',
      phone: '085 000000',
      email: 'info@pizzeriadamario.example',
      address: 'Via Roma 1, Penne (PE)',
      openingHours: [...week([2, 3, 4, 5], [['19:00', '23:30']]), ...week([6, 7], [['12:00', '14:30'], ['19:00', '23:30']])],
      specialHours: [],
      catalog: [
        { id: 'item-margherita', section: 'Pizze', name: 'Margherita', description: 'Pomodoro, mozzarella, basilico', price: 6, available: true },
        { id: 'item-marinara', section: 'Pizze', name: 'Marinara', description: 'Pomodoro, aglio, origano', price: 5, available: true },
        { id: 'item-carbonara', section: 'Primi', name: 'Carbonara', description: 'Guanciale, uovo, pecorino', price: 11, available: true },
        { id: 'item-tiramisu', section: 'Dolci', name: 'Tiramisù', description: 'Fatto in casa', price: 5, available: true },
      ],
      posts: [],
    },
  },
  {
    id: 'studio-bianchi',
    short: 'Studio Bianchi',
    sector: 'Studio professionale',
    domain: 'studiobianchi.example',
    catalogTitle: 'Prestazioni',
    accent: '#0e6b62',
    tagline: 'Fisioterapia e riabilitazione',
    look: 'clinica',
    galleryTitle: 'Lo studio',
    highlights: ['Su appuntamento', 'Prima visita con valutazione', 'Fattura per detrazione'],
    photos: {
      hero: { id: '1645005512968-0c1fe99f0093', alt: 'Una fisioterapista tratta la spalla di un paziente', author: 'Sincerely Media', page: 'https://unsplash.com/photos/wGFibXDQlBI' },
      gallery: [
        { id: '1649751361457-01d3a696c7e6', alt: 'Valutazione del ginocchio di un paziente sul lettino', author: 'yury kirillov', page: 'https://unsplash.com/photos/pbUWW-CBoqY' },
        { id: '1768507423533-b87b62769758', alt: 'Trattamento manuale della parte alta della schiena', author: 'Julius Toltesi', page: 'https://unsplash.com/photos/ZzkNkbUxFMc' },
        { id: '1586401100295-7a8096fd231a', alt: 'Esercizi di riabilitazione con piccoli manubri', author: 'Juls P', page: 'https://unsplash.com/photos/lB6lbkbe1XA' },
      ],
    },
    examples: [
      'Dal 10 al 20 agosto chiusi per ferie',
      'Il venerdì chiudiamo alle 13',
      'La seduta di fisioterapia costa 50 euro',
      'Aggiungi linfodrenaggio a 45 euro',
      'Domani apriamo alle 10',
    ],
    data: {
      name: 'Studio Bianchi',
      category: 'physiotherapy',
      description: 'Fisioterapia e riabilitazione su appuntamento. Dott.ssa Anna Bianchi.',
      phone: '085 333333',
      email: 'segreteria@studiobianchi.example',
      address: 'Viale Europa 8, Chieti',
      openingHours: week([1, 2, 3, 4, 5], [['09:00', '18:00']]),
      specialHours: [],
      catalog: [
        { id: 'sb-visita', section: 'Prestazioni', name: 'Prima visita', description: 'Valutazione e piano di trattamento', price: 60, available: true },
        { id: 'sb-seduta', section: 'Prestazioni', name: 'Seduta di fisioterapia', description: '45 minuti', price: 45, available: true },
        { id: 'sb-tecar', section: 'Prestazioni', name: 'Tecarterapia', description: '', price: 35, available: true },
      ],
      posts: [],
    },
  },
  {
    id: 'palestra-move',
    short: 'Palestra Move',
    sector: 'Palestra',
    domain: 'palestramove.example',
    catalogTitle: 'Prezzi',
    accent: '#3b3fb6',
    tagline: 'Palestra e corsi a Francavilla',
    look: 'energia',
    galleryTitle: 'La palestra',
    highlights: ['Prima lezione gratuita', 'Aperta fino alle 22', 'Personal trainer in sala'],
    photos: {
      hero: { id: '1689877020200-403d8542d95d', alt: 'La sala pesi con macchine e manubri', author: 'Rick Barrett', page: 'https://unsplash.com/photos/1RNQ11ZODJM' },
      gallery: [
        { id: '1517836357463-d25dfeac3438', alt: 'Stacco da terra con bilanciere', author: 'Victor Freitas', page: 'https://unsplash.com/photos/WvDYdXDzkhs' },
        { id: '1758875569612-94d5e0f1a35f', alt: 'Allenamento con le corde in sala', author: 'Vitaly Gariev', page: 'https://unsplash.com/photos/-JWETyt2GdU' },
        { id: '1761839258420-5c3e2f2e2a74', alt: 'Una donna solleva il bilanciere', author: "Land O'Lakes, Inc.", page: 'https://unsplash.com/photos/IYLLF511aOY' },
      ],
    },
    examples: [
      'Aggiungi pilates a 40 euro nella sezione corsi',
      "L'abbonamento mensile costa 45 euro",
      'Domenica apriamo dalle 9 alle 13',
      'Evento il 30 novembre: open day gratuito',
      'Il corso di spinning è finito',
    ],
    data: {
      name: 'Palestra Move',
      category: 'gym',
      description: 'Sala pesi, corsi e personal training. Prima lezione di prova gratuita.',
      phone: '085 444444',
      email: 'info@palestramove.example',
      address: 'Via dello Sport 3, Francavilla al Mare',
      openingHours: [...week([1, 2, 3, 4, 5], [['07:00', '22:00']]), ...week([6], [['09:00', '18:00']])],
      specialHours: [],
      catalog: [
        { id: 'pm-mensile', section: 'Abbonamenti', name: 'Abbonamento mensile', description: 'Sala pesi e corsi', price: 40, available: true },
        { id: 'pm-annuale', section: 'Abbonamenti', name: 'Abbonamento annuale', description: '', price: 380, available: true },
        { id: 'pm-spinning', section: 'Corsi', name: 'Corso di spinning', description: 'Martedì e giovedì alle 19', price: 30, available: true },
        { id: 'pm-yoga', section: 'Corsi', name: 'Yoga', description: 'Lunedì e mercoledì alle 18', price: 30, available: true },
      ],
      posts: [],
    },
  },
];
