// Test end-to-end: richiede API avviata, database con seed. Uso: API_URL=http://localhost:3000 node scripts/e2e.mjs
import assert from 'node:assert/strict';
import http from 'node:http';
import { createHmac } from 'node:crypto';

const API = process.env.API_URL ?? 'http://localhost:3000';
let passed = 0;

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

async function step(name, fn) {
  await fn();
  passed++;
  console.log(`✓ ${name}`);
}

const login = async (email) => (await call('POST', '/auth/login', { body: { email, password: 'password123' } })).body.accessToken;
const publicSite = async () => (await call('GET', '/public/businesses/pizzeria-da-mario')).body;

const client = await login('cliente@example.com');
const builder = await login('freelance@example.com');
let businessId;

await step('login e lista attività', async () => {
  assert.ok(client && builder);
  const res = await call('GET', '/businesses', { token: client });
  assert.equal(res.status, 200);
  assert.equal(res.body[0].role, 'client');
  businessId = res.body[0].id;
});

await step('senza token: 401', async () => {
  assert.equal((await call('GET', '/businesses')).status, 401);
});

let changeId;
await step('chat: "Sabato chiudiamo alle 15. La carbonara è finita." crea una proposta', async () => {
  const res = await call('POST', `/businesses/${businessId}/chat`, { token: client, body: { message: 'Sabato chiudiamo alle 15. La carbonara è finita.' } });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.equal(res.body.status, 'proposed');
  assert.equal(res.body.summary.length, 2);
  assert.match(res.body.summary[0], /15:00/);
  assert.match(res.body.summary[1], /Carbonara: non disponibile/);
  changeId = res.body.id;
});

await step('prima della conferma il sito pubblico non cambia', async () => {
  const site = await publicSite();
  assert.equal(site.data.specialHours.length, 0);
  assert.equal(site.data.catalog.find((i) => i.name === 'Carbonara').available, true);
});

await step('conferma: il sito pubblico mostra i nuovi dati e lo schema.org', async () => {
  const res = await call('POST', `/changes/${changeId}/confirm`, { token: client });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.equal(res.body.status, 'applied');
  const site = await publicSite();
  assert.equal(site.data.specialHours.length, 1);
  assert.equal(site.data.specialHours[0].closes, '15:00');
  assert.equal(site.data.catalog.find((i) => i.name === 'Carbonara').available, false);
  assert.ok(site.schemaOrg.openingHoursSpecification.some((s) => s.validFrom === site.data.specialHours[0].date));
});

await step('una modifica già confermata non si conferma due volte', async () => {
  assert.equal((await call('POST', `/changes/${changeId}/confirm`, { token: client })).status, 409);
});

await step('messaggio non capito', async () => {
  const res = await call('POST', `/businesses/${businessId}/chat`, { token: client, body: { message: 'Ciao, come va?' } });
  assert.equal(res.body.status, 'not_understood');
});

await step('annulla: i dati tornano come prima', async () => {
  const res = await call('POST', `/changes/${changeId}/undo`, { token: client });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  const site = await publicSite();
  assert.equal(site.data.specialHours.length, 0);
  assert.equal(site.data.catalog.find((i) => i.name === 'Carbonara').available, true);
});

await step('conflitto: due proposte sugli stessi dati, la seconda viene rifiutata', async () => {
  const a = await call('POST', `/businesses/${businessId}/chat`, { token: client, body: { message: 'La margherita costa 7 euro' } });
  const b = await call('POST', `/businesses/${businessId}/chat`, { token: client, body: { message: 'Aggiungi la diavola a 8 euro nella sezione pizze' } });
  assert.equal((await call('POST', `/changes/${a.body.id}/confirm`, { token: client })).status, 201);
  assert.equal((await call('POST', `/changes/${b.body.id}/confirm`, { token: client })).status, 409);
  const site = await publicSite();
  assert.equal(site.data.catalog.find((i) => i.name === 'Margherita').price, 7);
});

