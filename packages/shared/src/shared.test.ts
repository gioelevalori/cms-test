import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interpretMessage, applyOps, describeOp, toSchemaOrg, nextWeekday, weekdayOf, isValidOp, type BusinessData } from './index';

// Martedì 27 ottobre 2026
const TODAY = '2026-10-27';

function sample(): BusinessData {
  return {
    name: 'Pizzeria da Mario',
    category: 'restaurant',
    description: 'Pizzeria di famiglia',
    phone: '085 000000',
    email: 'info@example.com',
    address: 'Via Roma 1, Penne',
    openingHours: [
      { weekday: 2, opens: '19:00', closes: '23:30' },
      { weekday: 6, opens: '12:00', closes: '14:30' },
      { weekday: 6, opens: '19:00', closes: '23:30' },
    ],
    specialHours: [],
    catalog: [
      { id: 'c1', section: 'Pizze', name: 'Margherita', description: '', price: 6, available: true },
      { id: 'c2', section: 'Pizze', name: 'Margherita bufala', description: '', price: 8, available: true },
      { id: 'c3', section: 'Primi', name: 'Carbonara', description: '', price: 11, available: true },
    ],
    posts: [],
  };
}

let n = 0;
const ids = () => `id${++n}`;

test('date: weekday e prossimo sabato', () => {
  assert.equal(weekdayOf(TODAY), 2);
  assert.equal(nextWeekday(TODAY, 6), '2026-10-31');
  assert.equal(nextWeekday(TODAY, 2), TODAY);
});

test('"sabato chiudiamo alle 15" = orario speciale solo questo sabato', () => {
  const r = interpretMessage('Sabato chiudiamo alle 15', sample(), TODAY);
  assert.deepEqual(r.unrecognized, []);
  assert.deepEqual(r.ops, [{ op: 'setSpecialHours', date: '2026-10-31', closed: false, opens: '12:00', closes: '15:00', note: null }]);
});

test('"domani siamo chiusi per inventario"', () => {
  const r = interpretMessage('Domani siamo chiusi per inventario', sample(), TODAY);
  assert.deepEqual(r.ops, [{ op: 'setSpecialHours', date: '2026-10-28', closed: true, opens: null, closes: null, note: 'inventario' }]);
});

test('"il 25 dicembre chiusi" e date numeriche', () => {
  assert.equal((interpretMessage('il 25 dicembre chiusi', sample(), TODAY).ops[0] as { date: string }).date, '2026-12-25');
  assert.equal((interpretMessage('6/1 chiusi', sample(), TODAY).ops[0] as { date: string }).date, '2027-01-06');
});

test('intervallo di ferie', () => {
  const r = interpretMessage('Dal 30 dicembre al 2 gennaio chiusi per ferie', sample(), TODAY);
  assert.equal(r.ops.length, 4);
  assert.equal((r.ops[3] as { date: string }).date, '2027-01-02');
});

test('settimanale: "il lunedì siamo chiusi" e "ogni domenica dalle 12 alle 15 e dalle 19 alle 23"', () => {
  assert.deepEqual(interpretMessage('il lunedì siamo chiusi', sample(), TODAY).ops, [{ op: 'setWeeklyHours', weekday: 1, slots: [] }]);
  assert.deepEqual(interpretMessage('ogni domenica dalle 12 alle 15 e dalle 19 alle 23', sample(), TODAY).ops, [
    { op: 'setWeeklyHours', weekday: 7, slots: [{ opens: '12:00', closes: '15:00' }, { opens: '19:00', closes: '23:00' }] },
  ]);
});

test('settimanale con solo chiusura modifica l\'ultima fascia', () => {
  const r = interpretMessage('tutti i sabati chiudiamo alle 23', sample(), TODAY);
  assert.deepEqual(r.ops, [{ op: 'setWeeklyHours', weekday: 6, slots: [{ opens: '12:00', closes: '14:30' }, { opens: '19:00', closes: '23:00' }] }]);
});

test('chiusura prima dell\'apertura: non capito invece di 19:00–18:00', () => {
  // Il martedì si apre alle 19
  for (const msg of ['Martedì chiudiamo alle 18', 'il martedì chiudiamo alle 18', 'martedì apriamo alle 23:45']) {
    const r = interpretMessage(msg, sample(), TODAY);
    assert.deepEqual(r.ops, [], msg);
    assert.deepEqual(r.unrecognized, [msg]);
  }
});

test('chiusura a metà giornata toglie le fasce successive; dopo mezzanotte allunga', () => {
  assert.deepEqual(interpretMessage('il sabato chiudiamo alle 15', sample(), TODAY).ops, [
    { op: 'setWeeklyHours', weekday: 6, slots: [{ opens: '12:00', closes: '15:00' }] },
  ]);
  assert.deepEqual(interpretMessage('sabato apriamo alle 18', sample(), TODAY).ops, [
    { op: 'setSpecialHours', date: '2026-10-31', closed: false, opens: '18:00', closes: '23:30', note: null },
  ]);
  assert.deepEqual(interpretMessage('stasera chiudiamo alle 2', sample(), TODAY).ops, [
    { op: 'setSpecialHours', date: TODAY, closed: false, opens: '19:00', closes: '02:00', note: null },
  ]);
});

