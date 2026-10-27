import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { toSchemaOrg } from '@cms/shared';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessDataService } from '../business/business-data.service';

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
    const business = await this.prisma.business.findUnique({
      where: { slug },
      select: { id: true, slug: true, theme: true, timezone: true, pages: { select: { slug: true, title: true, layout: true } } },
    });
    if (!business) throw new NotFoundException('Attività non trovata');
    const data = await this.data.load(business.id);
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
