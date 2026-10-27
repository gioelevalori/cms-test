export const ROLES = ['owner', 'builder', 'client'] as const;
export type Role = (typeof ROLES)[number];

/** owner e builder possono cambiare la struttura del sito; client solo i contenuti sbloccati. */
export function canEditStructure(role: Role): boolean {
  return role === 'owner' || role === 'builder';
}
