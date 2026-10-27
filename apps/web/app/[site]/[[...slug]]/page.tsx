import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicPage } from '../../../lib/api';
import { Blocks } from '../../../components/Blocks';

interface Params {
  params: Promise<{ site: string; slug?: string[] }>;
}

const pageSlugOf = (slug?: string[]) => (slug && slug.length > 0 ? slug.join('/') : 'home');

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { site, slug } = await params;
  const page = await getPublicPage(site, pageSlugOf(slug));
  if (!page) return {};
  return {
    title: page.slug === 'home' ? page.site.name : `${page.title} | ${page.site.name}`,
    description: page.seo.description,
  };
}

export default async function SitePage({ params }: Params) {
  const { site, slug } = await params;
  const page = await getPublicPage(site, pageSlugOf(slug));
  if (!page) notFound();

  const style = { '--primary': page.site.theme.primary ?? '#c2410c' } as CSSProperties;
  return (
    <main style={style}>
      <Blocks blocks={page.blocks} />
    </main>
  );
}
