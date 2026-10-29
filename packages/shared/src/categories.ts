import type { BusinessData } from './types';

/**
 * Profilo di un tipo di attività: come si chiamano le sue sezioni, che tipo è per Google
 * e quali messaggi d'esempio suggerire al titolare. Gli esempi funzionano anche su
 * un'attività appena creata (il test li fa passare tutti dall'interprete).
 */
export interface CategoryProfile {
  id: string;
  label: string;
  /** Tipo schema.org dell'attività. */
  schemaType: string;
  /** "menu" per chi serve cibo e bevande, "offers" per prodotti e servizi. */
  catalogKind: 'menu' | 'offers';
  /** Titolo della sezione del sito con voci e prezzi. */
  catalogTitle: string;
  /** Pulsante in cima al sito che porta alla sezione con voci e prezzi. */
  catalogCta: string;
  /** Sezione usata quando si aggiunge una voce senza dire dove. */
  defaultSection: string;
  /** Messaggi d'esempio, dal più utile. */
  examples: string[];
}

export const CATEGORIES: CategoryProfile[] = [
  {
    id: 'restaurant',
    label: 'Ristorante o pizzeria',
    schemaType: 'Restaurant',
    catalogKind: 'menu',
    catalogTitle: 'Menu',
    catalogCta: 'Guarda il menu',
    defaultSection: 'Piatti',
    examples: [
      'Sabato chiudiamo alle 15',
      'Aggiungi la diavola a 8 euro nella sezione pizze',
      'Dal 10 al 20 agosto chiusi per ferie',
      'Il lunedì siamo chiusi',
      'Evento il 12 dicembre: serata jazz dal vivo',
    ],
  },
  {
    id: 'bar',
    label: 'Bar o caffetteria',
    schemaType: 'BarOrPub',
    catalogKind: 'menu',
    catalogTitle: 'Listino',
    catalogCta: 'Guarda il listino',
    defaultSection: 'Bevande',
    examples: [
      'Domenica apriamo alle 8',
      'Aggiungi lo spritz a 5 euro nella sezione aperitivi',
      'Il sabato dalle 7 alle 2',
      'Evento il 15 novembre: aperitivo con dj set',
      'Dal 24 al 26 dicembre chiusi per ferie',
    ],
  },
  {
    id: 'shop',
    label: 'Negozio',
    schemaType: 'Store',
    catalogKind: 'offers',
    catalogTitle: 'Prodotti',
    catalogCta: 'Guarda i prodotti',
    defaultSection: 'Prodotti',
    examples: [
      'Sabato orario continuato dalle 9 alle 19',
      'Aggiungi la borsa in pelle a 89 euro nella sezione accessori',
      'Offerta: saldi del 30% su tutta la collezione estiva',
      'Dal 15 al 20 agosto chiusi per ferie',
      'Il nuovo numero di telefono è 085 123456',
    ],
  },
  {
    id: 'beauty',
    label: 'Parrucchiere o estetista',
    schemaType: 'BeautySalon',
    catalogKind: 'offers',
    catalogTitle: 'Trattamenti',
    catalogCta: 'Guarda i trattamenti',
    defaultSection: 'Trattamenti',
    examples: [
      'Aggiungi taglio e piega a 35 euro nella sezione donna',
      'Sabato chiudiamo alle 13',
      'Il martedì dalle 9 alle 19',
      'Offerta: manicure a 15 euro per tutto il mese',
      'Dal 10 al 17 agosto chiusi per ferie',
    ],
  },
  {
    id: 'gym',
    label: 'Palestra o centro sportivo',
    schemaType: 'ExerciseGym',
    catalogKind: 'offers',
    catalogTitle: 'Prezzi',
    catalogCta: 'Guarda i prezzi',
    defaultSection: 'Abbonamenti',
    examples: [
      'Aggiungi abbonamento mensile a 45 euro nella sezione abbonamenti',
      'La domenica dalle 9 alle 13',
      'Domani chiudiamo alle 18',
      'Evento il 20 novembre: lezione di prova gratuita',
      'Dal 13 al 16 agosto chiusi per ferie',
    ],
  },
  {
    id: 'insurance',
    label: 'Agenzia assicurativa',
    schemaType: 'InsuranceAgency',
    catalogKind: 'offers',
    catalogTitle: 'Servizi',
    catalogCta: 'Guarda i servizi',
    defaultSection: 'Polizze',
    examples: [
      'Aggiungi polizza casa nella sezione polizze',
      'Il sabato siamo chiusi',
      'Offerta: sconto del 10% sulla RC auto fino a fine anno',
      'Dal 23 dicembre al 2 gennaio chiusi',
      'Nuovo indirizzo: Corso Italia 10 Pescara',
    ],
  },
  {
    id: 'lawyer',
    label: 'Studio legale',
    schemaType: 'Attorney',
    catalogKind: 'offers',
    catalogTitle: 'Servizi',
    catalogCta: 'Guarda i servizi',
    defaultSection: 'Servizi',
    examples: [
      'Aggiungi consulenza iniziale a 60 euro nella sezione consulenze',
      'Il venerdì dalle 9 alle 13',
      'Avviso: lo studio riceve solo su appuntamento',
      'Dal 9 al 23 agosto chiusi per ferie',
      'La nuova email è studio@esempio.it',
    ],
  },
  {
    id: 'doctor',
    label: 'Studio medico o dentista',
    schemaType: 'MedicalClinic',
    catalogKind: 'offers',
    catalogTitle: 'Prestazioni',
    catalogCta: 'Guarda le prestazioni',
    defaultSection: 'Visite',
    examples: [
      'Aggiungi visita cardiologica a 120 euro nella sezione visite',
      'Giovedì lo studio è chiuso',
      'Il mercoledì dalle 15 alle 19',
      'Avviso: vaccino antinfluenzale da novembre su prenotazione',
      'Dal 10 al 24 agosto chiusi per ferie',
    ],
  },
  {
    id: 'professional',
    label: 'Studio professionale',
    schemaType: 'ProfessionalService',
    catalogKind: 'offers',
    catalogTitle: 'Servizi',
    catalogCta: 'Guarda i servizi',
    defaultSection: 'Servizi',
    examples: [
      'Aggiungi dichiarazione dei redditi a 150 euro nella sezione fisco',
      'Venerdì chiudiamo alle 13',
      'Avviso: scadenza IMU il 16 dicembre',
      'Dal 10 al 21 agosto chiusi per ferie',
      'Il nuovo numero di telefono è 085 654321',
    ],
  },
  {
    id: 'other',
    label: 'Altro',
    schemaType: 'LocalBusiness',
    catalogKind: 'offers',
    catalogTitle: 'Servizi',
    catalogCta: 'Guarda i servizi',
    defaultSection: 'Servizi',
    examples: [
      'Sabato chiudiamo alle 13',
      'Aggiungi consulenza a 50 euro nella sezione servizi',
      'Dal 10 al 20 agosto chiusi per ferie',
      'Avviso: nuovi orari da lunedì',
      'Il nuovo numero di telefono è 085 000000',
    ],
  },
];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

/** Il profilo del tipo di attività; per un tipo sconosciuto, "Altro". */
export function categoryProfile(category: string): CategoryProfile {
  return BY_ID.get(category) ?? BY_ID.get('other')!;
}
