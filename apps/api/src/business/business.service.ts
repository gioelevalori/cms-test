import { ConflictException, Injectable } from '@nestjs/common';
import { DEFAULT_LAYOUT } from '@cms/shared';
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
    return rows.map((r) => ({ ...r.business, role: r.role }));
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
        category: dto.category ?? '',
        memberships: { create: { userId, role: 'owner' } },
        pages: { create: { slug: 'home', title: 'Home', layout: DEFAULT_LAYOUT as object[] } },
      },
      select: { id: true, slug: true, name: true },
    });
  }
}
