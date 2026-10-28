import type { BusinessData } from '@cms/shared';
import { SAMPLES } from './sample';

export interface HistoryEntry {
  id: string;
  message: string;
  summary: string[];
  before: BusinessData;
  at: string;
}

export interface BusinessState {
  data: BusinessData;
  history: HistoryEntry[];
}

/** Stato di tutte le attività d'esempio, per id. */
export type State = Record<string, BusinessState>;

const KEY = 'cms-test-demo-v2';

function fresh(): State {
  return Object.fromEntries(SAMPLES.map((s) => [s.id, { data: structuredClone(s.data), history: [] }]));
}

export function loadState(): State {
  const base = fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as State;
      for (const id of Object.keys(base)) if (saved[id]?.data) base[id] = saved[id];
    }
  } catch {
    /* storage non disponibile o dati corrotti: si riparte dai dati di esempio */
  }
  return base;
}

export function saveState(state: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* la demo funziona anche senza salvataggio */
  }
}

export function resetState(): State {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
  return fresh();
}
