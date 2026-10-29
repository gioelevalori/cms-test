import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  SECTIONS, applyOps, canEditStructure, compactOps, describeOp, isFromCanvas, isValidOp, resolveSite, sectionHasContent,
  type BusinessData, type ChangeOp, type EditTarget, type SectionId, type ToCanvas,
} from '@cms/shared';
import { api, ApiError, SITE_URL } from '../api/client';
import { SiteCard, SectionTitle } from '../components/SiteCard';
import { Photos } from '../components/Photos';
import { useDragSort } from '../components/useDragSort';

type Device = 'desktop' | 'tablet' | 'phone';
type Panel = 'home' | 'sections' | 'look' | 'texts' | 'photos' | 'social' | { section: SectionId };

const DEVICES: { id: Device; label: string; width: number | null }[] = [
  { id: 'desktop', label: 'Computer', width: null },
  { id: 'tablet', label: 'Tablet', width: 820 },
  { id: 'phone', label: 'Telefono', width: 390 },
];

const PANEL_TITLE: Record<Exclude<Panel, object>, string> = {
  home: 'Personalizza', sections: 'Sezioni', look: 'Stile e colore', texts: 'Testi', photos: 'Logo e foto', social: 'Social',
};

/** Cosa si cambia, sezione per sezione, fuori dall'editor (i contenuti si scrivono in chat). */
const CONTENT_HINT: Record<SectionId, string> = {
  highlights: 'I punti di forza si scrivono nel pannello Testi.',
  catalog: 'Voci e prezzi si cambiano scrivendo, in chat o su WhatsApp: "Aggiungi la diavola a 8 euro nella sezione pizze".',
  about: 'Il testo di "Chi siamo" è la descrizione dell\'attività: "La descrizione è …".',
  hours: 'Gli orari si cambiano scrivendo: "Il martedì dalle 9 alle 18", "Sabato chiudiamo alle 15".',
  posts: 'Le novità si scrivono in chat: "Evento il 12 dicembre: serata jazz".',
  gallery: 'Le foto si aggiungono e si riordinano nel pannello Logo e foto.',
  where: 'L\'indirizzo si cambia scrivendo: "Il nuovo indirizzo è …".',
};

/** Dove porta un clic sulla pagina. */
const panelFor = (t: EditTarget): Panel => (t === 'brand' ? 'photos' : t === 'hero' ? 'texts' : t === 'footer' ? 'social' : { section: t });

const draftKey = (id: string) => `cms-draft:${id}`;
function loadDraft(id: string): ChangeOp[][] {
  try {
    const saved = JSON.parse(localStorage.getItem(draftKey(id)) ?? '[]');
    return Array.isArray(saved) ? saved.filter((b) => Array.isArray(b) && b.every(isValidOp)) : [];
  } catch {
    return [];
  }
}
function saveDraft(id: string, batches: ChangeOp[][]) {
  try {
    if (batches.length) localStorage.setItem(draftKey(id), JSON.stringify(batches));
    else localStorage.removeItem(draftKey(id));
  } catch { /* la bozza resta solo in memoria */ }
}

/** Id stabili per le foto aggiunte in bozza: la stessa bozza dà sempre gli stessi id. */
const draftIds = () => { let n = 0; return () => `bozza-${++n}`; };

/**
 * L'editor a tutto schermo, come la personalizzazione di WordPress: a sinistra i pannelli, a destra il sito vero.
 * Ogni scelta va in una bozza che si vede subito sulla pagina; "Pubblica" la manda come un'unica modifica
 * (con cronologia e annulla), "Scarta" la butta. La bozza resta salvata su questo computer.
 */
