import { create } from 'zustand';
import type { FilterState } from '@drug-medicine-lookup/shared';

interface FilterStoreState {
  activeFilters: FilterState;
}

interface FilterActions {
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterStoreState & FilterActions>((set) => ({
  activeFilters: {},

  setFilter: (key, value) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, [key]: value },
    })),

  clearFilters: () => set({ activeFilters: {} }),
}));
