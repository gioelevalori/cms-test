import type { BusinessData } from '@cms/shared';
import { SAMPLE } from './sample';

export interface HistoryEntry {
  id: string;
  message: string;
  summary: string[];
  before: BusinessData;
  at: string;
}

interface State {
  data: BusinessData;
  history: HistoryEntry[];
}

const KEY = 'cms-test-demo-v1';

export function loadState(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    /* storage non disponibile o dati corrotti: si riparte dai dati di esempio */
  }
  return { data: structuredClone(SAMPLE), history: [] };
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
  return { data: structuredClone(SAMPLE), history: [] };
}
