import { Controller, ForbiddenException, Get, HttpCode, Logger, Post, Query, Req, UnauthorizedException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { WhatsAppService, type InboundWhatsApp } from './whatsapp.service';

interface WebhookBody {
  object?: string;
  entry?: { changes?: { field?: string; value?: { messages?: WebhookMessage[] } }[] }[];
}
interface WebhookMessage {
  id: string;
  from: string;
  type: string;
  text?: { body: string };
  interactive?: { type: string; button_reply?: { id: string; title: string } };
  button?: { payload?: string; text?: string };
}

/** Webhook di WhatsApp Cloud API: verifica (GET) e messaggi in arrivo (POST). */
@Controller('whatsapp/webhook')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(private readonly config: ConfigService, private readonly whatsapp: WhatsAppService) {}

  /** Meta chiama questo endpoint quando si salva l'URL del webhook nel pannello sviluppatori. */
  @Get()
  verify(@Query('hub.mode') mode: string, @Query('hub.verify_token') token: string, @Query('hub.challenge') challenge: string) {
    const expected = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && expected && token === expected) {
      this.logger.log('Verifica webhook riuscita');
      return challenge;
    }
    this.logger.warn(`Verifica webhook rifiutata (mode=${mode}, token ${expected ? 'diverso' : 'non configurato'})`);
    throw new ForbiddenException();
  }

  @Post()
  @HttpCode(200)
  receive(@Req() req: RawBodyRequest<Request>) {
    if (!this.validSignature(req)) {
      this.logger.warn('Webhook rifiutato: firma non valida (controlla WHATSAPP_APP_SECRET)');
      throw new UnauthorizedException('Firma non valida');
    }
    const messages = this.extract(req.body as WebhookBody);
    this.logger.log(`Webhook ricevuto: ${messages.length} messaggi`);

    // Si risponde subito 200 e si elabora dopo: Meta riprova se la risposta tarda.
    for (const msg of messages) {
      setImmediate(() => this.whatsapp.handle(msg).catch((err) => this.logger.error((err as Error).message)));
    }
    return { received: true };
  }

  private validSignature(req: RawBodyRequest<Request>): boolean {
    const secret = this.config.get<string>('WHATSAPP_APP_SECRET');
    const header = req.headers['x-hub-signature-256'];
    if (!secret || typeof header !== 'string' || !req.rawBody) return false;
    const [algo, received] = header.split('=');
    if (algo !== 'sha256' || !received) return false;
    const expected = createHmac('sha256', secret).update(req.rawBody).digest('hex');
    const a = Buffer.from(received, 'hex');
    const b = Buffer.from(expected, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  }

  /** Le notifiche arrivano raggruppate: entry[] → changes[] → value.messages[]. */
  private extract(body: WebhookBody): InboundWhatsApp[] {
    if (body?.object !== 'whatsapp_business_account') return [];
    const out: InboundWhatsApp[] = [];
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        for (const m of change.value?.messages ?? []) {
          if (!m?.id || !m?.from) continue;
          out.push({
            id: m.id,
            from: m.from,
            text: m.type === 'text' ? m.text?.body : undefined,
            buttonId: m.interactive?.button_reply?.id ?? m.button?.payload,
          });
        }
      }
    }
    return out;
  }
}
