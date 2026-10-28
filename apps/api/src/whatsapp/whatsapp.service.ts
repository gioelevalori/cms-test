import { HttpException, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ChangesService } from '../changes/changes.service';
import type { WhatsAppClient } from './whatsapp.client';
import { LINK_MESSAGE } from './whatsapp-link.controller';

/** Un messaggio in arrivo, già estratto dal webhook di Meta. */
export interface InboundWhatsApp {
  id: string;
  from: string;
  text?: string;
  buttonId?: string;
}
type Replies = Pick<WhatsAppClient, 'sendText' | 'sendButtons'>;

const HELP = [
  'Scrivimi cosa cambia, come lo diresti a un collaboratore. Per esempio:',
  '• Sabato chiudiamo alle 15',
  '• Dal 10 al 20 agosto chiusi per ferie',
  '• La carbonara è finita',
  '• La margherita costa 7 euro',
  '• Evento il 12 dicembre: serata jazz',
  '',
  'Ti mostro sempre l’anteprima prima di cambiare il sito. Scrivi "annulla" per annullare l’ultima modifica.',
].join('\n');

const YES = /^(si|sì|ok|okay|confermo|conferma|va bene|vai)[.! ]*$/i;
const NO = /^(no|scarta|lascia stare|niente)[.! ]*$/i;
const UNDO = /^annulla( l['’]?ultima)?( modifica)?[.! ]*$/i;
const HELP_RE = /^(aiuto|help|\?|ciao|info|menu)[.!? ]*$/i;
const LINK_RE = new RegExp(`^\\s*${LINK_MESSAGE}\\s+([a-z0-9]{6})\\s*[.!]?\\s*$`, 'i');

/**
 * Il cliente aggiorna il sito da WhatsApp:
 * messaggio → modifica proposta → pulsanti Conferma/Annulla → sito aggiornato.
 * Usa lo stesso ChangesService dell'admin, quindi stesse regole, stesse verifiche, stessa cronologia.
 */
@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly changes: ChangesService) {}

  async handle(msg: InboundWhatsApp, db: Prisma.TransactionClient, reply: Replies): Promise<void> {
    const link = (msg.text ?? '').match(LINK_RE);
    if (link) return this.linkNumber(db, reply, msg.from, link[1].toUpperCase());
    const move = msg.buttonId?.match(/^link-(yes|no):([A-Z0-9]{6})$/);
    if (move) return this.answerMove(db, reply, msg.from, move[2], move[1] === 'yes');

    const user = await db.user.findUnique({
      where: { whatsapp: msg.from },
      include: { memberships: { include: { business: { select: { id: true, name: true } } } } },
    });
    // Solo un numero collegato può cambiare un sito, e cambia l'attività scelta quando l'ha collegato.
    const membership = user?.memberships.find((m) => m.businessId === user.whatsappBusinessId) ?? user?.memberships[0];
    this.logger.log(`Messaggio da ...${msg.from.slice(-4)}: ${user ? 'utente collegato' : 'numero non collegato'}`);
    if (!user || !membership) {
      await reply.sendText(
        msg.from,
        'Questo numero non è collegato a nessuna attività, quindi non posso cambiare nessun sito. ' +
          'Per collegarlo apri il pannello della tua attività, tocca "Collega WhatsApp" e invia il codice che ti mostra.',
      );
      return;
    }
    const businessId = membership.businessId;

    try {
      if (msg.buttonId) return await this.handleButton(db, reply, user.id, msg.from, msg.buttonId);
      const text = (msg.text ?? '').trim();
      if (!text) return await reply.sendText(msg.from, 'Per ora capisco solo messaggi di testo.\n\n' + HELP);
      if (HELP_RE.test(text)) return await reply.sendText(msg.from, `Ciao! Qui aggiorni il sito di ${membership.business.name}.\n\n${HELP}`);
      if (YES.test(text) || NO.test(text)) return await this.answerPending(db, reply, user.id, msg.from, businessId, YES.test(text));
      if (UNDO.test(text)) return await this.undoLast(db, reply, user.id, msg.from, businessId);

      const result = await this.changes.proposeFromMessage(user.id, businessId, text, db);
      if (!('id' in result)) {
        return await reply.sendText(msg.from, `Non ho capito il messaggio.\n\n${HELP}`);
      }
      const lines = result.summary.map((s: string) => `• ${s}`).join('\n');
      const unclear = result.unrecognized.length ? `\n\nNon ho capito: “${result.unrecognized.join('”, “')}”` : '';
      await reply.sendButtons(msg.from, `Ecco cosa cambierà:\n${lines}${unclear}\n\nConfermi?`, [
        { id: `confirm:${result.id}`, title: 'Conferma' },
        { id: `reject:${result.id}`, title: 'Annulla' },
      ]);
    } catch (err) {
      // Un errore tecnico fa rollback e verrà ritentato. Un conflitto del cliente è definitivo.
      if (!(err instanceof HttpException) || err.getStatus() >= 500) throw err;
      await reply.sendText(msg.from, `Non sono riuscito a completare l'operazione: ${err.message}`);
    }
  }

  /**
   * "COLLEGA ABC123" inviato dal telefono del titolare: collega il numero da cui arriva.
   * Se il numero aggiorna già un'altra attività, chiede prima se spostarlo.
   */
  private async linkNumber(db: Prisma.TransactionClient, reply: Replies, from: string, code: string) {
    const link = await this.validLink(db, reply, from, code);
    if (!link) return;
    const target = await db.business.findUnique({ where: { id: link.businessId }, select: { name: true } });
    const current = await this.currentBusiness(db, from);
    if (current && current.id !== link.businessId) {
      this.logger.log(`Numero ...${from.slice(-4)} già collegato a un'altra attività: chiedo conferma`);
      await reply.sendButtons(
        from,
        `Questo numero è già associato a ${current.name}.\n\nVuoi dissociarlo da ${current.name} e associarlo a ${target?.name ?? 'la nuova attività'}?`,
        [
          { id: `link-yes:${code}`, title: 'Conferma' },
          { id: `link-no:${code}`, title: 'Annulla' },
        ],
      );
      return;
    }
    await this.applyLink(db, reply, from, link, target?.name);
  }

  /** Risposta ai pulsanti "dissociarlo e associarlo a…". */
  private async answerMove(db: Prisma.TransactionClient, reply: Replies, from: string, code: string, yes: boolean) {
    if (!yes) {
      const current = await this.currentBusiness(db, from);
      await reply.sendText(from, `Ok, non cambio nulla: il numero resta associato a ${current?.name ?? 'l\'attività di prima'}.`);
      return;
    }
    const link = await this.validLink(db, reply, from, code);
    if (!link) return;
    const target = await db.business.findUnique({ where: { id: link.businessId }, select: { name: true } });
    await this.applyLink(db, reply, from, link, target?.name);
  }

  /** Il codice esiste e non è scaduto; altrimenti spiega cosa fare. */
  private async validLink(db: Prisma.TransactionClient, reply: Replies, from: string, code: string) {
    const link = await db.whatsAppLink.findUnique({ where: { code } });
    if (link && link.expiresAt >= new Date()) return link;
    this.logger.warn(`Codice da ...${from.slice(-4)} rifiutato: ${link ? 'scaduto' : 'inesistente, forse ne è stato generato uno nuovo'}`);
    if (link) await db.whatsAppLink.delete({ where: { code } });
    await reply.sendText(
      from,
      'Questo codice non è valido o è scaduto. Vale solo l\'ultimo codice mostrato nel pannello: tocca di nuovo "Collega WhatsApp" e invia quello.',
    );
    return null;
  }

  /** L'attività che questo numero aggiorna oggi, se è collegato. */
  private async currentBusiness(db: Prisma.TransactionClient, from: string) {
    const user = await db.user.findUnique({
      where: { whatsapp: from },
      include: { memberships: { include: { business: { select: { id: true, name: true } } } } },
    });
    const membership = user?.memberships.find((m) => m.businessId === user.whatsappBusinessId) ?? user?.memberships[0];
    return membership?.business ?? null;
  }

  /** Il codice dimostra che il telefono è del titolare: il numero lascia l'eventuale altro account e passa a questo. */
  private async applyLink(db: Prisma.TransactionClient, reply: Replies, from: string, link: { userId: string; businessId: string }, name?: string) {
    await db.user.updateMany({ where: { whatsapp: from, id: { not: link.userId } }, data: { whatsapp: null, whatsappBusinessId: null } });
    await db.user.update({ where: { id: link.userId }, data: { whatsapp: from, whatsappBusinessId: link.businessId } });
    await db.whatsAppLink.deleteMany({ where: { userId: link.userId } });
    this.logger.log(`Numero ...${from.slice(-4)} collegato`);
    await reply.sendText(
      from,
      `Fatto! Da questo numero ora aggiorni il sito di ${name ?? 'la tua attività'}. Solo tu puoi farlo: gli altri numeri vengono ignorati.\n\n${HELP}`,
    );
  }

  private async handleButton(db: Prisma.TransactionClient, reply: Replies, userId: string, to: string, buttonId: string) {
    const [action, changeId] = buttonId.split(':');
    if (!changeId) return;
    if (action === 'confirm') {
      await this.changes.confirm(userId, changeId, db);
      await reply.sendText(to, 'Fatto! Il sito è aggiornato. Scrivi "annulla" se vuoi tornare indietro.');
    } else if (action === 'reject') {
      await this.changes.reject(userId, changeId, db);
      await reply.sendText(to, 'Ok, non cambio nulla.');
    }
  }

  /** "sì" / "no" in risposta all'ultima proposta in attesa (entro 30 minuti). */
  private async answerPending(db: Prisma.TransactionClient, reply: Replies, userId: string, to: string, businessId: string, yes: boolean) {
    const pending = await db.change.findFirst({
      where: { businessId, authorId: userId, status: 'proposed', createdAt: { gte: new Date(Date.now() - 30 * 60_000) } },
      orderBy: { createdAt: 'desc' },
    });
    if (!pending) return reply.sendText(to, 'Non ci sono modifiche in attesa di conferma.');
    return this.handleButton(db, reply, userId, to, `${yes ? 'confirm' : 'reject'}:${pending.id}`);
  }

  private async undoLast(db: Prisma.TransactionClient, reply: Replies, userId: string, to: string, businessId: string) {
    const last = await db.change.findFirst({ where: { businessId, status: 'applied' }, orderBy: { appliedAt: 'desc' } });
    if (!last) return reply.sendText(to, 'Non ci sono modifiche da annullare.');
    await this.changes.undo(userId, last.id, db);
    const summary = (last.summary as string[]).map((s) => `• ${s}`).join('\n');
    await reply.sendText(to, `Annullato. Ho ripristinato com'era prima di:\n${summary}`);
  }
}