await step('modifica da modulo con operazioni strutturate', async () => {
  const site = await publicSite();
  const item = site.data.catalog.find((i) => i.name === 'Tiramisù');
  const res = await call('POST', `/businesses/${businessId}/changes`, { token: client, body: { ops: [{ op: 'setItemPrice', itemId: item.id, price: 5.5 }] } });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.equal((await call('POST', `/businesses/${businessId}/changes`, { token: client, body: { ops: [{ op: 'dropDatabase' }] } })).status, 400);
});

await step('il cliente non può cambiare le pagine, il costruttore sì', async () => {
  const pages = (await call('GET', `/businesses/${businessId}/pages`, { token: builder })).body;
  const layout = pages[0].layout.slice().reverse();
  assert.equal((await call('PUT', `/businesses/${businessId}/pages/home`, { token: client, body: { layout } })).status, 403);
  assert.equal((await call('PUT', `/businesses/${businessId}/pages/home`, { token: builder, body: { layout } })).status, 200);
  assert.equal((await call('PUT', `/businesses/${businessId}/pages/home`, { token: builder, body: { layout: [{ id: 'x', type: 'script', options: {} }] } })).status, 400);
});

await step('cronologia delle modifiche', async () => {
  const res = await call('GET', `/businesses/${businessId}/changes`, { token: client });
  assert.ok(res.body.length >= 4);
  assert.ok(res.body.some((c) => c.status === 'undone'));
});

// ---------- WhatsApp ----------
// Finto server Graph API: registra i messaggi che l'API invierebbe a WhatsApp.
const outbox = [];
const graph = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    outbox.push({ url: req.url, auth: req.headers.authorization, body: JSON.parse(raw) });
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{"messages":[{"id":"wamid.out"}]}');
  });
});
await new Promise((r) => graph.listen(3999, r));

const PHONE = '393331234567';
const SECRET = process.env.WHATSAPP_APP_SECRET ?? 'ci-app-secret';
let seq = 0;

async function webhook(messages, { secret = SECRET } = {}) {
  const raw = JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [{ id: 'waba', changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', metadata: { phone_number_id: 'test' }, messages } }] }],
  });
  return fetch(`${API}/whatsapp/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-hub-signature-256': 'sha256=' + createHmac('sha256', secret).update(raw).digest('hex') },
    body: raw,
  });
}
const textMsg = (body, from = PHONE, id = `wamid.in${++seq}`) => ({ id, from, timestamp: '1', type: 'text', text: { body } });
const buttonMsg = (buttonId) => ({ id: `wamid.in${++seq}`, from: PHONE, timestamp: '1', type: 'interactive', interactive: { type: 'button_reply', button_reply: { id: buttonId, title: 'x' } } });

/** Invia e aspetta la risposta, senza perdere risposte arrivate prima di iniziare ad aspettare. */
async function send(messages, to = PHONE) {
  const start = outbox.length;
  const res = await webhook(messages);
  assert.equal(res.status, 200);
  for (let i = 0; i < 60; i++) {
    const found = outbox.slice(start).find((m) => m.body.to === to);
    if (found) return found.body;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Nessuna risposta WhatsApp a ${to}`);
}
const specialClosingAt = async (closes) => (await publicSite()).data.specialHours.find((s) => s.closes === closes);

await step('WhatsApp: verifica del webhook (GET)', async () => {
  const ok = await fetch(`${API}/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${process.env.WHATSAPP_VERIFY_TOKEN ?? 'ci-verify'}&hub.challenge=12345`);
  assert.equal(ok.status, 200);
  assert.equal(await ok.text(), '12345');
  const bad = await fetch(`${API}/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=sbagliato&hub.challenge=12345`);
  assert.equal(bad.status, 403);
});

await step('WhatsApp: firma non valida rifiutata', async () => {
  assert.equal((await webhook([textMsg('Sabato chiusi')], { secret: 'sbagliato' })).status, 401);
});

let proposal;
let firstMessage;
await step('WhatsApp: messaggio → anteprima con pulsanti Conferma/Annulla', async () => {
  firstMessage = textMsg('Domenica chiudiamo alle 16');
  proposal = await send([firstMessage]);
  assert.equal(proposal.type, 'interactive');
  assert.match(proposal.interactive.body.text, /16:00/);
  assert.deepEqual(proposal.interactive.action.buttons.map((b) => b.reply.title), ['Conferma', 'Annulla']);
  assert.equal(await specialClosingAt('16:00'), undefined, 'non ancora applicato');
});

