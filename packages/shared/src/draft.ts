import type { ChangeOp } from './operations';

/**
 * Chiave delle operazioni che si sostituiscono: di due "colore del sito" conta l'ultimo,
 * di due ordini delle sezioni conta l'ultimo. Le altre (aggiungi una foto…) si sommano.
 */
function replaceKey(op: ChangeOp): string | null {
  switch (op.op) {
    case 'setLook':
    case 'setAccent':
    case 'setTagline':
    case 'setHighlights':
    case 'setSectionOrder':
    case 'setPhotoOrder':
    case 'setCover':
    case 'setLogo':
      return op.op;
    case 'setSectionVisible':
    case 'setSectionTitle':
      return `${op.op}:${op.section}`;
    case 'setLink':
      return `${op.op}:${op.network}`;
    case 'setContact':
      return `${op.op}:${op.field}`;
    default:
      return null;
  }
}

/**
 * La bozza dell'editor come poche modifiche leggibili: per ogni chiave resta l'ultima,
 * nella posizione dell'ultima (così un ordine delle sezioni viene dopo le sezioni mostrate).
 * Gli spostamenti su/giù diventano superflui se dopo c'è un ordine completo.
 */
export function compactOps(ops: ChangeOp[]): ChangeOp[] {
  const lastAt = new Map<string, number>();
  ops.forEach((op, i) => {
    const key = replaceKey(op);
    if (key) lastAt.set(key, i);
  });
  const finalOrderAt = lastAt.get('setSectionOrder') ?? -1;
  return ops.filter((op, i) => {
    if (op.op === 'moveSection' && i < finalOrderAt) return false;
    const key = replaceKey(op);
    return key === null || lastAt.get(key) === i;
  });
}
