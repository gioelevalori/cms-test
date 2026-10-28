import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChangesService } from '../changes/changes.service';
import { WhatsAppClient } from './whatsapp.client';
import { LINK_MESSAGE } from './whatsapp-link.controller';

/** Un messaggio in arrivo, già estratto dal webhook di Meta. */
export interface InboundWhatsApp {
  id: string;
  from: string;
  text?: string;
  buttonId?: string;
}

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly changes: ChangesService,
    private readonly client: WhatsAppClient,
  ) {}

  async handle(msg: InboundWhatsApp): Promise<void> {
    // Meta può ripetere lo stesso webhook: ogni messaggio si elabora una volta sola.
    try {
      await this.prisma.inboundMessage.create({ data: { id: msg.id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return;
      throw err;
    }

    const link = (msg.text ?? '').match(LINK_RE);
    if (link) return this.linkNumber(msg.from, link[1].toUpperCase());

    const user = await this.prisma.user.findUnique({
      where: { whatsapp: msg.from },
      include: { memberships: { include: { business: { select: { id: true, name: true } } } } },
    });
    // Solo un numero collegato può cambiare un sito, e cambia l'attività scelta quando l'ha collegato.
    const membership = user?.memberships.find((m) => m.businessId === user.whatsappBusinessId) ?? user?.memberships[0];
    this.logger.log(`Messaggio da ...${msg.from.slice(-4)}: ${user ? 'utente collegato' : 'numero non collegato'}`);
    if (!user || !membership) {
      await this.client.sendText(
        msg.from,
        'Questo numero non è collegato a nessuna attività, quindi non posso cambiare nessun sito. ' +
          'Per collegarlo apri il pannello della tua attività, tocca "Collega WhatsApp" e invia il codice che ti mostra.',
      );
      return;
    }
    const businessId = membership.businessId;

    try {
      if (msg.buttonId) return await this.handleButton(user.id, msg.from, msg.buttonId);
      const text = (msg.text ?? '').trim();
      if (!text) return await this.client.sendText(msg.from, 'Per ora capisco solo messaggi di testo.\n\n' + HELP);
      if (HELP_RE.test(text)) return await this.client.sendText(msg.from, `Ciao! Qui aggiorni il sito di ${membership.business.name}.\n\n${HELP}`);
      if (YES.test(text) || NO.test(text)) return await this.answerPending(user.id, msg.from, businessId, YES.test(text));
      if (UNDO.test(text)) return await this.undoLast(user.id, msg.from, businessId);

      const result = await this.changes.proposeFromMessage(user.id, businessId, text);
      if (!('id' in result)) {
        return await this.client.sendText(msg.from, `Non ho capito il messaggio.\n\n${HELP}`);
      }
      const lines = result.summary.map((s: string) => `• ${s}`).join('\n');
      const unclear = result.unrecognized.length ? `\n\nNon ho capito: “${result.unrecognized.join('”, “')}”` : '';
      await this.client.sendButtons(msg.from, `Ecco cosa cambierà:\n${lines}${unclear}\n\nConfermi?`, [
        { id: `confirm:${result.id}`, title: 'Conferma' },
        { id: `reject:${result.id}`, title: 'Annulla' },
      ]);
    } catch (err) {
      this.logger.error(`Errore elaborando il messaggio ${msg.id}: ${(err as Error).message}`);
      await this.client.sendText(msg.from, `Non sono riuscito a completare l'operazione: ${(err as Error).message}`);
    }
  }

  /** "COLLEGA ABC123" inviato dal telefono del titolare: collega il numero da cui arriva. */
  private async linkNumber(from: string, code: string) {
    const link = await this.prisma.whatsAppLink.findUnique({ where: { code } });
    if (!link || link.expiresAt < new Date()) {
      if (link) await this.prisma.whatsAppLink.delete({ where: { code } });
      await this.client.sendText(from, 'Questo codice non è valido o è scaduto. Generane uno nuovo dal pannello con "Collega WhatsApp".');
      return;
    }
    const owner = await this.prisma.user.findUnique({ where: { whatsapp: from }, select: { id: true } });
    if (owner && owner.id !== link.userId) {
      await this.client.sendText(from, 'Questo numero è già collegato a un altro account. Scollegalo da quell\'account e riprova.');
      return;
    }
    const business = await this.prisma.business.findUnique({ where: { id: link.businessId }, select: { name: true } });
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: link.userId }, data: { whatsapp: from, whatsappBusinessId: link.businessId } }),
      this.prisma.whatsAppLink.deleteMany({ where: { userId: link.userId } }),
    ]);
    this.logger.log(`Numero ...${from.slice(-4)} collegato`);
    await this.client.sendText(
      from,
      `Fatto! Da questo numero ora aggiorni il sito di ${business?.name ?? 'la tua attività'}. Solo tu puoi farlo: gli altri numeri vengono ignorati.\n\n${HELP}`,
    );
  }

  private async handleButton(userId: string, to: string, buttonId: string) {
    const [action, changeId] = buttonId.split(':');
    if (!changeId) return;
    if (action === 'confirm') {
      await this.changes.confirm(userId, changeId);
      await this.client.sendText(to, 'Fatto! Il sito è aggiornato. Scrivi "annulla" se vuoi tornare indietro.');
    } else if (action === 'reject') {
      await this.changes.reject(userId, changeId);
      await this.client.sendText(to, 'Ok, non cambio nulla.');
    }
  }

  /** "sì" / "no" in risposta all'ultima proposta in attesa (entro 30 minuti). */
  private async answerPending(userId: string, to: string, businessId: string, yes: boolean) {
    const pending = await this.prisma.change.findFirst({
      where: { businessId, authorId: userId, status: 'proposed', createdAt: { gte: new Date(Date.now() - 30 * 60_000) } },
      orderBy: { createdAt: 'desc' },
    });
    if (!pending) return this.client.sendText(to, 'Non ci sono modifiche in attesa di conferma.');
    return this.handleButton(userId, to, `${yes ? 'confirm' : 'reject'}:${pending.id}`);
  }

  private async undoLast(userId: string, to: string, businessId: string) {
    const last = await this.prisma.change.findFirst({ where: { businessId, status: 'applied' }, orderBy: { appliedAt: 'desc' } });
    if (!last) return this.client.sendText(to, 'Non ci sono modifiche da annullare.');
    await this.changes.undo(userId, last.id);
    const summary = (last.summary as string[]).map((s) => `• ${s}`).join('\n');
    await this.client.sendText(to, `Annullato. Ho ripristinato com'era prima di:\n${summary}`);
  }
}
