import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBusiness } from '../../../lib/api';
import { Blocks } from '../../../components/Blocks';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ site: string; slug?: string[] }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { site } = await params;
  const business = await getBusiness(site);
  if (!business) return {};
  return { title: business.data.name, description: business.data.description || undefined };
}

export default async function SitePage({ params }: Params) {
  const { site, slug } = await params;
  const business = await getBusiness(site);
  if (!business) notFound();

  const pageSlug = slug?.join('/') || 'home';
  const page = business.pages.find((p) => p.slug === pageSlug);
  if (!page) notFound();

  const style = { '--primary': business.theme.primary ?? '#c2410c' } as CSSProperties;
  return (
    <main style={style}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(business.schemaOrg).replace(/</g, '\\u003c') }} />
      <Blocks layout={page.layout} data={business.data} timezone={business.timezone} />
      <footer>© {business.data.name}</footer>
    </main>
  );
}
