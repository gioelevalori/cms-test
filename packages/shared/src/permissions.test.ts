import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findClientViolations } from './permissions';
import { createBlock, type Block } from './blocks';

function page(): Block[] {
  const hero = createBlock('hero', 'b1');
  hero.locked = true;
  hero.editableFields = ['title', 'subtitle'];
  const text = createBlock('text', 'b2');
  return [hero, text];
}

test('il cliente può cambiare un campo modificabile', () => {
  const before = page();
  const after = structuredClone(before);
  (after[0].props as { title: string }).title = 'Pizzeria da Mario';
  assert.deepEqual(findClientViolations(before, after), []);
});

test('il cliente non può cambiare un campo non modificabile', () => {
  const before = page();
  const after = structuredClone(before);
  (after[0].props as { buttonUrl: string }).buttonUrl = 'https://altro.it';
  const v = findClientViolations(before, after);
  assert.equal(v.length, 1);
  assert.match(v[0].reason, /buttonUrl/);
});

test('il cliente non può eliminare un blocco bloccato', () => {
  const before = page();
  const after = [structuredClone(before[1])];
  assert.ok(findClientViolations(before, after).some((v) => v.blockId === 'b1'));
});

test('il cliente può eliminare un blocco non bloccato', () => {
  const before = page();
  const after = [structuredClone(before[0])];
  assert.deepEqual(findClientViolations(before, after), []);
});

test('il cliente non può aggiungere blocchi', () => {
  const before = page();
  const after = [...structuredClone(before), createBlock('text', 'b3')];
  assert.ok(findClientViolations(before, after).some((v) => v.blockId === 'b3'));
});

test('il cliente non può sbloccare un blocco', () => {
  const before = page();
  const after = structuredClone(before);
  after[0].locked = false;
  assert.ok(findClientViolations(before, after).length > 0);
});

test('il cliente non può spostare blocchi bloccati', () => {
  const before = page();
  before[1].locked = true;
  const after = [structuredClone(before[1]), structuredClone(before[0])];
  assert.ok(findClientViolations(before, after).some((v) => v.blockId === '*'));
});
