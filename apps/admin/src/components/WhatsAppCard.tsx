import { FormEvent, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

/** Collega il numero da cui il titolare aggiornerà il sito scrivendo su WhatsApp. */
export function WhatsAppCard() {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ['me'], queryFn: api.me });
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.setWhatsApp(phone);
      setEditing(false);
      setPhone('');
      qc.invalidateQueries({ queryKey: ['me'] });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const linked = me.data?.whatsapp;
  return (
    <section className="card">
      <h2>Aggiorna da WhatsApp</h2>
      {linked && !editing ? (
        <>
          <p>
            Numero collegato: <strong>+{linked}</strong>. Scrivi al numero WhatsApp dell'attività, ad esempio “Sabato chiudiamo alle 15”:
            riceverai l'anteprima con i pulsanti Conferma e Annulla.
          </p>
          <button className="ghost small" onClick={() => setEditing(true)}>Cambia numero</button>
        </>
      ) : (
        <form onSubmit={save} className="row-between">
          <input placeholder="+39 333 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button type="submit" disabled={!phone.trim()}>Collega</button>
        </form>
      )}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
