import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { applyOps, describeOp, isValidOp, todayIn, type BusinessData, type ChangeOp } from '@cms/shared';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessDataService } from '../business/business-data.service';
import { MembershipService } from '../business/membership.service';
import { InterpreterService } from '../interpreter/interpreter.service';
import { canonical } from './canonical';

const json = (v: unknown) => v as Prisma.InputJsonValue;

@Injectable()
export class ChangesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly data: BusinessDataService,
    private readonly membership: MembershipService,
    private readonly interpreter: InterpreterService,
  ) {}

  /** Messaggio in chat → modifica proposta, con anteprima. Non cambia ancora nulla. */
  async proposeFromMessage(userId: string, businessId: string, message: string) {
    await this.membership.roleOf(userId, businessId);
    const business = await this.prisma.business.findUniqueOrThrow({ where: { id: businessId }, select: { timezone: true } });
    const before = await this.data.load(businessId);
    const result = await this.interpreter.interpret(message, before, todayIn(business.timezone));

    if (result.ops.length === 0) {
      return { status: 'not_understood' as const, unrecognized: result.unrecognized, engine: result.engine };
    }
    const change = await this.createProposal(userId, businessId, 'chat', message, before, result.ops);
    return { ...change, unrecognized: result.unrecognized, engine: result.engine };
  }

  /** Modifica strutturata (pulsanti e moduli dell'admin). */
  async proposeOps(userId: string, businessId: string, ops: unknown[]) {
    await this.membership.roleOf(userId, businessId);
    if (ops.length === 0 || !ops.every(isValidOp)) throw new BadRequestException('Operazioni non valide');
    const before = await this.data.load(businessId);
    return this.createProposal(userId, businessId, 'form', null, before, ops as ChangeOp[]);
  }

  private async createProposal(userId: string, businessId: string, source: string, message: string | null, before: BusinessData, ops: ChangeOp[]) {
    let after: BusinessData;
    try {
      after = applyOps(before, ops, randomUUID);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
    const summary = ops.map((op) => describeOp(op, before));
    const change = await this.prisma.change.create({
      data: { businessId, authorId: userId, source, message, ops: json(ops), summary: json(summary), before: json(before), after: json(after) },
    });
    return this.present(change);
  }

  /** Applica la modifica, solo se nel frattempo i dati non sono cambiati. */
  async confirm(userId: string, changeId: string) {
    const change = await this.findForUser(userId, changeId);
    if (change.status !== 'proposed') throw new ConflictException('Questa modifica non è più in attesa di conferma');

    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await this.data.load(change.businessId, tx);
      if (canonical(current) !== canonical(change.before)) {
        throw new ConflictException('I dati sono cambiati dopo la proposta: invia di nuovo il messaggio');
      }
      await this.data.save(tx, change.businessId, change.after as unknown as BusinessData);
      return tx.change.update({ where: { id: change.id }, data: { status: 'applied', appliedAt: new Date() } });
    });
    return this.present(updated);
  }

  async reject(userId: string, changeId: string) {
    const change = await this.findForUser(userId, changeId);
    if (change.status !== 'proposed') throw new ConflictException('Questa modifica non è più in attesa di conferma');
    return this.present(await this.prisma.change.update({ where: { id: change.id }, data: { status: 'rejected' } }));
  }

  /** Annulla l'ultima modifica applicata, riportando i dati a com'erano prima. */
  async undo(userId: string, changeId: string) {
    const change = await this.findForUser(userId, changeId);
    if (change.status !== 'applied') throw new ConflictException('Si possono annullare solo le modifiche applicate');

    const updated = await this.prisma.$transaction(async (tx) => {
      const latest = await tx.change.findFirst({ where: { businessId: change.businessId, status: 'applied' }, orderBy: { appliedAt: 'desc' } });
      if (latest?.id !== change.id) throw new ConflictException("Si può annullare solo l'ultima modifica applicata");
      const current = await this.data.load(change.businessId, tx);
      if (canonical(current) !== canonical(change.after)) throw new ConflictException('I dati sono cambiati dopo questa modifica');
      await this.data.save(tx, change.businessId, change.before as unknown as BusinessData);
      return tx.change.update({ where: { id: change.id }, data: { status: 'undone' } });
    });
    return this.present(updated);
  }

  async list(userId: string, businessId: string) {
    await this.membership.roleOf(userId, businessId);
    const rows = await this.prisma.change.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { author: { select: { name: true } } },
    });
    return rows.map((c) => ({ ...this.present(c), author: c.author.name }));
  }

  private async findForUser(userId: string, changeId: string) {
    const change = await this.prisma.change.findUnique({ where: { id: changeId } });
    if (!change) throw new NotFoundException('Modifica non trovata');
    await this.membership.roleOf(userId, change.businessId);
    return change;
  }

  private present(c: { id: string; status: string; source: string; message: string | null; summary: Prisma.JsonValue; createdAt: Date; appliedAt: Date | null }) {
    return { id: c.id, status: c.status, source: c.source, message: c.message, summary: c.summary as string[], createdAt: c.createdAt, appliedAt: c.appliedAt };
  }
}
