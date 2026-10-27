import type { Block } from './blocks';

export interface Violation {
  blockId: string;
  reason: string;
}

const isEqual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Controlla che un utente "client" abbia cambiato solo ciò che gli è permesso.
 * Funzione pura: la usa l'API per rifiutare le modifiche e l'admin per mostrarle in anticipo.
 * Restituisce un array vuoto se la modifica è ammessa.
 */
export function findClientViolations(before: Block[], after: Block[]): Violation[] {
  const violations: Violation[] = [];
  const beforeById = new Map(before.map((b) => [b.id, b]));
  const afterById = new Map(after.map((b) => [b.id, b]));

  // 1. Blocchi bloccati rimossi
  for (const old of before) {
    if (old.locked && !afterById.has(old.id)) {
      violations.push({ blockId: old.id, reason: 'Un blocco bloccato non può essere eliminato' });
    }
  }

  // 2. Blocchi nuovi: il cliente non può aggiungerne
  for (const next of after) {
    if (!beforeById.has(next.id)) {
      violations.push({ blockId: next.id, reason: 'Solo il costruttore può aggiungere blocchi' });
    }
  }

  // 3. Ordine dei blocchi bloccati
  const lockedOrderBefore = before.filter((b) => b.locked && afterById.has(b.id)).map((b) => b.id);
  const lockedOrderAfter = after.filter((b) => beforeById.get(b.id)?.locked).map((b) => b.id);
  if (!isEqual(lockedOrderBefore, lockedOrderAfter)) {
    violations.push({ blockId: '*', reason: 'I blocchi bloccati non possono essere spostati' });
  }

  // 4. Struttura e campi di ogni blocco esistente
  for (const next of after) {
    const old = beforeById.get(next.id);
    if (!old) continue;

    if (old.type !== next.type) {
      violations.push({ blockId: next.id, reason: 'Il tipo del blocco non può cambiare' });
    }
    if (old.locked !== next.locked) {
      violations.push({ blockId: next.id, reason: 'Solo il costruttore può bloccare o sbloccare' });
    }
    if (!isEqual([...old.editableFields].sort(), [...next.editableFields].sort())) {
      violations.push({ blockId: next.id, reason: 'Solo il costruttore può cambiare i campi modificabili' });
    }

    const allowed = new Set<string>(old.editableFields);
    const keys = new Set([...Object.keys(old.props), ...Object.keys(next.props)]);
    for (const key of keys) {
      const changed = !isEqual((old.props as Record<string, unknown>)[key], (next.props as Record<string, unknown>)[key]);
      if (changed && !allowed.has(key)) {
        violations.push({ blockId: next.id, reason: `Il campo "${key}" non è modificabile` });
      }
    }
  }

  return violations;
}
