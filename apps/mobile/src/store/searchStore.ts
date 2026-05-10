import { create } from 'zustand';
import type { SearchResult, FilterState } from '@drug-medicine-lookup/shared';

interface SearchState {
  query: string;
  results: SearchResult | null;
  isLoading: boolean;
  error: string | null;
  filters: FilterState;
  currentPage: number;
}

interface SearchActions {
  setQuery: (query: string) => void;
  setResults: (results: SearchResult | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: FilterState) => void;
  setCurrentPage: (page: number) => void;
  reset: () => void;
}

const initialState: SearchState = {
  query: '',
  results: null,
  isLoading: false,
  error: null,
  filters: {},
  currentPage: 1,
};

export const useSearchStore = create<SearchState & SearchActions>((set) => ({
  ...initialState,

  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setFilters: (filters) => set({ filters }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  reset: () => set(initialState),
}));
