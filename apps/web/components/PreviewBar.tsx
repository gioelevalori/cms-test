import type { PublicBusiness } from '../lib/api';

type Props = NonNullable<PublicBusiness['preview']> & { slug: string };

const STATUS: Record<Props['status'], string> = {
  proposed: 'Anteprima: queste modifiche non sono ancora sul sito. Confermale in chat o su WhatsApp.',
  applied: 'Questa modifica è già stata confermata ed è sul sito.',
  rejected: 'Questa modifica è stata annullata: il sito non è cambiato.',
  undone: 'Questa modifica è stata annullata dopo la conferma.',
};

/** Barra in cima all'anteprima: dice cosa cambia e che il sito vero non è ancora toccato. */
export function PreviewBar({ slug, status, summary }: Props) {
  return (
    <aside className={`preview-bar is-${status}`} aria-label="Anteprima delle modifiche">
      <div className="preview-bar-inner">
        <p className="preview-bar-status">{STATUS[status]}</p>
        {status === 'proposed' && summary.length > 0 && (
          <ul className="preview-bar-list">{summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
        )}
        <a className="preview-bar-link" href={`/${slug}`}>Vedi il sito attuale</a>
      </div>
    </aside>
  );
}
