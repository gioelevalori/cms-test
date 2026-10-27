import type { AnyBlock, Block } from '@cms/shared';

function BlockRenderer({ block }: { block: AnyBlock }) {
  switch (block.type) {
    case 'hero':
      return (
        <section className="b-hero">
          <h1>{block.props.title}</h1>
          <p>{block.props.subtitle}</p>
          {block.props.buttonText && <a className="b-button" href={block.props.buttonUrl}>{block.props.buttonText}</a>}
        </section>
      );
    case 'text':
      return (
        <section className="b-text">
          <h2>{block.props.heading}</h2>
          {block.props.body.split('\n').map((line, i) => <p key={i}>{line}</p>)}
        </section>
      );
    case 'image':
      return block.props.src ? (
        <figure className="b-image">
          <img src={block.props.src} alt={block.props.alt} />
          {block.props.caption && <figcaption>{block.props.caption}</figcaption>}
        </figure>
      ) : null;
    case 'gallery':
      return (
        <section className="b-gallery">
          {block.props.images.map((img, i) => <img key={i} src={img.src} alt={img.alt} />)}
        </section>
      );
    case 'contacts':
      return (
        <section className="b-contacts" id="contatti">
          <h2>Contatti</h2>
          <p>{block.props.address}</p>
          {block.props.phone && <p>Tel. <a href={`tel:${block.props.phone.replace(/\s/g, '')}`}>{block.props.phone}</a></p>}
          {block.props.email && <p><a href={`mailto:${block.props.email}`}>{block.props.email}</a></p>}
          {block.props.hours && <p>{block.props.hours}</p>}
        </section>
      );
    case 'pricing':
      return (
        <section className="b-pricing">
          <h2>{block.props.heading}</h2>
          <ul>
            {block.props.items.map((it, i) => (
              <li key={i}><span>{it.name}</span><span>{it.price}</span></li>
            ))}
          </ul>
        </section>
      );
  }
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return <>{blocks.map((b) => <BlockRenderer key={b.id} block={b as AnyBlock} />)}</>;
}
