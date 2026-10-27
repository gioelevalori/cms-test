import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { canEditStructure, type Role } from '@cms/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteDto, UpdateSiteDto } from './sites.dto';

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ruolo dell'utente sul sito; lancia 404 se non è membro (non riveliamo che il sito esiste). */
  async roleOf(userId: string, siteId: string): Promise<Role> {
    const m = await this.prisma.membership.findUnique({ where: { userId_siteId: { userId, siteId } } });
    if (!m) throw new NotFoundException('Sito non trovato');
    return m.role;
  }

  async requireStructureRole(userId: string, siteId: string): Promise<Role> {
    const role = await this.roleOf(userId, siteId);
    if (!canEditStructure(role)) throw new ForbiddenException('Permessi insufficienti');
    return role;
  }

  async listForUser(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { site: true },
      orderBy: { site: { name: 'asc' } },
    });
    return memberships.map((m) => ({ ...m.site, role: m.role }));
  }

  async create(userId: string, dto: CreateSiteDto) {
    return this.prisma.site.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        locale: dto.locale ?? 'it',
        memberships: { create: { userId, role: 'owner' } },
      },
    });
  }

  async get(userId: string, siteId: string) {
    const role = await this.roleOf(userId, siteId);
    const site = await this.prisma.site.findUniqueOrThrow({ where: { id: siteId } });
    return { ...site, role };
  }

  async update(userId: string, siteId: string, dto: UpdateSiteDto) {
    await this.requireStructureRole(userId, siteId);
    return this.prisma.site.update({
      where: { id: siteId },
      data: { name: dto.name, theme: dto.theme as object | undefined },
    });
  }
}
