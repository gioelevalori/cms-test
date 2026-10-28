// PostgreSQL di test, API compilata. Crea e rimuove fixture proprie; nessun invio a Meta.
import assert from 'node:assert/strict';
import { randomUUID, createHmac } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { interpretMessage } from '@cms/shared';
import { ChangesService } from '../dist/changes/changes.service.js';
import { BusinessDataService } from '../dist/business/business-data.service.js';
import { MembershipService } from '../dist/business/membership.service.js';
import { WhatsAppService } from '../dist/whatsapp/whatsapp.service.js';
import { WhatsAppQueueService } from '../dist/whatsapp/whatsapp-queue.service.js';
import { WhatsAppController } from '../dist/whatsapp/whatsapp.controller.js';

const db = new PrismaClient();
const changes = new ChangesService(db, new BusinessDataService(db), new MembershipService(db), {
  interpret: async (message, data, today) => ({ ...interpretMessage(message, data, today), engine: 'rules' }),
});
const whatsapp = new WhatsAppService(changes);
const sent = [];
const client = { send: async (recipient, payload) => { sent.push({ recipient, payload }); } };
const queue = () => new WhatsAppQueueService(db, whatsapp, client);

if (process.argv.includes('--crash-inbox')) {
  const crashWorker = new WhatsAppQueueService(db, {
    handle: async (...args) => { await whatsapp.handle(...args); process.exit(17); },
  }, client);
  await crashWorker.processInbox();
  process.exit(18); // Deve terminare dentro la transazione, dopo aver scritto la proposta.
}

let passed = 0;
async function step(name, fn) { await fn(); console.log(`✓ ${name}`); passed++; }
const prefix = `reliability-${randomUUID()}`;
const phone = `399${Date.now()}`;
let user;
let business;
const itemId = `${prefix}-item`;
const inbox = async (suffix, text) => db.inboundMessage.create({ data: {
  id: `${prefix}-${suffix}`, sender: phone, payload: { id: `${prefix}-${suffix}`, from: phone, text },
} });

