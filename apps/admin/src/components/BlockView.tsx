import type { AnyBlock, Block, BlockPropsMap } from '@cms/shared';
import { EditableText } from './EditableText';

interface Props {
  block: AnyBlock;
  /** Il campo è modificabile da chi sta guardando? */
  canEdit: (field: string) => boolean;
  onChange: (block: Block) => void;
}

/** Disegna un blocco come apparirà sul sito, con i campi modificabili cliccabili. */
export function BlockView({ block, canEdit, onChange }: Props) {
  const set = <T extends AnyBlock['type']>(field: keyof BlockPropsMap[T], value: unknown) =>
    onChange({ ...block, props: { ...block.props, [field]: value } } as Block);

  const text = (field: string, value: string, as: 'h1' | 'h2' | 'p' | 'span' = 'span', multiline = false) => (
    <EditableText as={as} value={value} editable={canEdit(field)} multiline={multiline} placeholder={field} onChange={(v) => set(field as never, v)} />
  );

  switch (block.type) {
    case 'hero':
      return (
        <section className="b-hero">
          {text('title', block.props.title, 'h1')}
          {text('subtitle', block.props.subtitle, 'p')}
          <span className="b-button">{text('buttonText', block.props.buttonText)}</span>
        </section>
      );
    case 'text':
      return (
        <section className="b-text">
          {text('heading', block.props.heading, 'h2')}
          {text('body', block.props.body, 'p', true)}
        </section>
      );
    case 'image':
      return (
        <figure className="b-image">
          {block.props.src ? <img src={block.props.src} alt={block.props.alt} /> : <div className="placeholder">Nessuna immagine</div>}
          {canEdit('src') && (
            <input placeholder="URL immagine" defaultValue={block.props.src ?? ''} onBlur={(e) => set('src' as never, e.target.value || null)} />
          )}
          <figcaption>{text('caption', block.props.caption)}</figcaption>
        </figure>
      );
    case 'gallery':
      return (
        <section className="b-gallery">
          {block.props.images.length === 0 && <div className="placeholder">Galleria vuota (editor immagini in arrivo)</div>}
          {block.props.images.map((img, i) => <img key={i} src={img.src} alt={img.alt} />)}
        </section>
      );
    case 'contacts':
      return (
        <section className="b-contacts">
          <h2>Contatti</h2>
          <p>{text('address', block.props.address)}</p>
          <p>Tel. {text('phone', block.props.phone)}</p>
          <p>{text('email', block.props.email)}</p>
          {text('hours', block.props.hours, 'p', true)}
        </section>
      );
    case 'pricing': {
      const items = block.props.items;
      const editItems = canEdit('items');
      const update = (i: number, key: 'name' | 'price' | 'description', v: string) =>
        set('items' as never, items.map((it, j) => (j === i ? { ...it, [key]: v } : it)));
      return (
        <section className="b-pricing">
          {text('heading', block.props.heading, 'h2')}
          <ul>
            {items.map((it, i) => (
              <li key={i}>
                <EditableText value={it.name} editable={editItems} onChange={(v) => update(i, 'name', v)} />
                <EditableText value={it.price} editable={editItems} onChange={(v) => update(i, 'price', v)} />
              </li>
            ))}
          </ul>
          {editItems && (
            <button className="ghost" onClick={() => set('items' as never, [...items, { name: 'Nuova voce', price: '0 €', description: '' }])}>
              + Aggiungi voce
            </button>
          )}
        </section>
      );
    }
  }
}
