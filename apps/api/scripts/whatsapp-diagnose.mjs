// Diagnosi in sola lettura. Non stampa token, segreti, messaggi o numeri completi.
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
await ConfigModule.forRoot();

const required = ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_APP_SECRET', 'WHATSAPP_VERIFY_TOKEN'];
const missing = required.filter((key) => !process.env[key]);
for (const key of required) console.log(`${key}: ${process.env[key] ? 'presente' : 'mancante'}`);
if (missing.length) process.exitCode = 1;

if (process.env.DATABASE_URL) {
  const db = new PrismaClient();
  try {
    const pending = await db.inboundMessage.count({ where: { processedAt: null, sender: { not: null } } });
    const replies = await db.whatsAppOutbound.count({ where: { sentAt: null } });
    const retrying = await db.whatsAppOutbound.count({ where: { sentAt: null, attempts: { gt: 0 } } });
    console.log(`Code: ${pending} messaggi da elaborare; ${replies} risposte da inviare (${retrying} in retry).`);
  } catch {
    console.log('Code non leggibili: verificare connessione e applicazione dello schema Prisma.');
    process.exitCode = 1;
  } finally { await db.$disconnect(); }
}

if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
  // Il dominio è fisso: la diagnosi non inoltra il token a un host arbitrario.
  const version = process.env.WHATSAPP_API_VERSION || 'v26.0';
  const phoneId = encodeURIComponent(process.env.WHATSAPP_PHONE_NUMBER_ID);
  try {
    const res = await fetch(`https://graph.facebook.com/${encodeURIComponent(version)}/${phoneId}?fields=display_phone_number`, {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }, signal: AbortSignal.timeout(10_000),
    });
    const body = await res.json();
    if (res.ok && typeof body.display_phone_number === 'string') {
      console.log(`Meta: accesso al numero riuscito (finale ${body.display_phone_number.replace(/\D/g, '').slice(-4)}).`);
    } else {
      console.log(`Meta: HTTP ${res.status}${Number.isInteger(body.error?.code) ? `, codice ${body.error.code}` : ''}. Verificare token, scadenza e accesso al numero.`);
      process.exitCode = 1;
    }
  } catch {
    console.log('Meta: verifica non riuscita; controllare connettività e configurazione.');
    process.exitCode = 1;
  }
}
console.log('La ricezione reale richiede un messaggio dal telefono e la verifica del webhook messages nella dashboard Meta.');
