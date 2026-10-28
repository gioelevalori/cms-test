import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ReplyButton {
  id: string;
  title: string;
}

export const textPayload = (text: string) => ({ type: 'text', text: { body: text.slice(0, 4096) } });
export const buttonsPayload = (body: string, buttons: ReplyButton[]) => ({
  type: 'interactive',
  interactive: {
    type: 'button', body: { text: body.slice(0, 1024) },
    action: { buttons: buttons.slice(0, 3).map((b) => ({ type: 'reply', reply: { id: b.id, title: b.title.slice(0, 20) } })) },
  },
});

/** Invio messaggi tramite WhatsApp Cloud API (Graph API di Meta). */
@Injectable()
export class WhatsAppClient {
  private readonly logger = new Logger(WhatsAppClient.name);

  private display: string | null | undefined;

  constructor(private readonly config: ConfigService) {}

  /**
   * Il numero dell'assistente a cui i titolari scrivono, solo cifre (es. 15551815223).
   * Si legge da WHATSAPP_DISPLAY_NUMBER oppure, una volta sola, da Meta: nessuna configurazione in più.
   */
  async displayNumber(): Promise<string | null> {
    const fromEnv = this.config.get<string>('WHATSAPP_DISPLAY_NUMBER');
    if (fromEnv) return fromEnv.replace(/\D/g, '');
    if (this.display !== undefined) return this.display;
    const token = this.config.get<string>('WHATSAPP_TOKEN');
    const phoneId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    if (!token || !phoneId) return null;
    try {
      const res = await fetch(`${this.base()}/${phoneId}?fields=display_phone_number`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10_000),
      });
      const body = (await res.json()) as { display_phone_number?: string };
      this.display = res.ok && body.display_phone_number ? body.display_phone_number.replace(/\D/g, '') : null;
    } catch (err) {
      this.logger.warn(`Numero dell'assistente non letto da Meta: ${(err as Error).message}`);
      return null;
    }
    return this.display;
  }

  private base() {
    const base = this.config.get<string>('WHATSAPP_API_BASE') ?? 'https://graph.facebook.com';
    const version = this.config.get<string>('WHATSAPP_API_VERSION') ?? 'v26.0';
    return `${base}/${version}`;
  }

  sendText(to: string, text: string) {
    return this.send(to, textPayload(text));
  }

  /** Messaggio con pulsanti di risposta (massimo 3, titolo massimo 20 caratteri). */
  sendButtons(to: string, body: string, buttons: ReplyButton[]) {
    return this.send(to, buttonsPayload(body, buttons));
  }

  async send(to: string, message: Record<string, unknown>) {
    const token = this.config.get<string>('WHATSAPP_TOKEN');
    const phoneId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    if (!token || !phoneId) {
      throw new Error('WhatsApp non configurato: token o numero mancanti');
    }
    const res = await fetch(`${this.base()}/${phoneId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, ...message }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      // Non salvare il corpo Graph: può contenere dati personali o credenziali.
      throw new Error(`Invio WhatsApp fallito (HTTP ${res.status})`);
    }
    this.logger.log(`Risposta WhatsApp inviata a ...${to.slice(-4)}`);
  }
}
