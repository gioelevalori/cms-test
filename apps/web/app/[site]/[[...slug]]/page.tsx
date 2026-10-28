import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resolveSite } from '@cms/shared';
import { getBusiness } from '../../../lib/api';
import { Site } from '../../../components/Site';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ site: string; slug?: string[] }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { site } = await params;
  const business = await getBusiness(site);
  if (!business) return {};
  const { tagline } = resolveSite(business.data);
  return {
    title: tagline ? `${business.data.name} · ${tagline}` : business.data.name,
    description: business.data.description || tagline || undefined,
    openGraph: business.data.cover ? { images: [business.data.cover] } : undefined,
  };
}

export default async function SitePage({ params }: Params) {
  const { site, slug } = await params;
  const business = await getBusiness(site);
  if (!business) notFound();

  // Il sito è una pagina sola: gli altri indirizzi non esistono.
  if (slug?.length && slug.join('/') !== 'home') notFound();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(business.schemaOrg).replace(/</g, '\\u003c') }} />
      <Site data={business.data} timezone={business.timezone} />
    </>
  );
}
