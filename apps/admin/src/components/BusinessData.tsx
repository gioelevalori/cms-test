import { WEEKDAY_NAMES, categoryProfile, formatDateIt, type BusinessData as Data, type ChangeOp, type Weekday } from '@cms/shared';

interface Props {
  data: Data;
  onOps: (ops: ChangeOp[]) => void;
  busy: boolean;
}

const euro = (n: number | null) => (n === null ? '' : `${n.toFixed(2).replace('.', ',')} €`);

/** Vista dei dati attuali. Le azioni rapide generano operazioni strutturate. */
export function BusinessDataView({ data, onOps, busy }: Props) {
  const sections = [...new Set(data.catalog.map((i) => i.section))];
  const days = [1, 2, 3, 4, 5, 6, 7] as Weekday[];

  return (
    <div className="data">
      <section className="card">
        <h2>Orari</h2>
        <table>
          <tbody>
            {days.map((d) => {
              const slots = data.openingHours.filter((h) => h.weekday === d);
              return (
                <tr key={d}>
                  <th>{WEEKDAY_NAMES[d]}</th>
                  <td>{slots.length ? slots.map((s) => `${s.opens}–${s.closes}`).join(', ') : <span className="muted">chiuso</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data.specialHours.length > 0 && (
          <>
            <h3>Eccezioni</h3>
            <ul className="plain">
              {data.specialHours.map((s) => (
                <li key={s.date} className="row-between">
                  <span>
                    {formatDateIt(s.date)}: {s.closed ? 'chiuso' : `${s.opens}–${s.closes}`}
                    {s.note && <span className="muted"> ({s.note})</span>}
                  </span>
                  <button className="ghost small" disabled={busy} onClick={() => onOps([{ op: 'removeSpecialHours', date: s.date }])}>Rimuovi</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="card">
        <h2>{categoryProfile(data.category).catalogTitle}</h2>
        {sections.map((section) => (
          <div key={section}>
            <h3>{section}</h3>
            <ul className="plain">
              {data.catalog.filter((i) => i.section === section).map((item) => (
                <li key={item.id} className={`row-between ${item.available ? '' : 'unavailable'}`}>
                  <span>{item.name} <span className="muted">{euro(item.price)}</span></span>
                  <button
                    className="ghost small"
                    disabled={busy}
                    onClick={() => onOps([{ op: 'setItemAvailability', itemId: item.id, available: !item.available }])}
                  >
                    {item.available ? 'Segna finito' : 'Disponibile'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Notizie ed eventi</h2>
        {data.posts.length === 0 && <p className="muted">Nessuna notizia.</p>}
        <ul className="plain">
          {data.posts.map((p) => (
            <li key={p.id}>
              <strong>{p.title}</strong>
              {p.startsAt && <span className="muted"> · {formatDateIt(p.startsAt)}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Contatti</h2>
        <p>{data.address}<br />{data.phone}<br />{data.email}</p>
      </section>
    </div>
  );
}
