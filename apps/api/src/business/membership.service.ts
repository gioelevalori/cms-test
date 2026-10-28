import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { canEditStructure, type Role } from '@cms/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ruolo dell'utente; 404 se non è membro, così non si rivela che l'attività esiste. */
  async roleOf(userId: string, businessId: string, db: Prisma.TransactionClient = this.prisma): Promise<Role> {
    const m = await db.membership.findUnique({ where: { userId_businessId: { userId, businessId } } });
    if (!m) throw new NotFoundException('Attività non trovata');
    return m.role;
  }

  async requireStructureRole(userId: string, businessId: string): Promise<Role> {
    const role = await this.roleOf(userId, businessId);
    if (!canEditStructure(role)) throw new ForbiddenException('Solo il costruttore può modificare pagine e tema');
    return role;
  }
}
