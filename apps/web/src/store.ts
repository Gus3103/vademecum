import { create } from 'zustand';
import type { SearchResult, FilterState, Medicine, InteractionResult } from './types';

interface SearchState {
  query: string;
  searchType: 'active' | 'commercial';
  results: SearchResult | null;
  isLoading: boolean;
  error: string | null;
  filters: FilterState;
  setQuery: (q: string) => void;
  setSearchType: (t: 'active' | 'commercial') => void;
  setResults: (r: SearchResult | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setFilters: (f: FilterState) => void;
}

export const useSearchStore = create<SearchState>(set => ({
  query: '',
  searchType: 'active',
  results: null,
  isLoading: false,
  error: null,
  filters: {},
  setQuery: q => set({ query: q }),
  setSearchType: t => set({ searchType: t }),
  setResults: r => set({ results: r }),
  setLoading: v => set({ isLoading: v }),
  setError: e => set({ error: e }),
  setFilters: f => set({ filters: f }),
}));

interface InteractionState {
  selectedMedicines: Medicine[];
  result: InteractionResult | null;
  isLoading: boolean;
  error: string | null;
  addMedicine: (m: Medicine) => void;
  removeMedicine: (id: string) => void;
  setResult: (r: InteractionResult | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useInteractionStore = create<InteractionState>(set => ({
  selectedMedicines: [],
  result: null,
  isLoading: false,
  error: null,
  addMedicine: m => set(s => ({ selectedMedicines: s.selectedMedicines.some(x => x.id === m.id) ? s.selectedMedicines : [...s.selectedMedicines, m] })),
  removeMedicine: id => set(s => ({ selectedMedicines: s.selectedMedicines.filter(m => m.id !== id) })),
  setResult: r => set({ result: r }),
  setLoading: v => set({ isLoading: v }),
  setError: e => set({ error: e }),
}));
