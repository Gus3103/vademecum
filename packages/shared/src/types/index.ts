/**
 * Shared TypeScript interfaces for drug-medicine-lookup.
 * Used by both the API backend and the React Native frontend.
 */

export interface ActiveIngredient {
  id: string;
  name: string;
  synonyms: string[];
}

export interface Presentation {
  dose: string;
  units: string;
  quantity: number;
}

export interface Medicine {
  id: string;
  commercialName: string;
  laboratory: string;
  pharmaceuticalForm: string;
  requiresPrescription: boolean;
  presentations: Presentation[];
  activeIngredients: ActiveIngredient[];
}

export interface Prospect {
  medicineId: string;
  indications: string;
  dosage: string;
  contraindications: string;
  warnings: string;
  interactionsText: string;
  adverseEffects: string;
  overdose: string;
  storage: string;
}

export interface DrugInteraction {
  ingredientA: ActiveIngredient;
  ingredientB: ActiveIngredient;
  severity: 'leve' | 'moderada' | 'grave';
  description: string;
}

export interface SearchResult {
  medicines: Medicine[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface InteractionResult {
  interactions: DrugInteraction[];
  hasInteractions: boolean;
  /** true when more than 5 medicines were submitted (analysis may be incomplete) */
  exceedsRecommendedLimit: boolean;
}

export interface HistoryEntry {
  id: string;
  query: string;
  type: 'active_ingredient' | 'commercial_name';
  timestamp: number;
}

export type FilterState = {
  laboratory?: string;
  pharmaceuticalForm?: string;
  requiresPrescription?: boolean;
  sortOrder?: 'name_asc' | 'name_desc';
};

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
