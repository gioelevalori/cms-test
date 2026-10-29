import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Invio email con Resend (https://resend.com). Serve RESEND_API_KEY; MAIL_FROM è il mittente
 * (un dominio verificato su Resend, oppure "onboarding@resend.dev" per le prove).
 * Senza chiave l'email non parte: il testo finisce nei log dell'API, così si può provare lo stesso.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  get enabled() {
    return Boolean(this.config.get<string>('RESEND_API_KEY'));
  }

  async send(mail: Mail): Promise<void> {
    const key = this.config.get<string>('RESEND_API_KEY');
    if (!key) {
      this.logger.warn(`Email non configurata (manca RESEND_API_KEY). Email per ${mail.to}: ${mail.subject}\n${mail.text}`);
      return;
    }
    const base = this.config.get<string>('RESEND_API_BASE') ?? 'https://api.resend.com';
    const from = this.config.get<string>('MAIL_FROM') ?? 'Pannello del sito <onboarding@resend.dev>';
    const res = await fetch(`${base}/emails`, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html }),
    });
    if (!res.ok) {
      // Chi chiede la password non deve sapere se l'invio è fallito (né se l'email esiste): resta nei log.
      this.logger.error(`Invio email fallito (${res.status}): ${(await res.text()).slice(0, 300)}`);
      return;
    }
    this.logger.log(`Email inviata a ${mail.to.replace(/^(.).*@/, '$1…@')}`);
  }
}
