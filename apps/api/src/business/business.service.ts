import { ConflictException, Injectable } from '@nestjs/common';
import { categoryProfile, isValidLayout, layoutFor, openStatus, resolveSite, timeIn, todayIn } from '@cms/shared';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessDataService } from './business-data.service';
import { MembershipService } from './membership.service';
import { CreateBusinessDto } from './business.dto';

@Injectable()
export class BusinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly data: BusinessDataService,
    private readonly membership: MembershipService,
  ) {}

  async listForUser(userId: string) {
    const rows = await this.prisma.membership.findMany({
      where: { userId },
      include: { business: { select: { id: true, slug: true, name: true } } },
      orderBy: { business: { name: 'asc' } },
    });
    const ids = rows.map((r) => r.business.id);
    const [pending, applied, timezones] = await Promise.all([
      this.prisma.change.groupBy({ by: ['businessId'], where: { businessId: { in: ids }, status: 'proposed' }, _count: true }),
      this.prisma.change.groupBy({ by: ['businessId'], where: { businessId: { in: ids }, status: 'applied' }, _max: { appliedAt: true } }),
      this.prisma.business.findMany({ where: { id: { in: ids } }, select: { id: true, timezone: true } }),
    ]);
    // Per la pagina "Le tue attività": com'è il sito, se è aperto adesso, cosa aspetta una conferma.
    return Promise.all(rows.map(async (r) => {
      const data = await this.data.load(r.business.id);
      const timezone = timezones.find((t) => t.id === r.business.id)?.timezone ?? 'Europe/Rome';
      const site = resolveSite(data);
      return {
        ...r.business,
        role: r.role,
        category: data.category,
        categoryLabel: categoryProfile(data.category).label,
        logo: data.logo ?? null,
        cover: data.cover ?? null,
        accent: site.accent,
        look: site.look,
        status: openStatus(data, todayIn(timezone), timeIn(timezone)),
        items: data.catalog.length,
        photos: (data.photos ?? []).length,
        pending: pending.find((p) => p.businessId === r.business.id)?._count ?? 0,
        updatedAt: applied.find((a) => a.businessId === r.business.id)?._max.appliedAt ?? null,
      };
    }));
  }

  async get(userId: string, businessId: string) {
    const role = await this.membership.roleOf(userId, businessId);
    const b = await this.prisma.business.findUniqueOrThrow({ where: { id: businessId }, select: { id: true, slug: true, timezone: true, theme: true } });
    return { ...b, role, data: await this.data.load(businessId) };
  }

  async create(userId: string, dto: CreateBusinessDto) {
    if (await this.prisma.business.findUnique({ where: { slug: dto.slug } })) throw new ConflictException('Slug già in uso');
    return this.prisma.business.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        category: dto.category ?? 'other',
        memberships: { create: { userId, role: 'owner' } },
        pages: { create: { slug: 'home', title: 'Home', layout: layoutFor(dto.category ?? 'other') as object[] } },
      },
      select: { id: true, slug: true, name: true },
    });
  }

  /**
   * Cambia il tipo di attività (solo costruttore). Se la sezione con voci e prezzi ha ancora
   * il titolo predefinito del vecchio tipo, prende quello del nuovo ("Menu" → "Servizi").
   */
  async setCategory(userId: string, businessId: string, category: string) {
    await this.membership.requireStructureRole(userId, businessId);
    const before = await this.prisma.business.findUniqueOrThrow({ where: { id: businessId }, select: { category: true } });
    const oldTitle = categoryProfile(before.category).catalogTitle;
    const newTitle = categoryProfile(category).catalogTitle;
    await this.prisma.$transaction(async (db) => {
      await db.business.update({ where: { id: businessId }, data: { category } });
      for (const page of await db.page.findMany({ where: { businessId } })) {
        if (!isValidLayout(page.layout)) continue;
        const layout = page.layout.map((b) =>
          b.type === 'catalog' && (b.options.title === oldTitle || b.options.title === 'Menu') ? { ...b, options: { ...b.options, title: newTitle } } : b,
        );
        await db.page.update({ where: { id: page.id }, data: { layout: layout as object[] } });
      }
    });
    return { category };
  }
}
