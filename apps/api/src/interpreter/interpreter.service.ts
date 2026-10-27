import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { interpretMessage, isValidOp, type BusinessData, type ChangeOp, type Interpretation, type IsoDate } from '@cms/shared';

/**
 * Trasforma un messaggio in operazioni.
 * Prima prova l'interprete a regole (veloce, gratuito, prevedibile). Se resta qualcosa di non capito
 * e c'è una chiave Anthropic configurata, chiede a Claude. Le operazioni restituite vengono sempre
 * validate: il modello può solo proporre, mai scrivere direttamente.
 */
@Injectable()
export class InterpreterService {
  private readonly logger = new Logger(InterpreterService.name);

  constructor(private readonly config: ConfigService) {}

  async interpret(message: string, data: BusinessData, today: IsoDate): Promise<Interpretation & { engine: 'rules' | 'ai' }> {
    const byRules = interpretMessage(message, data, today);
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (byRules.unrecognized.length === 0 || !apiKey) return { ...byRules, engine: 'rules' };

    try {
      const byAi = await this.askClaude(apiKey, message, data, today);
      if (byAi && byAi.ops.length >= byRules.ops.length) return { ...byAi, engine: 'ai' };
    } catch (err) {
      this.logger.warn(`Interpretazione AI non riuscita: ${(err as Error).message}`);
    }
    return { ...byRules, engine: 'rules' };
  }

  private async askClaude(apiKey: string, message: string, data: BusinessData, today: IsoDate): Promise<Interpretation | null> {
    const model = this.config.get<string>('ANTHROPIC_MODEL') || 'claude-sonnet-5-5';
    const system = [
      "Sei l'assistente di un CMS per piccole attività. Trasformi il messaggio del titolare in operazioni JSON sui dati dell'attività.",
      `Oggi è ${today}. I giorni della settimana vanno da 1 (lunedì) a 7 (domenica). Orari "HH:MM", date "YYYY-MM-DD".`,
      'Operazioni ammesse:',
      '{"op":"setWeeklyHours","weekday":1-7,"slots":[{"opens":"HH:MM","closes":"HH:MM"}]}  (slots vuoto = chiuso ogni settimana)',
      '{"op":"setSpecialHours","date":"YYYY-MM-DD","closed":bool,"opens":"HH:MM"|null,"closes":"HH:MM"|null,"note":string|null}',
      '{"op":"removeSpecialHours","date":"YYYY-MM-DD"}',
      '{"op":"addCatalogItem","section":string,"name":string,"description":string,"price":number|null}',
      '{"op":"setItemPrice","itemId":string,"price":number}',
      '{"op":"setItemAvailability","itemId":string,"available":bool}',
      '{"op":"removeCatalogItem","itemId":string}',
      '{"op":"addPost","kind":"news"|"event"|"offer","title":string,"body":string,"startsAt":"YYYY-MM-DD"|null,"endsAt":"YYYY-MM-DD"|null}',
      '{"op":"setContact","field":"phone"|"email"|"address"|"description","value":string}',
      'Un giorno della settimana senza "ogni"/"il"/"tutti i" si riferisce solo alla prossima occorrenza: usa setSpecialHours.',
      'Rispondi SOLO con JSON: {"ops":[...],"unrecognized":["frasi non capite"]}.',
    ].join('\n');
    const context = JSON.stringify({ openingHours: data.openingHours, specialHours: data.specialHours, catalog: data.catalog.map(({ id, section, name, price, available }) => ({ id, section, name, price, available })) });

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model,
        max_tokens: 1500,
        system,
        messages: [{ role: 'user', content: `Dati attuali: ${context}\n\nMessaggio: ${message}` }],
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = body.content?.find((c) => c.type === 'text')?.text ?? '';
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)) as { ops?: unknown[]; unrecognized?: unknown[] };

    const itemIds = new Set(data.catalog.map((i) => i.id));
    const ops = (json.ops ?? []).filter(isValidOp).filter((op: ChangeOp) => !('itemId' in op) || itemIds.has(op.itemId));
    const unrecognized = (json.unrecognized ?? []).filter((s): s is string => typeof s === 'string');
    return { ops, unrecognized };
  }
}
