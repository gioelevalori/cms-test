import { BadRequestException } from '@nestjs/common';
import { BLOCK_DEFINITIONS, isBlockType, type Block } from '@cms/shared';

/** Controllo strutturale minimo dei blocchi arrivati dal client. */
export function parseBlocks(input: unknown[]): Block[] {
  const ids = new Set<string>();
  return input.map((raw, i) => {
    const b = raw as Partial<Block>;
    if (!b || typeof b !== 'object') throw new BadRequestException(`Blocco ${i} non valido`);
    if (typeof b.id !== 'string' || !b.id) throw new BadRequestException(`Blocco ${i}: id mancante`);
    if (ids.has(b.id)) throw new BadRequestException(`Id duplicato: ${b.id}`);
    ids.add(b.id);
    if (!isBlockType(b.type)) throw new BadRequestException(`Blocco ${b.id}: tipo sconosciuto`);
    if (typeof b.locked !== 'boolean') throw new BadRequestException(`Blocco ${b.id}: "locked" mancante`);
    if (!b.props || typeof b.props !== 'object') throw new BadRequestException(`Blocco ${b.id}: props mancanti`);
    const known = Object.keys(BLOCK_DEFINITIONS[b.type].fields);
    if (!Array.isArray(b.editableFields) || b.editableFields.some((f) => !known.includes(f as string))) {
      throw new BadRequestException(`Blocco ${b.id}: editableFields non validi`);
    }
    return b as Block;
  });
}