export function EditorPage() {
  const { businessId = '' } = useParams();
  const qc = useQueryClient();
  const business = useQuery({ queryKey: ['business', businessId], queryFn: () => api.business(businessId) });
  const [batches, setBatches] = useState<ChangeOp[][]>(() => loadDraft(businessId));
  const [redo, setRedo] = useState<ChangeOp[][]>([]);
  const [panel, setPanel] = useState<Panel>('home');
  const [selected, setSelected] = useState<EditTarget | null>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const frame = useRef<HTMLIFrameElement>(null);
  const siteOrigin = useMemo(() => new URL(SITE_URL, location.href).origin, []);

  const b = business.data;
  const base = b?.data;
  const isBuilder = b ? canEditStructure(b.role) : false;
  const ops = useMemo(() => batches.flat(), [batches]);

  // La bozza applicata ai dati veri. Se non si applica più (i dati sono cambiati da WhatsApp), lo si dice.
  const preview = useMemo<BusinessData | null>(() => {
    if (!base) return null;
    try {
      return applyOps(base, ops, draftIds());
    } catch {
      return null;
    }
  }, [base, ops]);
  const stale = Boolean(base && !preview);
  const shown = preview ?? base;
  const pending = useMemo(() => (base ? compactOps(ops) : []), [base, ops]);

  useEffect(() => saveDraft(businessId, batches), [businessId, batches]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  /** Aggiunge una scelta alla bozza, se valida e se si applica. */
  const addOps = useCallback((next: ChangeOp[]) => {
    if (!shown || !next.length) return;
    if (!next.every(isValidOp)) return setError('Questa modifica non è valida.');
    try {
      applyOps(shown, next, draftIds());
    } catch (err) {
      return setError((err as Error).message);
    }
    setError(null);
    setBatches((bs) => [...bs, next]);
    setRedo([]);
  }, [shown]);

  const undo = useCallback(() => {
    setBatches((bs) => {
      if (!bs.length) return bs;
      setRedo((r) => [...r, bs[bs.length - 1]]);
      return bs.slice(0, -1);
    });
  }, []);
  const redoLast = useCallback(() => {
    setRedo((r) => {
      if (!r.length) return r;
      setBatches((bs) => [...bs, r[r.length - 1]]);
      return r.slice(0, -1);
    });
  }, []);

  // Ctrl+Z / Ctrl+Maiusc+Z sulla bozza, fuori dai campi di testo.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return;
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      if (e.shiftKey) redoLast();
      else undo();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redoLast]);

  /** Alla pagina nell'iframe. */
  const send = useCallback((msg: ToCanvas) => frame.current?.contentWindow?.postMessage(msg, siteOrigin), [siteOrigin]);
  const sendData = useCallback(() => { if (shown) send({ type: 'cms:data', data: shown, canStructure: isBuilder }); }, [send, shown, isBuilder]);
  useEffect(sendData, [sendData]);

  const select = useCallback((target: EditTarget | null, scroll: boolean) => {
    setSelected(target);
    send({ type: 'cms:select', target, scroll });
  }, [send]);

  // Dalla pagina nell'iframe: pronta, selezione, nuovo ordine, nascondi.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== siteOrigin || e.source !== frame.current?.contentWindow || !isFromCanvas(e.data)) return;
      const msg = e.data;
      if (msg.type === 'cms:ready') {
        sendData();
        send({ type: 'cms:select', target: selected, scroll: false });
      } else if (msg.type === 'cms:select') {
        setSelected(msg.target);
        setPanel(panelFor(msg.target));
        setSidebar(true);
      } else if (msg.type === 'cms:order' && isBuilder) {
        addOps([{ op: 'setSectionOrder', order: msg.order }]);
      } else if (msg.type === 'cms:hide' && isBuilder) {
        addOps([{ op: 'setSectionVisible', section: msg.section, visible: false }]);
        setNotice('Sezione nascosta: la ritrovi in Sezioni.');
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [siteOrigin, sendData, send, selected, isBuilder, addOps]);

  async function publish() {
    if (!pending.length || busy) return;
    setBusy(true);
    setError(null);
    try {
      const change = await api.proposeOps(businessId, pending);
      await api.confirm(change.id);
      setBatches([]);
      setRedo([]);
      await qc.invalidateQueries({ queryKey: ['business', businessId] });
      qc.invalidateQueries({ queryKey: ['changes', businessId] });
      setNotice('Pubblicato: il sito è aggiornato.');
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409
        ? 'Nel frattempo il sito è cambiato (da WhatsApp o da un\'altra scheda). Scarta la bozza e riprova.'
        : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function discard() {
    setBatches([]);
    setRedo([]);
    setConfirmDiscard(false);
    setNotice('Bozza scartata.');
  }

  const upload = async (file: File) => api.uploadPhoto(businessId, file);

  if (business.isLoading) return <p className="container">Caricamento…</p>;
  if (business.error || !b || !shown) return <p className="container error">{(business.error as Error)?.message ?? 'Attività non trovata'}</p>;

  const site = resolveSite(shown);
  const width = DEVICES.find((d) => d.id === device)!.width;
  const go = (p: Panel) => {
    setPanel(p);
    if (typeof p === 'object') select(p.section, true);
  };

  return (
    <div className={`editor ${sidebar ? '' : 'no-sidebar'}`}>
      <header className="editor-top">
        <Link className="editor-exit" to={`/b/${businessId}`} title={pending.length ? 'La bozza resta salvata su questo computer' : undefined}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Esci
        </Link>
        <button type="button" className="editor-icon" onClick={() => setSidebar((s) => !s)} aria-pressed={sidebar} aria-label={sidebar ? 'Nascondi i pannelli' : 'Mostra i pannelli'}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 5h16v14H4zM9 5v14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        </button>
        <span className="editor-name">{shown.name}</span>

        <div className="editor-devices" role="group" aria-label="Dispositivo">
          {DEVICES.map((d) => (
            <button key={d.id} type="button" aria-pressed={device === d.id} onClick={() => setDevice(d.id)} title={d.label} aria-label={d.label}>
              <DeviceIcon id={d.id} />
            </button>
          ))}
        </div>

        <div className="editor-actions">
          <button type="button" className="editor-icon" onClick={undo} disabled={!batches.length} aria-label="Annulla l'ultima scelta" title="Annulla (Ctrl+Z)">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" className="editor-icon" onClick={redoLast} disabled={!redo.length} aria-label="Rifai" title="Rifai (Ctrl+Maiusc+Z)">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span className="editor-state" aria-live="polite">
            {pending.length ? (pending.length === 1 ? '1 modifica in bozza' : `${pending.length} modifiche in bozza`) : 'Nessuna modifica'}
          </span>
          {pending.length > 0 && (confirmDiscard ? (
            <span className="editor-confirm">
              <button type="button" className="ghost small danger" onClick={discard}>Sì, scarta</button>
              <button type="button" className="ghost small" onClick={() => setConfirmDiscard(false)}>No</button>
            </span>
          ) : (
            <button type="button" className="ghost" onClick={() => setConfirmDiscard(true)} disabled={busy}>Scarta</button>
          ))}
          <button type="button" className="editor-publish" onClick={publish} disabled={!pending.length || busy || stale}>
            {busy ? 'Pubblico…' : 'Pubblica'}
          </button>
        </div>
      </header>

      {sidebar && (
        <aside className="editor-side" aria-label="Pannelli di personalizzazione">
          {panel !== 'home' && (
            <button type="button" className="editor-back" onClick={() => { setPanel(typeof panel === 'object' ? 'sections' : 'home'); select(null, false); }}>
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {typeof panel === 'object' ? 'Sezioni' : 'Personalizza'}
            </button>
          )}
          <h2 className="editor-panel-title">{typeof panel === 'object' ? site.titles[panel.section] : PANEL_TITLE[panel]}</h2>

          {stale && (
            <div className="editor-alert">
              <p>La bozza non si applica più: nel frattempo il sito è cambiato.</p>
              <button type="button" className="small" onClick={discard}>Scarta la bozza</button>
            </div>
          )}
          {error && <p className="error editor-msg" role="alert">{error}</p>}
          {notice && <p className="editor-notice" role="status">{notice}</p>}

          <div className="editor-panel" key={typeof panel === 'object' ? panel.section : panel}>
            {panel === 'home' && (
              <ul className="editor-menu">
                {(isBuilder ? (['sections', 'look', 'texts', 'photos', 'social'] as const) : (['texts', 'photos', 'social'] as const)).map((p) => (
                  <li key={p}>
                    <button type="button" onClick={() => go(p)}>
                      <span><strong>{PANEL_TITLE[p]}</strong><span className="muted small">{MENU_HINT[p]}</span></span>
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </li>
                ))}
                {!isBuilder && <li className="muted small editor-note">Stile, colore e ordine delle sezioni li sceglie chi ha costruito il sito.</li>}
              </ul>
            )}

            {panel === 'sections' && <SectionsPanel data={shown} onOps={addOps} onOpen={(id) => go({ section: id })} selected={selected} />}

            {typeof panel === 'object' && (
              <SectionPanel id={panel.section} data={shown} canStructure={isBuilder} onOps={addOps} />
            )}

            {panel === 'look' && <SiteCard data={shown} canStructure={isBuilder} busy={busy} onOps={addOps} parts={['look']} bare />}
            {panel === 'texts' && <SiteCard data={shown} canStructure={isBuilder} busy={busy} onOps={addOps} parts={['texts']} bare />}
            {panel === 'social' && <SiteCard data={shown} canStructure={isBuilder} busy={busy} onOps={addOps} parts={['social']} bare />}
            {panel === 'photos' && <Photos data={shown} busy={busy} upload={upload} onOps={addOps} bare />}
          </div>

          {pending.length > 0 && (
            <details className="editor-summary">
              <summary>Cosa cambierà</summary>
              <ul>{pending.map((op, i) => <li key={i}>{describeOp(op, base!)}</li>)}</ul>
            </details>
          )}
        </aside>
      )}

      <main className={`editor-canvas is-${device}`}>
        <div className="editor-frame" style={width ? { width } : undefined}>
          <iframe ref={frame} title={`Il sito di ${shown.name} in modifica`} src={`${SITE_URL}/${b.slug}/modifica`} onLoad={sendData} />
        </div>
      </main>
    </div>
  );
}

const MENU_HINT: Record<'sections' | 'look' | 'texts' | 'photos' | 'social', string> = {
  sections: 'Ordine, titoli, mostra e nascondi',
  look: 'Carattere, impaginazione e colore',
  texts: 'Frase sotto il nome e punti di forza',
  photos: 'Logo, copertina e galleria',
  social: 'Instagram, Facebook, TikTok',
};

function DeviceIcon({ id }: { id: Device }) {
  const d = {
    desktop: 'M3 5h18v11H3zM8 20h8M12 16v4',
    tablet: 'M6 3h12v18H6zM11 18h2',
    phone: 'M8 3h8v18H8zM11 18h2',
  }[id];
  return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Tutte le sezioni, da trascinare per cambiarne l'ordine; l'occhio le mostra o le nasconde. */
function SectionsPanel({ data, onOps, onOpen, selected }: { data: BusinessData; onOps: (ops: ChangeOp[]) => void; onOpen: (id: SectionId) => void; selected: EditTarget | null }) {
  const site = resolveSite(data);
  const sort = useDragSort(site.order, (id) => id, (order) => onOps([{ op: 'setSectionOrder', order }]));
  return (
    <>
      <p className="hint editor-lead">Trascina per cambiare l'ordine, anche direttamente sulla pagina.</p>
      <ol className="editor-sections">
        {site.order.map((id, i) => {
          const hidden = site.hidden.includes(id);
          const empty = !sectionHasContent(data, id);
          return (
            <li key={id} {...sort.itemProps(id, i)} className={`${hidden ? 'is-hidden' : ''} ${selected === id ? 'is-selected' : ''}`}>
              <span className="drag-grip" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
              </span>
              <button type="button" className="section-open" onClick={() => onOpen(id)}>
                <span>{site.titles[id]}</span>
                {hidden ? <span className="tag">nascosta</span> : empty ? <span className="tag" title="Compare quando aggiungi qualcosa">vuota</span> : null}
              </button>
              <button
                type="button"
                className="editor-icon"
                aria-pressed={!hidden}
                aria-label={hidden ? `Mostra ${site.titles[id]}` : `Nascondi ${site.titles[id]}`}
                title={hidden ? 'Mostra' : 'Nascondi'}
                onClick={() => onOps([{ op: 'setSectionVisible', section: id, visible: hidden }])}
              >
                <EyeIcon off={hidden} />
              </button>
            </li>
          );
        })}
      </ol>
    </>
  );
}

/** Una sezione: titolo, visibilità, posizione e dove se ne cambiano i contenuti. */
function SectionPanel({ id, data, canStructure, onOps }: { id: SectionId; data: BusinessData; canStructure: boolean; onOps: (ops: ChangeOp[]) => void }) {
  const site = resolveSite(data);
  const hidden = site.hidden.includes(id);
  const fallback = SECTIONS.find((s) => s.id === id)!.label;
  return (
    <div className="editor-section-panel">
      {canStructure ? (
        <>
          <label>
            Titolo sul sito
            <SectionTitle title={site.titles[id]} fallback={fallback} disabled={false} onSave={(title) => onOps([{ op: 'setSectionTitle', section: id, title }])} />
          </label>
          <label className="editor-switch">
            <input type="checkbox" checked={!hidden} onChange={(e) => onOps([{ op: 'setSectionVisible', section: id, visible: e.target.checked }])} />
            Mostra sul sito
          </label>
          <div className="editor-row">
            <button type="button" className="ghost small" onClick={() => onOps([{ op: 'moveSection', section: id, to: 'first' }])}>Metti in alto</button>
            <button type="button" className="ghost small" onClick={() => onOps([{ op: 'moveSection', section: id, to: 'last' }])}>Metti in fondo</button>
          </div>
        </>
      ) : (
        <p className="muted small">Titolo, posizione e visibilità li sceglie chi ha costruito il sito.</p>
      )}
      {!sectionHasContent(data, id) && <p className="editor-alert">Questa sezione è vuota: compare sul sito quando aggiungi qualcosa.</p>}
      <p className="hint">{CONTENT_HINT[id]}</p>
    </div>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return off ? (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M7.4 7.5C4.8 9 3 12 3 12s3.5 6.5 9 6.5c1.7 0 3.2-.5 4.5-1.2M10 5.7c.7-.1 1.3-.2 2-.2 5.5 0 9 6.5 9 6.5a17 17 0 0 1-2.3 3.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
}
