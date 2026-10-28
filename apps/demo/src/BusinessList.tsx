import { SAMPLES } from './sample';
import type { State } from './storage';

/** Elenco delle attività d'esempio, come le chat di un'app di messaggi. */
export function BusinessList({ state, selected, onSelect }: { state: State; selected: string; onSelect: (id: string) => void }) {
  return (
    <nav className="list" aria-label="Attività d'esempio">
      <p className="list-title">Prova con un'attività</p>
      <ul>
        {SAMPLES.map((s) => {
          const last = state[s.id].history[0];
          return (
            <li key={s.id}>
              <button className="list-item" aria-current={s.id === selected ? 'true' : undefined} onClick={() => onSelect(s.id)}>
                <span className="avatar" style={{ background: s.accent }} aria-hidden="true">{s.short.charAt(0)}</span>
                <span className="list-text">
                  <span className="list-name">{s.short}</span>
                  <span className="list-last">{last ? last.message : s.sector}</span>
                </span>
                {last && <span className="list-badge" title="Sito aggiornato"><span className="sr-only">Sito aggiornato</span></span>}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="list-note">
        Attività inventate, per provare. Nel prodotto ogni attività ha la sua chat: chi fa siti ai clienti li ritrova tutti qui, uno sotto l'altro.
      </p>
    </nav>
  );
}
