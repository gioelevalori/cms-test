import { createElement, useEffect, useRef, type FocusEvent, type KeyboardEvent } from 'react';

interface Props {
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
  as?: 'h1' | 'h2' | 'p' | 'span';
  multiline?: boolean;
  placeholder?: string;
}

/**
 * Testo modificabile direttamente sulla pagina (contentEditable).
 * Il valore viene salvato quando il campo perde il focus.
 */
export function EditableText({ value, editable, onChange, as = 'span', multiline = false, placeholder }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) ref.current.innerText = value;
  }, [value]);

  return createElement(as, {
    ref,
    className: editable ? 'editable' : undefined,
    contentEditable: editable,
    suppressContentEditableWarning: true,
    'data-placeholder': placeholder,
    onBlur: (e: FocusEvent<HTMLElement>) => {
      const next = e.currentTarget.innerText;
      if (next !== value) onChange(next);
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (!multiline && e.key === 'Enter') {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
  });
}
