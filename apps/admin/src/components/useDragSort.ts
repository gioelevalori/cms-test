import { useState, type DragEvent } from 'react';
import { moveInList } from '@cms/shared';

/**
 * Liste da riordinare trascinando (sezioni, foto). `axis` dice se si decide prima/dopo
 * guardando l'altezza (liste) o la larghezza (griglie). Gli elementi mostrano dove cadrà il blocco
 * con data-drop="before" | "after"; quello trascinato ha data-dragging.
 */
export function useDragSort<T>(items: T[], key: (item: T) => string, onSort: (next: T[]) => void, axis: 'x' | 'y' = 'y') {
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<{ index: number; after: boolean } | null>(null);

  const reset = () => {
    setDragging(null);
    setOver(null);
  };

  function drop() {
    const from = items.findIndex((i) => key(i) === dragging);
    if (from >= 0 && over) {
      const to = over.after ? over.index + 1 : over.index;
      if (to !== from && to !== from + 1) onSort(moveInList(items, from, to));
    }
    reset();
  }

  const itemProps = (item: T, index: number) => ({
    draggable: true,
    'data-dragging': dragging === key(item) || undefined,
    'data-drop': over?.index === index && dragging && dragging !== key(item) ? (over.after ? 'after' : 'before') : undefined,
    onDragStart: (e: DragEvent) => {
      setDragging(key(item));
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', key(item));
    },
    onDragOver: (e: DragEvent<HTMLElement>) => {
      if (!dragging) return;
      e.preventDefault();
      const r = e.currentTarget.getBoundingClientRect();
      const after = axis === 'x' ? e.clientX > r.left + r.width / 2 : e.clientY > r.top + r.height / 2;
      if (over?.index !== index || over.after !== after) setOver({ index, after });
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      drop();
    },
    onDragEnd: reset,
  });

  return { itemProps, dragging: dragging !== null };
}
