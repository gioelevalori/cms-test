import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BLOCK_DEFINITIONS,
  canEditStructure,
  createBlock,
  findClientViolations,
  type AnyBlock,
  type Block,
  type BlockType,
} from '@cms/shared';
import { api, ApiError } from '../api/client';
import { BlockView } from '../components/BlockView';
import { BuilderToolbar } from '../components/BuilderToolbar';

const newId = () => `b_${Math.random().toString(36).slice(2, 8)}`;

export function PageEditorPage() {
  const { siteId = '', pageId = '' } = useParams();
  const qc = useQueryClient();
  const { data: page } = useQuery({ queryKey: ['page', pageId], queryFn: () => api.page(siteId, pageId) });

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (page) setBlocks(page.draft);
  }, [page]);

  const isBuilder = page ? canEditStructure(page.role) : false;
  const dirty = page ? JSON.stringify(page.draft) !== JSON.stringify(blocks) : false;

  // Stesso controllo del server: il cliente vede subito se una modifica non è permessa.
  const violations = useMemo(
    () => (page && !isBuilder ? findClientViolations(page.draft, blocks) : []),
    [page, blocks, isBuilder],
  );

  const replace = (i: number, b: Block) => setBlocks((bs) => bs.map((x, j) => (j === i ? b : x)));
  const move = (i: number, dir: -1 | 1) =>
    setBlocks((bs) => {
      const j = i + dir;
      if (j < 0 || j >= bs.length) return bs;
      const next = [...bs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const remove = (i: number) => setBlocks((bs) => bs.filter((_, j) => j !== i));
  const add = (type: BlockType) => setBlocks((bs) => [...bs, createBlock(type, newId())]);

  async function save(publish: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      if (dirty) await api.saveDraft(siteId, pageId, blocks);
      if (publish) await api.publish(siteId, pageId);
      await qc.invalidateQueries({ queryKey: ['page', pageId] });
      setMessage(publish ? 'Pubblicato' : 'Bozza salvata');
    } catch (err) {
      const e = err as ApiError;
      setMessage(e.body?.violations?.map((v) => v.reason).join('; ') ?? e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!page) return <p className="container">Caricamento…</p>;

  return (
    <div className="editor">
      <header className="editor-bar">
        <Link to={`/sites/${siteId}`}>← Pagine</Link>
        <strong>{page.title}</strong>
        <span className="badge">{isBuilder ? 'Modalità Costruttore' : 'Modalità Cliente'}</span>
        <span className="spacer" />
        {message && <span className="msg">{message}</span>}
        <button className="ghost" disabled={busy || !dirty || violations.length > 0} onClick={() => save(false)}>Salva bozza</button>
        <button disabled={busy || violations.length > 0} onClick={() => save(true)}>Pubblica</button>
      </header>

      {violations.length > 0 && (
        <div className="violations">{violations.map((v, i) => <p key={i}>{v.reason}</p>)}</div>
      )}

      <main className="canvas">
        {blocks.map((block, i) => {
          const allowed = new Set<string>(block.editableFields);
          return (
            <div key={block.id} className={`block ${block.locked ? 'locked' : ''}`}>
              {isBuilder && (
                <BuilderToolbar block={block} onChange={(b) => replace(i, b)} onMove={(d) => move(i, d)} onDelete={() => remove(i)} />
              )}
              <BlockView
                block={block as AnyBlock}
                canEdit={(field) => isBuilder || allowed.has(field)}
                onChange={(b) => replace(i, b)}
              />
            </div>
          );
        })}

        {isBuilder && (
          <div className="add-block">
            Aggiungi blocco:
            {(Object.keys(BLOCK_DEFINITIONS) as BlockType[]).map((t) => (
              <button key={t} className="ghost" onClick={() => add(t)}>{BLOCK_DEFINITIONS[t].label}</button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
