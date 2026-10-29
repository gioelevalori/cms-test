import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { photoUrl, resolveSite } from '@cms/shared';
import { getBusiness, getPreview } from '../../../lib/api';
import { Site } from '../../../components/Site';
import { PreviewBar } from '../../../components/PreviewBar';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ site: string; slug?: string[] }>;
}

/** Il sito è una pagina sola; l'unico altro indirizzo è l'anteprima di una proposta. */
function load(site: string, slug?: string[]) {
  if (!slug?.length || (slug.length === 1 && slug[0] === 'home')) return getBusiness(site);
  if (slug.length === 2 && slug[0] === 'anteprima') return getPreview(site, slug[1]);
  return null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { site, slug } = await params;
  const business = await load(site, slug);
  if (!business) return {};
  const { tagline } = resolveSite(business.data);
  return {
    title: business.preview ? `Anteprima · ${business.data.name}` : tagline ? `${business.data.name} · ${tagline}` : business.data.name,
    description: business.data.description || tagline || undefined,
    openGraph: business.data.cover || business.data.logo ? { images: [(business.data.cover || business.data.logo)!] } : undefined,
    icons: business.data.logo ? { icon: photoUrl(business.data.logo, { w: 96 }), apple: photoUrl(business.data.logo, { w: 180 }) } : undefined,
    robots: business.preview ? { index: false, follow: false } : undefined,
  };
}

export default async function SitePage({ params }: Params) {
  const { site, slug } = await params;
  const business = await load(site, slug);
  if (!business) notFound();

  return (
    <>
      {!business.preview && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(business.schemaOrg).replace(/</g, '\u003c') }} />
      )}
      {business.preview && <PreviewBar slug={business.slug} {...business.preview} />}
      <Site data={business.data} timezone={business.timezone} />
    </>
  );
}
