import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  WEEKDAY_NAMES, addDays, categoryProfile, formatDateIt, openStatus, resolveSite, slotsOn, timeIn, todayIn, weekdayOf,
  type BusinessData, type TimeSlot,
} from '@cms/shared';
import { CheckIcon, ClockIcon, ExternalIcon } from './Icons';

/** "09:00" → "9", "14:30" → "14:30". */
const compact = (t: string) => t.replace(/^0(?=\d)/, '').replace(/:00$/, '');
const slotsText = (slots: TimeSlot[]) => slots.map((s) => `${compact(s.opens)}–${compact(s.closes)}`).join(' e ');

/** L'ora che passa: lo stato "aperto ora" si aggiorna da solo, una volta al minuto. */
function useMinute() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);
}

/** Com'è messa oggi l'attività: aperta o chiusa, orario di oggi, la settimana, i prossimi giorni speciali. */
export function TodayCard({ data, timezone, pending }: { data: BusinessData; timezone: string; pending: number }) {
  useMinute();
  const today = todayIn(timezone);
  const status = openStatus(data, today, timeIn(timezone));
  const todaySlots = slotsOn(data, today);
  const week = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(today, i));
  const upcoming = data.specialHours.filter((s) => s.date >= today && s.date <= addDays(today, 30)).slice(0, 4);
  const noHours = data.openingHours.length === 0;

  return (
    <section className="card today-card">
      <div className="row-between">
        <h2>Oggi</h2>
        <span className="muted small">{WEEKDAY_NAMES[weekdayOf(today)]} {formatDateIt(today).replace(/ \d{4}$/, '')}</span>
      </div>
      <p className={`today-status ${status.open ? (status.closingSoon ? 'is-soon' : 'is-open') : 'is-closed'}`}>
        <span className="dot" aria-hidden="true" />
        <strong>{status.label}</strong>
        {status.detail && <span>· {status.detail}</span>}
      </p>
      <p className="today-hours"><ClockIcon size={15} />{noHours ? 'Orari non ancora inseriti' : todaySlots.length ? `Oggi ${slotsText(todaySlots)}` : 'Oggi chiuso'}</p>

      {!noHours && (
        <ol className="week-strip" aria-label="I prossimi sette giorni">
          {week.map((d, i) => {
            const slots = slotsOn(data, d);
            const special = data.specialHours.some((s) => s.date === d);
            return (
              <li key={d} className={`${i === 0 ? 'is-today' : ''} ${slots.length ? '' : 'is-closed'} ${special ? 'is-special' : ''}`} title={special ? 'Orario speciale' : undefined}>
                <span className="week-day">{WEEKDAY_NAMES[weekdayOf(d)].slice(0, 3)}</span>
                <span className="week-hours">{slots.length ? slots.map((s) => <span key={s.opens}>{compact(s.opens)}–{compact(s.closes)}</span>) : 'chiuso'}</span>
              </li>
            );
          })}
        </ol>
      )}

      {upcoming.length > 0 && (
        <>
          <h3>Prossimi giorni speciali</h3>
          <ul className="plain upcoming">
            {upcoming.map((s) => (
              <li key={s.date}>
                <strong>{formatDateIt(s.date)}</strong>{' '}
                {s.closed ? 'chiuso' : s.opens && s.closes ? `aperto ${compact(s.opens)}–${compact(s.closes)}` : s.closes ? `fino alle ${compact(s.closes)}` : `dalle ${compact(s.opens ?? '')}`}
                {s.note && <span className="muted"> · {s.note}</span>}
              </li>
            ))}
          </ul>
        </>
      )}

      {pending > 0 && (
        <p className="today-pending">{pending === 1 ? '1 modifica aspetta' : `${pending} modifiche aspettano`} la tua conferma: la trovi in Cronologia.</p>
      )}
    </section>
  );
}

