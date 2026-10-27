import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { canEditStructure, findClientViolations, type Block } from '@cms/shared';
import { PrismaService } from '../prisma/prisma.service';
import { SitesService } from '../sites/sites.service';
import { CreatePageDto } from './pages.dto';
import { parseBlocks } from './block-validation';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService, private readonly sites: SitesService) {}

  async list(userId: string, siteId: string) {
    await this.sites.roleOf(userId, siteId);
    return this.prisma.page.findMany({
      where: { siteId },
      select: { id: true, slug: true, title: true, status: true, updatedAt: true, publishedAt: true },
      orderBy: { title: 'asc' },
    });
  }

  async create(userId: string, siteId: string, dto: CreatePageDto) {
    await this.sites.requireStructureRole(userId, siteId);
    return this.prisma.page.create({ data: { siteId, title: dto.title, slug: dto.slug } });
  }

  async get(userId: string, siteId: string, pageId: string) {
    const role = await this.sites.roleOf(userId, siteId);
    const page = await this.findPage(siteId, pageId);
    return { ...page, role };
  }

  /**
   * Salva la bozza. Per un "client" il server confronta con la bozza attuale
   * e rifiuta qualsiasi modifica non permessa dal blocco del design.
   */
  async saveDraft(userId: string, siteId: string, pageId: string, rawBlocks: unknown[]) {
    const role = await this.sites.roleOf(userId, siteId);
    const page = await this.findPage(siteId, pageId);
    const blocks = parseBlocks(rawBlocks);

    if (!canEditStructure(role)) {
      const violations = findClientViolations(page.draft as unknown as Block[], blocks);
      if (violations.length > 0) {
        throw new ForbiddenException({ message: 'Modifica non permessa', violations });
      }
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.page.update({ where: { id: pageId }, data: { draft: blocks as object[] } }),
      this.prisma.pageRevision.create({ data: { pageId, authorId: userId, blocks: blocks as object[] } }),
    ]);
    return updated;
  }

  async publish(userId: string, siteId: string, pageId: string) {
    await this.sites.roleOf(userId, siteId);
    const page = await this.findPage(siteId, pageId);
    return this.prisma.page.update({
      where: { id: pageId },
      data: { published: page.draft as object[], status: 'published', publishedAt: new Date() },
    });
  }

  async revisions(userId: string, siteId: string, pageId: string) {
    await this.sites.roleOf(userId, siteId);
    await this.findPage(siteId, pageId);
    return this.prisma.pageRevision.findMany({
      where: { pageId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, createdAt: true, author: { select: { name: true } } },
    });
  }

  /** Lettura pubblica per il sito Next.js: solo pagine pubblicate, nessuna bozza. */
  async getPublic(siteSlug: string, pageSlug: string) {
    const page = await this.prisma.page.findFirst({
      where: { slug: pageSlug, status: 'published', site: { slug: siteSlug } },
      select: { title: true, slug: true, published: true, seo: true, site: { select: { name: true, theme: true, locale: true } } },
    });
    if (!page) throw new NotFoundException('Pagina non trovata');
    return { title: page.title, slug: page.slug, blocks: page.published, seo: page.seo, site: page.site };
  }

  private async findPage(siteId: string, pageId: string) {
    const page = await this.prisma.page.findFirst({ where: { id: pageId, siteId } });
    if (!page) throw new NotFoundException('Pagina non trovata');
    return page;
  }
}
