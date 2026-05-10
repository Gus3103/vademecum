import { create } from 'zustand';
import type { Medicine, InteractionResult } from '@drug-medicine-lookup/shared';

interface InteractionState {
  selectedMedicines: Medicine[];
  interactionResult: InteractionResult | null;
  isLoading: boolean;
  error: string | null;
}

interface InteractionActions {
  addMedicine: (medicine: Medicine) => void;
  removeMedicine: (id: string) => void;
  setInteractionResult: (result: InteractionResult | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: InteractionState = {
  selectedMedicines: [],
  interactionResult: null,
  isLoading: false,
  error: null,
};

export const useInteractionStore = create<InteractionState & InteractionActions>((set) => ({
  ...initialState,

  addMedicine: (medicine) =>
    set((state) => {
      const alreadyPresent = state.selectedMedicines.some((m) => m.id === medicine.id);
      if (alreadyPresent) return state;
      return { selectedMedicines: [...state.selectedMedicines, medicine] };
    }),

  removeMedicine: (id) =>
    set((state) => ({
      selectedMedicines: state.selectedMedicines.filter((m) => m.id !== id),
    })),

  setInteractionResult: (interactionResult) => set({ interactionResult }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
