import { useRef, useState, type ChangeEvent } from 'react';
import { photoUrl, type BusinessData, type ChangeOp } from '@cms/shared';

interface Props {
  data: BusinessData;
  busy: boolean;
  /** Carica il file e restituisce l'URL. */
  upload: (file: File) => Promise<string>;
  onOps: (ops: ChangeOp[]) => void;
}

/** Logo, copertina e galleria del sito. Ogni foto entra con una modifica normale, quindi si può annullare. */
export function Photos({ data, busy, upload, onOps }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photos = data.photos ?? [];
  const disabled = busy || uploading;

  async function add(files: File[], toOps: (urls: string[]) => ChangeOp[]) {
    if (!files.length) return;
    setError(null);
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) urls.push(await upload(file));
      onOps(toOps(urls));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="card photos">
      <h2>Logo e foto</h2>

      <h3>Logo</h3>
      <div className="cover-row">
        {data.logo ? (
          <img className="logo-thumb" src={photoUrl(data.logo, { w: 240 })} alt="Logo dell'attività" />
        ) : (
          <span className="logo-thumb logo-empty" aria-hidden="true">{data.name.charAt(0)}</span>
        )}
        <div className="logo-side">
          <p className="muted small">{data.logo ? 'Si vede in alto sul sito, in fondo alla pagina e nella scheda del browser.' : "Senza logo il sito usa l'iniziale del nome. Meglio un PNG con lo sfondo trasparente."}</p>
          <div className="photo-actions">
            <FilePick label={data.logo ? 'Cambia' : 'Carica logo'} disabled={disabled} onFiles={(f) => add(f.slice(0, 1), ([url]) => [{ op: 'setLogo', url }])} />
            {data.logo && <button className="ghost small" disabled={disabled} onClick={() => onOps([{ op: 'setLogo', url: null }])}>Togli</button>}
          </div>
        </div>
      </div>

      <h3>Copertina</h3>
      <div className="cover-row">
        {data.cover ? (
          <img className="cover-thumb" src={photoUrl(data.cover, { w: 480, h: 270 })} alt="Copertina del sito" />
        ) : (
          <p className="muted">Nessuna copertina: il sito mostra solo il nome.</p>
        )}
        <div className="photo-actions">
          <FilePick label={data.cover ? 'Cambia' : 'Carica copertina'} disabled={disabled} onFiles={(f) => add(f.slice(0, 1), ([url]) => [{ op: 'setCover', url }])} />
          {data.cover && <button className="ghost small" disabled={disabled} onClick={() => onOps([{ op: 'setCover', url: null }])}>Togli</button>}
        </div>
      </div>

      <h3>Galleria</h3>
      {photos.length > 0 && (
        <ul className="gallery-grid">
          {photos.map((p) => (
            <li key={p.id}>
              <img src={photoUrl(p.url, { w: 240, h: 240 })} alt={p.caption || 'Foto della galleria'} />
              <button className="remove" disabled={disabled} onClick={() => onOps([{ op: 'removePhoto', photoId: p.id }])} aria-label={`Togli la foto ${p.caption}`}>×</button>
            </li>
          ))}
        </ul>
      )}
      <FilePick label="Aggiungi foto" multiple disabled={disabled} onFiles={(f) => add(f, (urls) => urls.map((url) => ({ op: 'addPhoto', url, caption: '' })))} />
      {uploading && <p className="hint">Caricamento…</p>}
      <p className="hint">Anche da WhatsApp: manda una foto, con "copertina" o il nome di una voce nella didascalia.</p>
      {error && <p className="error">{error}</p>}
    </section>
  );
}

/** Pulsante che apre la scelta dei file (foto dal telefono o dal computer). */
export function FilePick({ label, multiple, disabled, onFiles }: { label: string; multiple?: boolean; disabled: boolean; onFiles: (files: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const change = (e: ChangeEvent<HTMLInputElement>) => {
    onFiles([...(e.target.files ?? [])]);
    e.target.value = '';
  };
  return (
    <>
      <button type="button" className="ghost small" disabled={disabled} onClick={() => input.current?.click()}>{label}</button>
      <input ref={input} type="file" accept="image/*" multiple={multiple} hidden onChange={change} />
    </>
  );
}