test('torna l\'orario normale', () => {
  assert.deepEqual(interpretMessage('sabato orario normale', sample(), TODAY).ops, [{ op: 'removeSpecialHours', date: '2026-10-31' }]);
});

test('prezzo: sceglie la voce con il nome più lungo', () => {
  assert.deepEqual(interpretMessage('La margherita bufala costa 9 euro', sample(), TODAY).ops, [{ op: 'setItemPrice', itemId: 'c2', price: 9 }]);
  assert.deepEqual(interpretMessage('margherita a 6,50€', sample(), TODAY).ops, [{ op: 'setItemPrice', itemId: 'c1', price: 6.5 }]);
});

test('disponibilità', () => {
  assert.deepEqual(interpretMessage('La carbonara è finita', sample(), TODAY).ops, [{ op: 'setItemAvailability', itemId: 'c3', available: false }]);
  assert.deepEqual(interpretMessage('la carbonara è di nuovo disponibile', sample(), TODAY).ops, [{ op: 'setItemAvailability', itemId: 'c3', available: true }]);
});

test('aggiunta e rimozione dal menu', () => {
  assert.deepEqual(interpretMessage('Aggiungi al menu la diavola a 8 euro nella sezione pizze', sample(), TODAY).ops, [
    { op: 'addCatalogItem', section: 'Pizze', name: 'Diavola', description: '', price: 8 },
  ]);
  assert.deepEqual(interpretMessage('togli la carbonara', sample(), TODAY).ops, [{ op: 'removeCatalogItem', itemId: 'c3' }]);
});

test('contatti', () => {
  assert.deepEqual(interpretMessage('Il nuovo numero di telefono è 333 1234567', sample(), TODAY).ops, [{ op: 'setContact', field: 'phone', value: '333 1234567' }]);
  assert.deepEqual(interpretMessage('nuova email: ciao@pizzeria.it', sample(), TODAY).ops, [{ op: 'setContact', field: 'email', value: 'ciao@pizzeria.it' }]);
});

test('notizie ed eventi', () => {
  const r = interpretMessage('Evento il 12 novembre: serata jazz dal vivo', sample(), TODAY);
  assert.deepEqual(r.ops, [{ op: 'addPost', kind: 'event', title: 'Serata jazz dal vivo', body: 'Serata jazz dal vivo', startsAt: '2026-11-12', endsAt: null }]);
});

test('più frasi in un messaggio e frasi non capite', () => {
  const r = interpretMessage('Sabato chiudiamo alle 15. La carbonara è finita. Ciao a tutti!', sample(), TODAY);
  assert.equal(r.ops.length, 2);
  assert.deepEqual(r.unrecognized, ['Ciao a tutti']);
});

test('applyOps è puro e applica tutte le operazioni', () => {
  const data = sample();
  const { ops } = interpretMessage('Sabato chiudiamo alle 15. La carbonara è finita. Aggiungi la diavola a 8 euro', data, TODAY);
  const next = applyOps(data, ops, ids);
  assert.equal(data.specialHours.length, 0, 'input non modificato');
  assert.equal(next.specialHours[0].closes, '15:00');
  assert.equal(next.catalog.find((i) => i.id === 'c3')!.available, false);
  assert.equal(next.catalog.at(-1)!.name, 'Diavola');
});

test('describeOp in italiano', () => {
  const data = sample();
  assert.equal(describeOp({ op: 'setItemPrice', itemId: 'c1', price: 7 }, data), 'Margherita: nuovo prezzo 7,00 €');
  assert.equal(describeOp({ op: 'setSpecialHours', date: '2026-10-31', closed: true, opens: null, closes: null, note: null }, data), '31 ottobre 2026: chiuso');
});

test('isValidOp rifiuta fasce impossibili ma accetta quelle dopo mezzanotte', () => {
  assert.equal(isValidOp({ op: 'setSpecialHours', date: TODAY, closed: false, opens: '19:00', closes: '18:00', note: null }), false);
  assert.equal(isValidOp({ op: 'setWeeklyHours', weekday: 5, slots: [{ opens: '19:00', closes: '02:00' }] }), true);
});

test('isValidOp rifiuta operazioni malformate', () => {
  assert.equal(isValidOp({ op: 'setItemPrice', itemId: 'c1', price: 7 }), true);
  assert.equal(isValidOp({ op: 'setItemPrice', itemId: 'c1', price: -1 }), false);
  assert.equal(isValidOp({ op: 'setSpecialHours', date: '31/10', closed: true, opens: null, closes: null, note: null }), false);
  assert.equal(isValidOp({ op: 'dropDatabase' }), false);
});

test('schema.org con orari e menu', () => {
  const s = toSchemaOrg(sample(), 'https://example.com') as { '@type': string; openingHoursSpecification: unknown[] };
  assert.equal(s['@type'], 'Restaurant');
  assert.equal(s.openingHoursSpecification.length, 3);
});