try {
  await step('webhook: attende il salvataggio e non risponde 200 se il database fallisce', async () => {
    const body = { object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: {
      messages: [{ id: `${prefix}-ack`, from: phone, type: 'text', text: { body: 'aiuto' } }],
    } }] }] };
    const rawBody = Buffer.from(JSON.stringify(body));
    const req = { body, rawBody, headers: { 'x-hub-signature-256': `sha256=${createHmac('sha256', 'test-secret').update(rawBody).digest('hex')}` } };
    let release;
    const saved = new Promise((resolve) => { release = resolve; });
    let acknowledged = false;
    const controller = new WhatsAppController({ get: () => 'test-secret' }, { enqueue: () => saved });
    const request = controller.receive(req).then(() => { acknowledged = true; });
    await new Promise((r) => setImmediate(r));
    assert.equal(acknowledged, false);
    release();
    await request;
    assert.equal(acknowledged, true);
    const failed = new WhatsAppController({ get: () => 'test-secret' }, { enqueue: async () => { throw new Error('DB offline'); } });
    await assert.rejects(failed.receive(req), /DB offline/);
  });

  user = await db.user.create({ data: { email: `${prefix}@example.test`, name: 'Test affidabilità', passwordHash: 'unused', whatsapp: phone } });
  business = await db.business.create({ data: {
    name: 'Test affidabilità', slug: prefix, category: 'restaurant',
    memberships: { create: { userId: user.id, role: 'owner' } },
    catalog: { create: { id: itemId, name: 'Margherita', section: 'Pizze', price: 6, position: 0 } },
  } });
  await db.user.update({ where: { id: user.id }, data: { whatsappBusinessId: business.id } });

  await step('crash dopo la proposta: rollback; un nuovo worker riprende lo stesso messaggio una sola volta', async () => {
    const job = await inbox('crash', 'La margherita costa 7 euro');
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--crash-inbox'], {
      env: process.env, encoding: 'utf8', timeout: 15_000,
    });
    assert.equal(child.status, 17, child.stderr);
    assert.equal(await db.change.count({ where: { businessId: business.id } }), 0);
    assert.equal((await db.inboundMessage.findUniqueOrThrow({ where: { id: job.id } })).processedAt, null);
    assert.equal(await db.whatsAppOutbound.count({ where: { recipient: phone } }), 0);
    assert.equal(await queue().processInbox(), true);
    assert.equal(await db.change.count({ where: { businessId: business.id } }), 1);
    assert.ok((await db.inboundMessage.findUniqueOrThrow({ where: { id: job.id } })).processedAt);
    assert.equal(await queue().processInbox(), false);
    assert.equal(await db.whatsAppOutbound.count({ where: { recipient: phone } }), 1);
  });

  await step('errore di invio: risposta persistita e ritentata da un nuovo worker senza ripetere la proposta', async () => {
    const before = await db.change.count({ where: { businessId: business.id } });
    const failing = new WhatsAppQueueService(db, whatsapp, { send: async () => { throw new Error('Invio WhatsApp fallito (HTTP 503)'); } });
    await failing.processOutbox();
    const response = await db.whatsAppOutbound.findFirstOrThrow({ where: { recipient: phone } });
    assert.equal(response.sentAt, null);
    assert.equal(response.attempts, 1);
    await db.whatsAppOutbound.update({ where: { id: response.id }, data: { nextAttemptAt: new Date(0) } });
    await queue().processOutbox();
    assert.equal(sent.length, 1);
    assert.ok((await db.whatsAppOutbound.findUniqueOrThrow({ where: { id: response.id } })).sentAt);
    assert.equal(await db.change.count({ where: { businessId: business.id } }), before);
  });

  await step('errore tecnico dopo scrittura: rollback completo, retry e una sola risposta', async () => {
    const job = await inbox('retry', 'La margherita costa 8 euro');
    const before = await db.change.count({ where: { businessId: business.id } });
    const failing = new WhatsAppQueueService(db, {
      handle: async (...args) => { await whatsapp.handle(...args); throw new Error('errore simulato'); },
    }, client);
    await failing.processInbox();
    assert.equal(await db.change.count({ where: { businessId: business.id } }), before);
    assert.equal((await db.inboundMessage.findUniqueOrThrow({ where: { id: job.id } })).attempts, 1);
    await db.inboundMessage.update({ where: { id: job.id }, data: { nextAttemptAt: new Date(0) } });
    const results = await Promise.all([queue().processInbox(), queue().processInbox()]);
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal(await db.change.count({ where: { businessId: business.id } }), before + 1);
    assert.equal(await db.whatsAppOutbound.count({ where: { recipient: phone, sentAt: null } }), 1);
    await queue().processOutbox();
  });

  await step('duplicato Meta e record legacy: nessuna rielaborazione', async () => {
    const legacyId = `${prefix}-legacy`;
    await db.inboundMessage.create({ data: { id: legacyId } });
    const before = await db.change.count({ where: { businessId: business.id } });
    const worker = queue();
    await worker.enqueue([
      { id: `${prefix}-retry`, from: phone, text: 'La margherita costa 99 euro' },
      { id: legacyId, from: phone, text: 'La margherita costa 99 euro' },
    ]);
    await worker.onModuleDestroy();
    assert.equal(await db.change.count({ where: { businessId: business.id } }), before);
    assert.equal((await db.inboundMessage.findUniqueOrThrow({ where: { id: legacyId } })).payload, null);
  });

  await step('ordine per mittente: retry blocca solo il proprio numero, gli altri continuano', async () => {
    const first = await inbox('ordered-1', 'aiuto');
    const second = await inbox('ordered-2', 'aiuto');
    await db.inboundMessage.update({ where: { id: first.id }, data: { nextAttemptAt: new Date(Date.now() + 60_000) } });
    assert.equal(await queue().processInbox(), false);
    assert.equal((await db.inboundMessage.findUniqueOrThrow({ where: { id: second.id } })).processedAt, null);
    await db.inboundMessage.create({ data: {
      id: `${prefix}-other`, sender: `${phone}1`, payload: { id: `${prefix}-other`, from: `${phone}1`, text: 'aiuto' },
    } });
    assert.equal(await queue().processInbox(), true);
    assert.equal((await db.inboundMessage.findUniqueOrThrow({ where: { id: first.id } })).processedAt, null);
    await queue().processOutbox();
    await db.inboundMessage.update({ where: { id: first.id }, data: { nextAttemptAt: new Date(0) } });
    assert.equal(await queue().processInbox(), true);
    assert.equal(await queue().processInbox(), true);
    await queue().processOutbox();
    await queue().processOutbox();
  });

  const propose = (price) => changes.proposeOps(user.id, business.id, [{ op: 'setItemPrice', itemId, price }]);
  const assertOneConflict = (results) => {
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    const failure = results.find((r) => r.status === 'rejected');
    assert.equal(failure.reason.getStatus(), 409);
  };

  await step('due conferme simultanee della stessa proposta senza variazioni: una sola riesce', async () => {
    const proposal = await propose(6); // Stessi dati prima/dopo: verifica anche la rilettura dello stato.
    assertOneConflict(await Promise.allSettled([changes.confirm(user.id, proposal.id), changes.confirm(user.id, proposal.id)]));
  });

  await step('proposte concorrenti: il secondo snapshot non sovrascrive il primo', async () => {
    const a = await propose(9);
    const b = await propose(10);
    const results = await Promise.allSettled([changes.confirm(user.id, a.id), changes.confirm(user.id, b.id)]);
    assertOneConflict(results);
    assert.equal((await db.catalogItem.findUniqueOrThrow({ where: { id: itemId } })).price, results[0].status === 'fulfilled' ? 9 : 10);
  });

  await step('conferma e rifiuto simultanei: una sola transizione', async () => {
    const proposal = await propose(12);
    assertOneConflict(await Promise.allSettled([changes.confirm(user.id, proposal.id), changes.reject(user.id, proposal.id)]));
  });

  await step('due annullamenti simultanei: un solo ripristino', async () => {
    const proposal = await propose(15);
    await changes.confirm(user.id, proposal.id);
    assertOneConflict(await Promise.allSettled([changes.undo(user.id, proposal.id), changes.undo(user.id, proposal.id)]));
  });

  console.log(`\n${passed} controlli di affidabilità superati`);
} finally {
  await db.inboundMessage.deleteMany({ where: { id: { startsWith: prefix } } });
  await db.whatsAppOutbound.deleteMany({ where: { recipient: { in: [phone, `${phone}1`] } } });
  if (business) await db.business.delete({ where: { id: business.id } });
  if (user) await db.user.delete({ where: { id: user.id } });
  await db.$disconnect();
}
