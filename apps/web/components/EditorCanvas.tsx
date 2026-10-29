'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { isFromCanvas, moveInList, reorderVisible, resolveSite, type BusinessData, type EditTarget, type FromCanvas, type SectionId, type ToCanvas } from '@cms/shared';
import { Site } from './Site';

interface Props {
  initial: BusinessData;
  timezone: string;
  /** Da dove può arrivare la bozza: solo il pannello. */
  origins: string[];
}

interface Drag {
  id: SectionId;
  from: number;
  /** Posizione di arrivo tra i blocchi (0 = prima del primo). */
  to: number;
  x: number;
  y: number;
  /** Dove disegnare la linea d'inserimento, in coordinate dello schermo. */
  lineY: number;
}

const EDGE = 70;

/**
 * La pagina dentro l'editor del pannello: mostra la bozza che arriva dal pannello,
 * e le sezioni si trascinano, si selezionano, si spostano e si nascondono da qui.
 * Ogni azione torna al pannello come messaggio: è il pannello che tiene la bozza.
 */
export function EditorCanvas({ initial, timezone, origins }: Props) {
  const [data, setData] = useState(initial);
  const [selected, setSelected] = useState<EditTarget | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [canStructure, setCanStructure] = useState(false);
  const parentOrigin = useRef<string | null>(null);
  const blocks = useRef(new Map<SectionId, HTMLElement>());

  const post = useCallback((msg: FromCanvas) => {
    if (window.parent === window) return;
    // Finché il pannello non ha scritto, si prova su ogni indirizzo ammesso: arriva solo a quello giusto.
    for (const origin of parentOrigin.current ? [parentOrigin.current] : origins) window.parent.postMessage(msg, origin);
  }, [origins]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== window.parent || !origins.includes(e.origin)) return;
      parentOrigin.current = e.origin;
      const msg = e.data as ToCanvas;
      if (msg?.type === 'cms:data') {
        setData(msg.data);
        setCanStructure(msg.canStructure);
      }
      if (msg?.type === 'cms:select') {
        setSelected(msg.target);
        if (msg.scroll && msg.target) {
          const el = document.querySelector(`[data-edit-section="${msg.target}"], [data-edit-area="${msg.target}"]`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
    window.addEventListener('message', onMessage);
    post({ type: 'cms:ready' });
    return () => window.removeEventListener('message', onMessage);
  }, [origins, post]);

  // Nell'editor i link non portano via dalla pagina: un clic seleziona.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest('a')) e.preventDefault();
      if (target.closest('.edit-bar')) return;
      const el = target.closest<HTMLElement>('[data-edit-section], [data-edit-area]');
      const id = (el?.dataset.editSection ?? el?.dataset.editArea) as EditTarget | undefined;
      if (id) {
        setSelected(id);
        post({ type: 'cms:select', target: id });
      }
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [post]);

  /** Le sezioni sulla pagina, nell'ordine in cui si vedono. */
  const visibleIds = () => [...document.querySelectorAll<HTMLElement>('[data-edit-section]')].map((el) => el.dataset.editSection as SectionId);

  function commitOrder(visibleNew: SectionId[]) {
    const order = reorderVisible(resolveSite(data).order, visibleNew);
    setData({ ...data, site: { ...data.site, order } });
    post({ type: 'cms:order', order });
  }

  /** Dove cadrebbe un blocco lasciato all'altezza `y`, e dove va la linea. */
  function dropAt(y: number, ids: SectionId[]): { to: number; lineY: number } {
    const rects = ids.map((id) => blocks.current.get(id)!.getBoundingClientRect());
    let to = rects.findIndex((r) => y < r.top + r.height / 2);
    if (to < 0) to = rects.length;
    const lineY = to === 0 ? rects[0].top : rects[to - 1].bottom;
    return { to, lineY };
  }

  function startDrag(e: ReactPointerEvent, id: SectionId) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const ids = visibleIds();
    setSelected(id);
    setDrag({ id, from: ids.indexOf(id), x: e.clientX, y: e.clientY, ...dropAt(e.clientY, ids) });
  }

  function moveDrag(e: ReactPointerEvent) {
    if (!drag) return;
    // Vicino ai bordi la pagina scorre da sola, per portare il blocco lontano.
    if (e.clientY < EDGE) window.scrollBy(0, -14);
    else if (e.clientY > innerHeight - EDGE) window.scrollBy(0, 14);
    setDrag({ ...drag, x: e.clientX, y: e.clientY, ...dropAt(e.clientY, visibleIds()) });
  }

  function endDrag() {
    if (!drag) return;
    const ids = visibleIds();
    if (drag.to !== drag.from && drag.to !== drag.from + 1) commitOrder(moveInList(ids, drag.from, drag.to));
    setDrag(null);
    post({ type: 'cms:select', target: drag.id });
  }

  function step(id: SectionId, delta: -1 | 1) {
    const ids = visibleIds();
    const from = ids.indexOf(id);
    const to = from + delta;
    if (to < 0 || to >= ids.length) return;
    commitOrder(moveInList(ids, from, delta > 0 ? to + 1 : to));
  }

  const wrap = (id: SectionId, title: string, node: ReactNode, at: number, total: number) => {
    return (
      <div
        className={`edit-block ${selected === id ? 'is-selected' : ''} ${drag?.id === id ? 'is-dragging' : ''}`}
        data-edit-section={id}
        ref={(el) => { if (el) blocks.current.set(id, el); else blocks.current.delete(id); }}
      >
        <div className="edit-bar" role="toolbar" aria-label={`Sezione ${title}`}>
          {canStructure && (<>
          <button
            type="button"
            className="edit-handle"
            aria-label={`Trascina ${title}`}
            onPointerDown={(e) => startDrag(e, id)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={() => setDrag(null)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
          </button>
          </>)}
          <span className="edit-title">{title}</span>
          {canStructure && (<>
          <button type="button" aria-label={`Sposta ${title} più su`} disabled={at === 0} onClick={() => step(id, -1)}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m6 15 6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" aria-label={`Sposta ${title} più giù`} disabled={at === total - 1} onClick={() => step(id, 1)}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" aria-label={`Nascondi ${title}`} onClick={() => post({ type: 'cms:hide', section: id })}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M7.4 7.5C4.8 9 3 12 3 12s3.5 6.5 9 6.5c1.7 0 3.2-.5 4.5-1.2M10 5.7c.7-.1 1.3-.2 2-.2 5.5 0 9 6.5 9 6.5a17 17 0 0 1-2.3 3.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          </>)}
        </div>
        {node}
      </div>
    );
  };

  return (
    <div className={`edit-root ${drag ? 'is-dragging' : ''}`} data-selected={selected ?? undefined}>
      <Site data={data} timezone={timezone} edit={{ wrap }} />
      {drag && (
        <>
          <div className="edit-drop-line" style={{ top: drag.lineY }} aria-hidden="true" />
          <div className="edit-ghost" style={{ left: drag.x + 14, top: drag.y + 14 }} aria-hidden="true">
            {resolveSite(data).titles[drag.id]}
          </div>
        </>
      )}
    </div>
  );
}
