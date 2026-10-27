import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { canEditStructure, type ChangeOp, type PageBlock } from '@cms/shared';
import { api, SITE_URL, type Change } from '../api/client';
import { Chat } from '../components/Chat';
import { BusinessDataView } from '../components/BusinessData';
import { History } from '../components/History';
import { LayoutEditor } from '../components/LayoutEditor';
import { WhatsAppCard } from '../components/WhatsAppCard';

export function BusinessPage() {
  const { businessId = '' } = useParams();
  const qc = useQueryClient();
  const business = useQuery({ queryKey: ['business', businessId], queryFn: () => api.business(businessId) });
  const changes = useQuery({ queryKey: ['changes', businessId], queryFn: () => api.changes(businessId) });
  const isBuilder = business.data ? canEditStructure(business.data.role) : false;
  const pages = useQuery({ queryKey: ['pages', businessId], queryFn: () => api.pages(businessId), enabled: isBuilder });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const saveLayout = (layout: PageBlock[]) =>
    run(async () => {
      await api.savePage(businessId, 'home', layout);
      qc.invalidateQueries({ queryKey: ['pages', businessId] });
    });

  if (business.isLoading) return <p className="container">Caricamento…</p>;
  if (business.error) return <p className="container error">{(business.error as Error).message}</p>;
  const b = business.data!;

  return (
    <div className="container wide">
      <header className="topbar">
        <div>
          <Link to="/">← Attività</Link>
          <h1>{b.data.name}</h1>
        </div>
        <a className="button ghost" href={`${SITE_URL}/${b.slug}`} target="_blank" rel="noreferrer">Vedi il sito ↗</a>
      </header>
      {error && <p className="error">{error}</p>}

      <div className="grid">
        <div className="col">
          <Chat businessId={businessId} onApplied={refresh} />
          <WhatsAppCard />
          <History changes={changes.data ?? []} onUndo={undo} busy={busy} />
          {isBuilder && pages.data?.[0] && <LayoutEditor page={pages.data[0]} onSave={saveLayout} busy={busy} />}
        </div>
        <div className="col">
          <BusinessDataView data={b.data} onOps={applyOps} busy={busy} />
        </div>
      </div>
    </div>
  );
}
