import { Controller, Get, Header, NotFoundException, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { toSchemaOrg, type BusinessData } from '@cms/shared';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessDataService } from '../business/business-data.service';

const BUSINESS = { id: true, slug: true, theme: true, timezone: true, pages: { select: { slug: true, title: true, layout: true } } } as const;

/** Lettura pubblica per il sito Next.js. Nessuna autenticazione, nessun dato interno. */
@Controller('public/businesses')
export class PublicController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly data: BusinessDataService,
    private readonly config: ConfigService,
  ) {}

  @Get(':slug')
  async get(@Param('slug') slug: string) {
    const business = await this.prisma.business.findUnique({ where: { slug }, select: BUSINESS });
    if (!business) throw new NotFoundException('Attività non trovata');
    return this.view(business, await this.data.load(business.id));
  }

  /**
   * Il sito come sarà se la proposta viene confermata. L'id della proposta fa da chiave:
   * chi ha il link vede solo dati destinati comunque al sito, e solo finché la proposta è in attesa.
   */
  @Get(':slug/preview/:changeId')
  @Header('X-Robots-Tag', 'noindex')
  async preview(@Param('slug') slug: string, @Param('changeId') changeId: string) {
    const business = await this.prisma.business.findUnique({ where: { slug }, select: BUSINESS });
    const change = business
      ? await this.prisma.change.findFirst({ where: { id: changeId, businessId: business.id }, select: { status: true, summary: true, after: true } })
      : null;
    if (!business || !change) throw new NotFoundException('Anteprima non trovata');
    return {
      ...this.view(business, change.after as unknown as BusinessData),
      preview: { status: change.status, summary: change.summary as string[] },
    };
  }

  private view(business: { slug: string; theme: unknown; timezone: string; pages: unknown }, data: BusinessData) {
    const siteUrl = `${this.config.get('PUBLIC_SITE_URL') ?? 'http://localhost:3001'}/${business.slug}`;
    return {
      slug: business.slug,
      theme: business.theme,
      timezone: business.timezone,
      pages: business.pages,
      data,
      schemaOrg: toSchemaOrg(data, siteUrl),
    };
  }
}
