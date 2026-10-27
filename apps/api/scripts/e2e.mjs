// Test end-to-end: richiede API avviata, database con seed. Uso: API_URL=http://localhost:3000 node scripts/e2e.mjs
import assert from 'node:assert/strict';

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

console.log(`\n${passed} controlli superati`);