/** L'indirizzo del sito da far girare: copia, WhatsApp, codice QR da stampare. */
export function ShareCard({ url, name, slug }: { url: string; name: string; slug: string }) {
  const [svg, setSvg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Il codice si disegna qui, nel browser: nessun servizio esterno vede l'indirizzo.
    QRCode.toString(url, { type: 'svg', margin: 1, color: { dark: '#12161b', light: '#ffffff' } }).then(setSvg).catch(() => setSvg(''));
  }, [url]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* senza permesso agli appunti resta il link da selezionare */ }
  }

  async function download() {
    const png = await QRCode.toDataURL(url, { width: 1200, margin: 2 });
    const a = document.createElement('a');
    a.href = png;
    a.download = `qr-${slug}.png`;
    a.click();
  }

  const waText = encodeURIComponent(`${name}: orari, menu e contatti aggiornati qui ${url}`);

  return (
    <section className="card share-card">
      <h2>Il tuo sito</h2>
      <div className="share-body">
        {svg && <div className="share-qr" role="img" aria-label={`Codice QR per ${url}`} dangerouslySetInnerHTML={{ __html: svg }} />}
        <div className="share-side">
          <a className="share-url" href={url} target="_blank" rel="noreferrer">{url.replace(/^https?:\/\//, '')}<ExternalIcon size={14} /></a>
          <div className="share-actions">
            <button type="button" className="small" onClick={copy}>{copied ? <><CheckIcon size={14} />Copiato</> : 'Copia il link'}</button>
            <a className="button ghost small" href={`https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer">Condividi su WhatsApp</a>
            <button type="button" className="ghost small" onClick={download} disabled={!svg}>Scarica il QR</button>
          </div>
          <p className="hint">Stampa il codice su menu, tavoli o vetrina: chi lo inquadra apre il sito, sempre aggiornato.</p>
        </div>
      </div>
    </section>
  );
}

interface Step {
  id: string;
  label: string;
  done: boolean;
  /** Una frase da scrivere in chat… */
  say?: string;
  /** …oppure un pannello dell'editor. */
  panel?: 'photos' | 'texts' | 'social';
  /** …oppure un punto di questa pagina. */
  anchor?: string;
}

/** Cosa manca perché il sito sia completo, con il modo più rapido per aggiungerlo. */
export function ChecklistCard({ data, businessId, whatsappLinked, onSay }: { data: BusinessData; businessId: string; whatsappLinked: boolean; onSay: (text: string) => void }) {
  const profile = categoryProfile(data.category);
  const site = resolveSite(data);
  const addExample = profile.examples.find((e) => /^aggiungi/i.test(e)) ?? `Aggiungi ${profile.defaultSection.toLowerCase()} a 10 euro`;
  const steps: Step[] = [
    { id: 'hours', label: 'Orari di apertura', done: data.openingHours.length > 0, say: 'Il martedì dalle 9 alle 18' },
    { id: 'catalog', label: `${profile.catalogTitle}: almeno una voce`, done: data.catalog.length > 0, say: addExample },
    { id: 'address', label: 'Indirizzo', done: Boolean(data.address), say: 'Il nuovo indirizzo è ' },
    { id: 'phone', label: 'Telefono', done: Boolean(data.phone), say: 'Il nuovo numero di telefono è ' },
    { id: 'description', label: 'Descrizione dell\'attività', done: Boolean(data.description), say: 'Descrizione: ' },
    { id: 'logo', label: 'Logo', done: Boolean(data.logo), panel: 'photos' },
    { id: 'cover', label: 'Foto di copertina', done: Boolean(data.cover), panel: 'photos' },
    { id: 'photos', label: 'Almeno tre foto in galleria', done: (data.photos ?? []).length >= 3, panel: 'photos' },
    { id: 'tagline', label: 'Frase sotto il nome', done: Boolean(site.tagline), panel: 'texts' },
    { id: 'social', label: 'Un profilo social', done: Object.values(site.links).some(Boolean), panel: 'social' },
    { id: 'whatsapp', label: 'WhatsApp collegato', done: whatsappLinked, anchor: 'whatsapp' },
  ];
  const done = steps.filter((s) => s.done).length;
  const todo = steps.filter((s) => !s.done);
  const [open, setOpen] = useState(false);
  const shown = open ? todo : todo.slice(0, 4);

  return (
    <section className="card checklist-card">
      <div className="row-between">
        <h2>{todo.length ? 'Completa il sito' : 'Il sito è completo'}</h2>
        <span className="muted small">{done} di {steps.length}</span>
      </div>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done} aria-label="Quanto è completo il sito">
        <span style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      {todo.length === 0 ? (
        <p className="muted">C'è tutto: orari, contenuti, foto e contatti. Ora basta tenerlo aggiornato scrivendo.</p>
      ) : (
        <>
          <ul className="checklist">
            {shown.map((s) => (
              <li key={s.id}>
                <span className="check-dot" aria-hidden="true" />
                <span className="check-label">{s.label}</span>
                {s.say !== undefined && <button type="button" className="ghost small" onClick={() => onSay(s.say!)}>Scrivilo in chat</button>}
                {s.panel && <Link className="button ghost small" to={`/b/${businessId}/modifica?pannello=${s.panel}`}>Apri l'editor</Link>}
                {s.anchor && <a className="button ghost small" href={`#${s.anchor}`} onClick={(e) => { e.preventDefault(); document.getElementById(s.anchor!)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>Collega</a>}
              </li>
            ))}
          </ul>
          {todo.length > 4 && (
            <button type="button" className="link small" onClick={() => setOpen((o) => !o)}>{open ? 'Mostra meno' : `Mostra tutto (${todo.length})`}</button>
          )}
        </>
      )}
    </section>
  );
}

/** Come può comparire l'attività tra i risultati di Google, con ciò che il sito gli dice. */
export function GoogleCard({ data, url }: { data: BusinessData; url: string }) {
  const site = resolveSite(data);
  const title = site.tagline ? `${data.name} · ${site.tagline}` : data.name;
  const description = data.description || site.tagline;
  const u = new URL(url);
  const facts = [
    { label: 'Orari', ok: data.openingHours.length > 0 },
    { label: 'Indirizzo', ok: Boolean(data.address) },
    { label: 'Telefono', ok: Boolean(data.phone) },
    { label: categoryProfile(data.category).catalogTitle, ok: data.catalog.length > 0 },
    { label: 'Foto', ok: Boolean(data.cover || (data.photos ?? []).length) },
    { label: 'Logo', ok: Boolean(data.logo) },
  ];
  return (
    <section className="card google-card">
      <h2>Come ti vede Google</h2>
      <div className="serp">
        <p className="serp-site"><span className="serp-favicon" aria-hidden="true">{data.name.charAt(0)}</span><span><span className="serp-name">{data.name}</span><span className="serp-url">{u.host} › {u.pathname.replace(/^\//, '')}</span></span></p>
        <p className="serp-title">{title}</p>
        <p className={`serp-desc ${description ? '' : 'is-missing'}`}>{description || 'Manca una descrizione: Google ne sceglierà una a caso dalla pagina. Scrivi "Descrizione: …" in chat.'}</p>
      </div>
      <p className="hint">Il sito dà a Google anche questi dati, pronti da mostrare:</p>
      <ul className="facts">
        {facts.map((f) => <li key={f.label} className={f.ok ? 'is-ok' : ''}>{f.ok ? <CheckIcon size={14} /> : <span className="fact-dot" aria-hidden="true" />}{f.label}</li>)}
      </ul>
      <p className="hint">Google aggiorna i risultati con i suoi tempi, non subito.</p>
    </section>
  );
}
