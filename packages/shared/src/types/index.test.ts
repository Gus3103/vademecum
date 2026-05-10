import { describe, it, expect } from 'vitest';
import type {
  ActiveIngredient,
  Medicine,
  Presentation,
  Prospect,
  DrugInteraction,
  SearchResult,
  InteractionResult,
  HistoryEntry,
  FilterState,
  ApiError,
} from './index.js';

describe('Shared types', () => {
  it('ActiveIngredient shape is correct', () => {
    const ingredient: ActiveIngredient = {
      id: '1',
      name: 'Ibuprofeno',
      synonyms: ['Ibuprofen'],
    };
    expect(ingredient.id).toBe('1');
    expect(ingredient.synonyms).toHaveLength(1);
  });

  it('Presentation shape is correct', () => {
    const presentation: Presentation = { dose: '400mg', units: 'comprimidos', quantity: 20 };
    expect(presentation.quantity).toBe(20);
  });

  it('Medicine shape is correct', () => {
    const medicine: Medicine = {
      id: 'med-1',
      commercialName: 'Ibupirac',
      laboratory: 'Pfizer',
      pharmaceuticalForm: 'comprimido',
      requiresPrescription: false,
      presentations: [{ dose: '400mg', units: 'comprimidos', quantity: 20 }],
      activeIngredients: [{ id: 'ai-1', name: 'Ibuprofeno', synonyms: [] }],
    };
    expect(medicine.requiresPrescription).toBe(false);
    expect(medicine.activeIngredients).toHaveLength(1);
  });

  it('Prospect shape is correct', () => {
    const prospect: Prospect = {
      medicineId: 'med-1',
      indications: 'Dolor leve a moderado',
      dosage: '400mg cada 8 horas',
      contraindications: 'Úlcera péptica',
      warnings: 'No usar en embarazo',
      interactionsText: 'Anticoagulantes',
      adverseEffects: 'Náuseas',
      overdose: 'Consultar médico',
      storage: 'Temperatura ambiente',
    };
    expect(Object.keys(prospect)).toHaveLength(9);
  });

  it('DrugInteraction severity is one of the valid values', () => {
    const validSeverities: DrugInteraction['severity'][] = ['leve', 'moderada', 'grave'];
    const interaction: DrugInteraction = {
      ingredientA: { id: 'a', name: 'Ibuprofeno', synonyms: [] },
      ingredientB: { id: 'b', name: 'Warfarina', synonyms: [] },
      severity: 'grave',
      description: 'Aumenta el riesgo de sangrado',
    };
    expect(validSeverities).toContain(interaction.severity);
  });

  it('SearchResult shape is correct', () => {
    const result: SearchResult = {
      medicines: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
    expect(result.pageSize).toBe(20);
  });

  it('InteractionResult shape is correct', () => {
    const result: InteractionResult = {
      interactions: [],
      hasInteractions: false,
      exceedsRecommendedLimit: false,
    };
    expect(result.hasInteractions).toBe(false);
  });

  it('HistoryEntry type values are correct', () => {
    const entry: HistoryEntry = {
      id: 'h-1',
      query: 'ibuprofeno',
      type: 'active_ingredient',
      timestamp: Date.now(),
    };
    expect(['active_ingredient', 'commercial_name']).toContain(entry.type);
  });

  it('FilterState is optional', () => {
    const empty: FilterState = {};
    const full: FilterState = {
      laboratory: 'Pfizer',
      pharmaceuticalForm: 'comprimido',
      requiresPrescription: true,
      sortOrder: 'name_asc',
    };
    expect(empty).toBeDefined();
    expect(full.sortOrder).toBe('name_asc');
  });

  it('ApiError shape is correct', () => {
    const err: ApiError = { code: 'QUERY_TOO_SHORT', message: 'El término es muy corto' };
    expect(err.details).toBeUndefined();
  });
});
