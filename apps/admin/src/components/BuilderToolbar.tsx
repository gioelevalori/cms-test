import { BLOCK_DEFINITIONS, type Block } from '@cms/shared';

interface Props {
  block: Block;
  onChange: (block: Block) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
}

/** Comandi visibili solo al costruttore: blocco del design e campi aperti al cliente. */
export function BuilderToolbar({ block, onChange, onMove, onDelete }: Props) {
  const def = BLOCK_DEFINITIONS[block.type];
  const fields = Object.entries(def.fields) as [string, { label: string }][];

  const toggleField = (field: string) => {
    const set = new Set<string>(block.editableFields);
    set.has(field) ? set.delete(field) : set.add(field);
    onChange({ ...block, editableFields: [...set] });
  };

  return (
    <div className="toolbar">
      <strong>{def.label}</strong>
      <label className="lock">
        <input type="checkbox" checked={block.locked} onChange={(e) => onChange({ ...block, locked: e.target.checked })} />
        Bloccato
      </label>
      <span className="fields">
        Il cliente può modificare:
        {fields.map(([key, f]) => (
          <label key={key}>
            <input type="checkbox" checked={block.editableFields.includes(key)} onChange={() => toggleField(key)} />
            {f.label}
          </label>
        ))}
      </span>
      <span className="actions">
        <button className="ghost" onClick={() => onMove(-1)} title="Sposta su">↑</button>
        <button className="ghost" onClick={() => onMove(1)} title="Sposta giù">↓</button>
        <button className="ghost danger" onClick={onDelete} title="Elimina">✕</button>
      </span>
    </div>
  );
}
