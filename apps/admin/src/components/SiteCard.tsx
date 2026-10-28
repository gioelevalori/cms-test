import { useEffect, useState, type CSSProperties } from 'react';
import { COLORS, LINKS, LOOKS, SECTIONS, linkUrl, resolveSite, type BusinessData, type ChangeOp, type LinkId, type SectionId } from '@cms/shared';

interface Props {
  data: BusinessData;
  /** Stile, colore e sezioni: solo titolare del sito o costruttore. */
  canStructure: boolean;
  busy: boolean;
  onOps: (ops: ChangeOp[]) => void;
}

// Un campione per tinta, senza doppioni (oro e giallo hanno lo stesso colore).
const SWATCHES = Object.entries(COLORS).filter(([, hex], i, all) => all.findIndex(([, h]) => h === hex) === i);

/** Aspetto del sito: ogni scelta è una modifica normale, quindi compare in cronologia e si annulla. */
export function SiteCard({ data, canStructure, busy, onOps }: Props) {
  const site = resolveSite(data);
  const [tagline, setTagline] = useState(site.tagline);
  const [highlights, setHighlights] = useState(() => [0, 1, 2].map((i) => site.highlights[i] ?? ''));
  const [links, setLinks] = useState<Partial<Record<LinkId, string>>>(site.links);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Quando i dati cambiano da fuori (WhatsApp, annulla), i campi si riallineano.
  useEffect(() => setTagline(site.tagline), [site.tagline]);
  useEffect(() => setHighlights([0, 1, 2].map((i) => site.highlights[i] ?? '')), [site.highlights.join('|')]);
  useEffect(() => setLinks(site.links), [JSON.stringify(site.links)]);

  function saveLink(id: LinkId) {
    setLinkError(null);
    const value = (links[id] ?? '').trim();
    if (value === (site.links[id] ?? '')) return;
    if (!value) return onOps([{ op: 'setLink', network: id, url: null }]);
    const url = linkUrl(id, value)?.replace(/^http:\/\//i, 'https://');
    if (!url) return setLinkError(`Indirizzo ${LINKS.find((l) => l.id === id)?.label} non valido: scrivi @nome oppure l'indirizzo completo.`);
    if (url !== site.links[id]) onOps([{ op: 'setLink', network: id, url }]);
  }

  const savedHighlights = highlights.map((h) => h.trim()).filter(Boolean);
  const move = (section: SectionId, to: 'up' | 'down') => onOps([{ op: 'moveSection', section, to }]);

  return (
    <section className="card site-card">
      <h2>Aspetto del sito</h2>

      {canStructure && (
        <>
          <h3>Stile</h3>
          <div className="look-grid" role="group" aria-label="Stile del sito">
            {LOOKS.map((l) => (
              <button
                key={l.id}
                type="button"
                className={`look ${site.look === l.id ? 'is-on' : ''}`}
                aria-pressed={site.look === l.id}
                disabled={busy}
                onClick={() => site.look !== l.id && onOps([{ op: 'setLook', look: l.id }])}
              >
                <span className="look-sample" style={{ fontFamily: l.font } as CSSProperties}>Aa</span>
                <span className="look-name">{l.label}</span>
                <span className="look-desc">{l.description}</span>
              </button>
            ))}
          </div>

          <h3>Colore</h3>
          <div className="swatches" role="group" aria-label="Colore del sito">
            {SWATCHES.map(([name, hex]) => (
              <button
                key={hex}
                type="button"
                className={`swatch ${site.accent === hex ? 'is-on' : ''}`}
                style={{ background: hex }}
                aria-label={name}
                aria-pressed={site.accent === hex}
                title={name}
                disabled={busy}
                onClick={() => site.accent !== hex && onOps([{ op: 'setAccent', color: hex }])}
              />
            ))}
            <label className="swatch-custom" title="Un altro colore">
              <input type="color" value={site.accent} disabled={busy} onChange={(e) => onOps([{ op: 'setAccent', color: e.target.value }])} />
              <span>Altro</span>
            </label>
          </div>
        </>
      )}

      <h3>Testi</h3>
      <label>
        Frase sotto il nome
        <input value={tagline} maxLength={160} placeholder="Es. Forno a legna dal 1985" onChange={(e) => setTagline(e.target.value)} />
      </label>
      {tagline.trim() !== site.tagline && (
        <button className="small" disabled={busy} onClick={() => onOps([{ op: 'setTagline', text: tagline }])}>Salva la frase</button>
      )}
      <fieldset className="highlights">
        <legend>Punti di forza (fino a tre)</legend>
        {highlights.map((h, i) => (
          <input
            key={i}
            value={h}
            maxLength={80}
            placeholder={['Es. Forno a legna', 'Es. Parcheggio gratuito', 'Es. Si prenota su WhatsApp'][i]}
            aria-label={`Punto di forza ${i + 1}`}
            onChange={(e) => setHighlights(highlights.map((x, j) => (j === i ? e.target.value : x)))}
          />
        ))}
        {savedHighlights.join('|') !== site.highlights.join('|') && (
          <button className="small" disabled={busy} onClick={() => onOps([{ op: 'setHighlights', items: savedHighlights }])}>Salva i punti di forza</button>
        )}
      </fieldset>

      {canStructure && (
        <>
          <h3>Sezioni</h3>
          <ol className="section-list">
            {site.order.map((id, i) => (
              <li key={id} className={site.hidden.includes(id) ? 'is-hidden' : ''}>
                <span className="section-toggle">
                  <input
                    type="checkbox"
                    checked={!site.hidden.includes(id)}
                    aria-label={`Mostra la sezione ${site.titles[id]}`}
                    disabled={busy}
                    onChange={(e) => onOps([{ op: 'setSectionVisible', section: id, visible: e.target.checked }])}
                  />
                  <SectionTitle
                    title={site.titles[id]}
                    fallback={SECTIONS.find((s) => s.id === id)!.label}
                    disabled={busy}
                    onSave={(title) => onOps([{ op: 'setSectionTitle', section: id, title }])}
                  />
                </span>
                <span className="section-moves">
                  <button className="ghost small" disabled={busy || i === 0} onClick={() => move(id, 'up')} aria-label={`Sposta ${site.titles[id]} più su`}>↑</button>
                  <button className="ghost small" disabled={busy || i === site.order.length - 1} onClick={() => move(id, 'down')} aria-label={`Sposta ${site.titles[id]} più giù`}>↓</button>
                </span>
              </li>
            ))}
          </ol>
          <p className="hint">Le sezioni senza contenuto non compaiono sul sito finché non aggiungi qualcosa.</p>
        </>
      )}

      <h3>Social</h3>
      <div className="links">
        {LINKS.map((l) => (
          <label key={l.id}>
            {l.label}
            <input
              value={links[l.id] ?? ''}
              placeholder={l.id === 'website' ? 'www.esempio.it' : '@nome'}
              onChange={(e) => setLinks({ ...links, [l.id]: e.target.value })}
              onBlur={() => saveLink(l.id)}
              onKeyDown={(e) => e.key === 'Enter' && saveLink(l.id)}
              disabled={busy}
            />
          </label>
        ))}
      </div>
      {linkError && <p className="error">{linkError}</p>}

      <p className="hint">
        Anche da WhatsApp: “stile elegante”, “colore verde”, “slogan: …”, “nascondi la galleria”, “metti le foto in alto”, “instagram: @nome”.
        {!canStructure && ' Stile, colore e sezioni li sceglie chi ha costruito il sito.'}
      </p>
    </section>
  );
}

/** Titolo di una sezione, modificabile sul posto: si salva uscendo dal campo o con Invio. */
function SectionTitle({ title, fallback, disabled, onSave }: { title: string; fallback: string; disabled: boolean; onSave: (t: string) => void }) {
  const [value, setValue] = useState(title);
  useEffect(() => setValue(title), [title]);
  const save = () => value.trim() !== title && onSave(value.trim());
  return (
    <input
      className="section-title"
      value={value}
      maxLength={60}
      aria-label={`Titolo della sezione ${fallback}`}
      disabled={disabled}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => e.key === 'Enter' && save()}
    />
  );
}
