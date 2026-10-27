import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { BusinessData, PostKind, Weekday } from '@cms/shared';
import { PrismaService } from '../prisma/prisma.service';

type Tx = Prisma.TransactionClient;

/**
 * Legge e scrive i dati dell'attività come un unico oggetto BusinessData.
 * Le modifiche passano tutte da applyOps (pacchetto shared) e vengono salvate qui.
 */
@Injectable()
export class BusinessDataService {
  constructor(private readonly prisma: PrismaService) {}

  async load(businessId: string, tx: Tx = this.prisma): Promise<BusinessData> {
    const b = await tx.business.findUnique({
      where: { id: businessId },
      include: {
        openingHours: { orderBy: [{ weekday: 'asc' }, { opens: 'asc' }] },
        specialHours: { orderBy: { date: 'asc' } },
        catalog: { orderBy: { position: 'asc' } },
        posts: { orderBy: { position: 'asc' } },
      },
    });
    if (!b) throw new NotFoundException('Attività non trovata');
    return {
      name: b.name,
      category: b.category,
      description: b.description,
      phone: b.phone,
      email: b.email,
      address: b.address,
      openingHours: b.openingHours.map((h) => ({ weekday: h.weekday as Weekday, opens: h.opens, closes: h.closes })),
      specialHours: b.specialHours.map((s) => ({ date: s.date, closed: s.closed, opens: s.opens, closes: s.closes, note: s.note })),
      catalog: b.catalog.map((i) => ({ id: i.id, section: i.section, name: i.name, description: i.description, price: i.price, available: i.available })),
      posts: b.posts.map((p) => ({ id: p.id, kind: p.kind as PostKind, title: p.title, body: p.body, startsAt: p.startsAt, endsAt: p.endsAt })),
    };
  }

  /** Sostituisce i dati dell'attività con quelli indicati. Da chiamare dentro una transazione. */
  async save(tx: Tx, businessId: string, data: BusinessData): Promise<void> {
    await tx.business.update({
      where: { id: businessId },
      data: { name: data.name, category: data.category, description: data.description, phone: data.phone, email: data.email, address: data.address },
    });
    await tx.openingHours.deleteMany({ where: { businessId } });
    await tx.specialHours.deleteMany({ where: { businessId } });
    await tx.catalogItem.deleteMany({ where: { businessId } });
    await tx.post.deleteMany({ where: { businessId } });
    await tx.openingHours.createMany({ data: data.openingHours.map((h) => ({ businessId, ...h })) });
    await tx.specialHours.createMany({ data: data.specialHours.map((s) => ({ businessId, ...s })) });
    await tx.catalogItem.createMany({ data: data.catalog.map((i, position) => ({ businessId, position, ...i })) });
    await tx.post.createMany({ data: data.posts.map((p, position) => ({ businessId, position, ...p })) });
  }
}
