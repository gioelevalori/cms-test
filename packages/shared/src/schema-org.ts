import type { BusinessData, CatalogItem } from './types';
import { categoryProfile } from './categories';

const DAY_URI: Record<number, string> = {
  1: 'https://schema.org/Monday',
  2: 'https://schema.org/Tuesday',
  3: 'https://schema.org/Wednesday',
  4: 'https://schema.org/Thursday',
  5: 'https://schema.org/Friday',
  6: 'https://schema.org/Saturday',
  7: 'https://schema.org/Sunday',
};

/** Dati strutturati schema.org (JSON-LD) per i motori di ricerca, generati dai dati dell'attività. */
export function toSchemaOrg(data: BusinessData, url: string): Record<string, unknown> {
  const openingHoursSpecification = [
    ...data.openingHours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAY_URI[h.weekday],
      opens: h.opens,
      closes: h.closes,
    })),
    ...data.specialHours.map((s) => ({
      '@type': 'OpeningHoursSpecification',
      validFrom: s.date,
      validThrough: s.date,
      opens: s.closed ? '00:00' : s.opens,
      closes: s.closed ? '00:00' : s.closes,
    })),
  ];

  const profile = categoryProfile(data.category);
  const sections = [...new Set(data.catalog.map((i) => i.section))];
  const offer = (i: CatalogItem) => (i.price !== null ? { '@type': 'Offer', price: i.price.toFixed(2), priceCurrency: 'EUR' } : undefined);
  const available = (section: string) => data.catalog.filter((i) => i.section === section && i.available);

  // Chi serve cibo e bevande ha un menu; gli altri un catalogo di prodotti e servizi.
  const menu = data.catalog.length && profile.catalogKind === 'menu'
    ? {
        '@type': 'Menu',
        hasMenuSection: sections.map((section) => ({
          '@type': 'MenuSection',
          name: section,
          hasMenuItem: available(section).map((i) => ({
            '@type': 'MenuItem',
            name: i.name,
            description: i.description || undefined,
            offers: offer(i),
          })),
        })),
      }
    : undefined;
  const offerCatalog = data.catalog.length && profile.catalogKind === 'offers'
    ? {
        '@type': 'OfferCatalog',
        name: profile.catalogTitle,
        itemListElement: sections.map((section) => ({
          '@type': 'OfferCatalog',
          name: section,
          itemListElement: available(section).map((i) => ({
            ...(offer(i) ?? { '@type': 'Offer' }),
            itemOffered: { '@type': profile.id === 'shop' ? 'Product' : 'Service', name: i.name, description: i.description || undefined },
          })),
        })),
      }
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': profile.schemaType,
    name: data.name,
    description: data.description || undefined,
    url,
    telephone: data.phone || undefined,
    email: data.email || undefined,
    address: data.address || undefined,
    openingHoursSpecification,
    hasMenu: menu,
    hasOfferCatalog: offerCatalog,
  };
}