await step('WhatsApp: pulsante Conferma → sito aggiornato', async () => {
  const confirmId = proposal.interactive.action.buttons[0].reply.id;
  const msg = await send([buttonMsg(confirmId)]);
  assert.match(msg.text.body, /Fatto/);
  assert.ok(await specialClosingAt('16:00'));
});

await step('WhatsApp: lo stesso messaggio ripetuto da Meta non viene rielaborato', async () => {
  const before = outbox.length;
  assert.equal((await webhook([firstMessage])).status, 200);
  await new Promise((r) => setTimeout(r, 1200));
  assert.equal(outbox.length, before);
});

await step('WhatsApp: "annulla" ripristina l\'ultima modifica', async () => {
  const msg = await send([textMsg('annulla')]);
  assert.match(msg.text.body, /Annullato/);
  assert.equal(await specialClosingAt('16:00'), undefined);
});

await step('WhatsApp: conferma rispondendo "sì"', async () => {
  const p = await send([textMsg('La carbonara è finita')]);
  assert.equal(p.type, 'interactive');
  const done = await send([textMsg('sì')]);
  assert.match(done.text.body, /Fatto/);
  assert.equal((await publicSite()).data.catalog.find((i) => i.name === 'Carbonara').available, false);
});

await step('WhatsApp: messaggio non capito → istruzioni', async () => {
  const msg = await send([textMsg('Qual è il senso della vita?')]);
  assert.match(msg.text.body, /Non ho capito/);
});

await step('WhatsApp: numero non collegato', async () => {
  const msg = await send([textMsg('Sabato chiusi', '391111111111')], '391111111111');
  assert.match(msg.text.body, /non è collegato/);
});

await step('WhatsApp: le chiamate a Graph usano token e numero configurati', async () => {
  assert.ok(outbox.every((m) => m.auth === 'Bearer test-token' && m.url.endsWith('/test-phone-id/messages')));
});

await step('collegamento: il numero non si può più digitare a mano', async () => {
  const res = await call('PUT', '/auth/me/whatsapp', { token: client, body: { phone: '+39 333 765 4321' } });
  assert.equal(res.status, 400);
});

await step('scollegamento: il numero non può più cambiare il sito', async () => {
  const res = await call('PUT', '/auth/me/whatsapp', { token: client, body: { phone: '' } });
  assert.equal(res.status, 200);
  assert.equal(res.body.whatsapp, null);
  const msg = await send([textMsg('Sabato chiusi')]);
  assert.match(msg.text.body, /non è collegato/);
});

let linkCode;
await step('collegamento con codice: solo per le proprie attività', async () => {
  assert.equal((await call('POST', '/whatsapp/link', { token: client, body: { businessId: 'non-mia' } })).status, 403);
  const res = await call('POST', '/whatsapp/link', { token: client, body: { businessId } });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.match(res.body.code, /^[A-Z0-9]{6}$/);
  assert.equal(res.body.link, `https://wa.me/15551234567?text=COLLEGA%20${res.body.code}`);
  linkCode = res.body.code;
});

await step('collegamento con codice: il numero che lo invia viene collegato', async () => {
  const msg = await send([textMsg(`collega ${linkCode.toLowerCase()}`)]);
  assert.match(msg.text.body, /Fatto!.*Pizzeria da Mario/s);
  const me = await call('GET', '/auth/me', { token: client });
  assert.equal(me.body.whatsapp, PHONE);
  assert.equal(me.body.whatsappBusinessId, businessId);
  const help = await send([textMsg('aiuto')]);
  assert.match(help.text.body, /Pizzeria da Mario/);
});

await step('collegamento con codice: un codice si usa una volta sola', async () => {
  const other = '392222222222';
  const msg = await send([textMsg(`COLLEGA ${linkCode}`, other)], other);
  assert.match(msg.text.body, /non è valido o è scaduto/);
  const blocked = await send([textMsg('La margherita costa 9 euro', other)], other);
  assert.match(blocked.text.body, /non è collegato/);
});

graph.close();
console.log(`\n${passed} controlli superati`);
