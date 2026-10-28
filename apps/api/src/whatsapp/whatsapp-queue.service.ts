import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService, type InboundWhatsApp } from './whatsapp.service';
import { WhatsAppClient, textPayload, buttonsPayload } from './whatsapp.client';

const retryAt = (attempts: number) => new Date(Date.now() + Math.min(300_000, 1000 * 2 ** Math.min(attempts, 9)));
const errorCode = (err: unknown) => err instanceof Prisma.PrismaClientKnownRequestError
  ? `Database ${err.code}`
  : err instanceof Error && (/^Invio WhatsApp fallito \(HTTP \d{3}\)$/.test(err.message) || err.message === 'WhatsApp non configurato: token o numero mancanti')
    ? err.message : 'Errore tecnico; operazione in attesa di nuovo tentativo';

/** Inbox/outbox sullo stesso PostgreSQL dei dati: nessun broker da configurare. */
@Injectable()
export class WhatsAppQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppQueueService.name);
  private timer?: ReturnType<typeof setInterval>;
  private running?: Promise<void>;
  private stopping = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsAppService,
    private readonly client: WhatsAppClient,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => this.wake(), 1000);
    this.timer.unref();
    this.wake(); // Riprende anche i messaggi ricevuti prima dell'ultimo riavvio.
  }

  async onModuleDestroy() {
    this.stopping = true;
    if (this.timer) clearInterval(this.timer);
    await this.running;
  }

  async enqueue(messages: InboundWhatsApp[]) {
    if (!messages.length) return;
    // createMany è atomica per tutto il webhook. I duplicati, compresi i record legacy, non cambiano.
    await this.prisma.inboundMessage.createMany({
      data: messages.map((msg) => ({ id: msg.id, sender: msg.from, payload: msg as unknown as Prisma.InputJsonValue })),
      skipDuplicates: true,
    });
    this.wake();
  }

  private wake() {
    if (this.running || this.stopping) return;
    this.running = Promise.allSettled([this.drain('inbox'), this.drain('outbox')])
      .then((results) => {
        for (const result of results) if (result.status === 'rejected') this.logger.error(errorCode(result.reason));
      })
      .finally(() => { this.running = undefined; });
  }

  private async drain(kind: 'inbox' | 'outbox') {
    // Un batch limitato lascia spazio alle altre richieste e allo shutdown.
    for (let i = 0; i < 20; i++) {
      if (this.stopping) break;
      if (!(await (kind === 'inbox' ? this.processInbox() : this.processOutbox()))) break;
    }
  }

  async processInbox(): Promise<boolean> {
    let job: { id: string; payload: Prisma.JsonValue; attempts: number } | undefined;
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Lock transazionale: funziona anche con più istanze; un crash lo rilascia subito.
        const [lock] = await tx.$queryRaw<{ acquired: boolean }[]>`SELECT pg_try_advisory_xact_lock(714409, 1) AS acquired`;
        if (!lock.acquired) return false;
        [job] = await tx.$queryRaw<typeof job[]>`
          SELECT m.id, m.payload, m.attempts FROM "InboundMessage" m
          WHERE m."processedAt" IS NULL AND m.payload IS NOT NULL AND m."nextAttemptAt" <= NOW()
            AND NOT EXISTS (
              SELECT 1 FROM "InboundMessage" earlier
              WHERE earlier.sender = m.sender AND earlier.sequence < m.sequence
                AND earlier."processedAt" IS NULL AND earlier.payload IS NOT NULL
            )
          ORDER BY m.sequence LIMIT 1 FOR UPDATE OF m`;
        if (!job) return false;
        const responses: { recipient: string; payload: Prisma.InputJsonValue }[] = [];
        await this.whatsapp.handle(job.payload as unknown as InboundWhatsApp, tx, {
          sendText: async (recipient, text) => { responses.push({ recipient, payload: textPayload(text) }); },
          sendButtons: async (recipient, body, buttons) => { responses.push({ recipient, payload: buttonsPayload(body, buttons) }); },
        });
        if (responses.length) await tx.whatsAppOutbound.createMany({ data: responses });
        await tx.inboundMessage.update({ where: { id: job.id }, data: { processedAt: new Date(), lastError: null } });
        return true;
      }, { timeout: 45_000 });
    } catch (err) {
      if (!job) throw err;
      // Il rollback include dati, proposta e risposta. Nessuna modifica è stata applicata a metà.
      await this.prisma.inboundMessage.updateMany({
        where: { id: job.id, processedAt: null, attempts: job.attempts },
        data: { attempts: { increment: 1 }, nextAttemptAt: retryAt(job.attempts), lastError: errorCode(err) },
      });
      this.logger.error(`Messaggio in attesa di retry: ${errorCode(err)}`);
      return true;
    }
  }

  async processOutbox(): Promise<boolean> {
    let job: { id: string; recipient: string; payload: Prisma.JsonValue; attempts: number } | undefined;
    try {
      return await this.prisma.$transaction(async (tx) => {
        const [lock] = await tx.$queryRaw<{ acquired: boolean }[]>`SELECT pg_try_advisory_xact_lock(714409, 2) AS acquired`;
        if (!lock.acquired) return false;
        [job] = await tx.$queryRaw<typeof job[]>`
          SELECT m.id, m.recipient, m.payload, m.attempts FROM "WhatsAppOutbound" m
          WHERE m."sentAt" IS NULL AND m."nextAttemptAt" <= NOW()
            AND NOT EXISTS (
              SELECT 1 FROM "WhatsAppOutbound" earlier
              WHERE earlier.recipient = m.recipient AND earlier.sequence < m.sequence AND earlier."sentAt" IS NULL
            )
          ORDER BY m.sequence LIMIT 1 FOR UPDATE OF m`;
        if (!job) return false;
        await this.client.send(job.recipient, job.payload as Record<string, unknown>);
        await tx.whatsAppOutbound.update({ where: { id: job.id }, data: { sentAt: new Date(), lastError: null } });
        return true;
      }, { timeout: 20_000 });
    } catch (err) {
      if (!job) throw err;
      await this.prisma.whatsAppOutbound.updateMany({
        where: { id: job.id, sentAt: null, attempts: job.attempts },
        data: { attempts: { increment: 1 }, nextAttemptAt: retryAt(job.attempts), lastError: errorCode(err) },
      });
      this.logger.error(`Risposta in attesa di retry: ${errorCode(err)}`);
      return true;
    }
  }
}
