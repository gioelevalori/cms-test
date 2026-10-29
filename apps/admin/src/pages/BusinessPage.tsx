import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CATEGORIES, canEditStructure, examplesFor, todayIn, type ChangeOp } from '@cms/shared';
import { api, SITE_URL, type Change } from '../api/client';
import { Chat } from '../components/Chat';
import { BusinessDataView } from '../components/BusinessData';
import { History } from '../components/History';
import { WhatsAppCard } from '../components/WhatsAppCard';
import { ChecklistCard, GoogleCard, ShareCard, TodayCard } from '../components/Overview';

export function BusinessPage() {
  const { businessId = '' } = useParams();
  const qc = useQueryClient();
  const business = useQuery({ queryKey: ['business', businessId], queryFn: () => api.business(businessId) });
  const changes = useQuery({ queryKey: ['changes', businessId], queryFn: () => api.changes(businessId) });
  const isBuilder = business.data ? canEditStructure(business.data.role) : false;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<{ text: string; key: number }>();
  const me = useQuery({ queryKey: ['me'], queryFn: api.me });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['business', businessId] });
    qc.invalidateQueries({ queryKey: ['changes', businessId] });
  };

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Le azioni rapide sono modifiche come le altre: proposta + conferma immediata, quindi annullabili.
  const applyOps = (ops: ChangeOp[]) => run(async () => api.confirm((await api.proposeOps(businessId, ops)).id));
  const undo = (c: Change) => run(() => api.undo(c.id));
  const upload = async (file: File) => {
    setError(null);
    try {
      return await api.uploadPhoto(businessId, file);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };
  const setCategory = (category: string) => run(() => api.setCategory(businessId, category));

  if (business.isLoading) return <p className="container">Caricamento…</p>;
  if (business.error) return <p className="container error">{(business.error as Error).message}</p>;
  const b = business.data!;
  const examples = examplesFor(b.data, todayIn(b.timezone));
  const siteUrl = `${SITE_URL}/${b.slug}`;
  const previewHref = (changeId: string) => `${siteUrl}/anteprima/${changeId}`;
  const pendingCount = (changes.data ?? []).filter((c) => c.status === 'proposed').length;
  const whatsappLinked = Boolean(me.data?.whatsapp && me.data.whatsappBusinessId === businessId);

  return (
    <div className="container wide">
      <header className="topbar">
        <div>
          <Link to="/">← Attività</Link>
          <h1>{b.data.name}</h1>
          {isBuilder && (
            <label className="category-pick">
              Tipo di attività
              <select value={b.data.category || 'other'} onChange={(e) => setCategory(e.target.value)} disabled={busy}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
          )}
        </div>
        <div className="topbar-actions">
          <a className="button ghost" href={siteUrl} target="_blank" rel="noreferrer">Vedi il sito ↗</a>
          <Link className="button" to={`/b/${businessId}/modifica`}>Modifica il sito</Link>
        </div>
      </header>
      {error && <p className="error">{error}</p>}

      {/* Aspetto, foto e anteprima del sito stanno nell'editor ("Modifica il sito"); qui il lavoro di tutti i giorni. */}
      <div className="grid">
        <div className="col">
          <Chat businessId={businessId} examples={examples} onApplied={refresh} previewHref={previewHref} prefill={prefill} />
          <TodayCard data={b.data} timezone={b.timezone} pending={pendingCount} />
          <div id="whatsapp"><WhatsAppCard businessId={businessId} businessName={b.data.name} example={examples[0]} /></div>
          <History changes={changes.data ?? []} onUndo={undo} busy={busy} />
        </div>
        <div className="col">
          <ChecklistCard data={b.data} businessId={businessId} whatsappLinked={whatsappLinked} onSay={(text) => setPrefill({ text, key: Date.now() })} />
          <ShareCard url={siteUrl} name={b.data.name} slug={b.slug} />
          <GoogleCard data={b.data} url={siteUrl} />
          <BusinessDataView data={b.data} onOps={applyOps} busy={busy} upload={upload} />
        </div>
      </div>
    </div>
  );
}
