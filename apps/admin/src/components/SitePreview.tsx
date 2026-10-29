import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  siteUrl: string;
  /** Indirizzo dell'anteprima della proposta in attesa, se c'è. */
  previewUrl: string | null;
  /** Cambia quando i dati cambiano: ricarica il sito. */
  version: number;
  /** L'editor a tutto schermo, dove trascinare le sezioni. */
  editorHref?: string;
}

const DESKTOP_WIDTH = 1280;

/**
 * Il sito dentro il pannello: quello vero, o com'è con la modifica in attesa di conferma.
 * Quando cambia, il sito nuovo si carica dietro a quello vecchio e lo sostituisce in dissolvenza: niente lampi bianchi.
 */
export function SitePreview({ siteUrl, previewUrl, version, editorHref }: Props) {
  const [device, setDevice] = useState<'phone' | 'desktop'>('phone');
  const [width, setWidth] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const src = previewUrl ?? siteUrl;
  const wanted = `${src}#${version}`;
  // Due cornici: quella mostrata e quella che sta caricando. Si scambiano a caricamento finito.
  const [frames, setFrames] = useState<{ key: string; src: string; ready: boolean }[]>([{ key: wanted, src, ready: false }]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    setFrames((fs) => (fs.some((f) => f.key === wanted) ? fs : [...fs.filter((f) => f.ready).slice(-1), { key: wanted, src, ready: false }]));
  }, [wanted, src]);

  const loaded = (key: string) => {
    setFrames((fs) => fs.map((f) => (f.key === key ? { ...f, ready: true } : f)));
    // Finita la dissolvenza (CSS, 280ms) le cornici precedenti si tolgono.
    setTimeout(() => setFrames((fs) => {
      const i = fs.findIndex((f) => f.key === key);
      return i > 0 ? fs.slice(i) : fs;
    }), 320);
  };

  // Il computer si vede in scala: la pagina è larga 1280px, ridotta alla larghezza della scheda.
  const scale = device === 'desktop' && width ? Math.min(1, width / DESKTOP_WIDTH) : 1;
  const loading = !frames.at(-1)?.ready;

  return (
    <section className={`card site-preview ${previewUrl ? 'is-pending' : ''}`}>
      <div className="row-between">
        <h2>{previewUrl ? 'Anteprima della modifica' : 'Il tuo sito'}</h2>
        <div className="segmented" role="group" aria-label="Dispositivo">
          <button type="button" aria-pressed={device === 'phone'} onClick={() => setDevice('phone')}>Telefono</button>
          <button type="button" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')}>Computer</button>
        </div>
      </div>
      <p className="hint preview-note">
        {previewUrl ? 'Così sarà il sito se confermi. Finché non confermi, i clienti vedono quello di prima.' : 'Quello che vedono i clienti adesso.'}
        {' '}<a href={src} target="_blank" rel="noreferrer">Apri in una nuova scheda ↗</a>
        {editorHref && <>{' · '}<Link to={editorHref}>Modifica a tutto schermo</Link></>}
      </p>
      <div ref={stage} className={`preview-stage is-${device}`}>
        {frames.map((f) => (
          <iframe
            key={f.key}
            title={previewUrl ? 'Anteprima del sito con la modifica' : 'Il sito pubblico'}
            src={f.src}
            className={f.ready ? 'is-ready' : ''}
            onLoad={() => loaded(f.key)}
            style={device === 'desktop' ? { width: DESKTOP_WIDTH, height: `${100 / scale}%`, transform: `scale(${scale})` } : undefined}
          />
        ))}
        {loading && <span className="preview-loading">Carico il sito…</span>}
      </div>
    </section>
  );
}
