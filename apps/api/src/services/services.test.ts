/**
 * Unit tests for domain services.
 *
 * Tarea 6.4: Tests unitarios para SearchService, ProspectService e InteractionService.
 *
 * Uses lightweight in-memory stubs instead of pg-mem to keep tests fast
 * and focused on service-layer logic.
 *
 * Requirements: 1.2, 3.3, 4.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SearchResult, Prospect, InteractionResult, Medicine } from '@drug-medicine-lookup/shared';
import { SearchService } from './searchService';
import { ProspectService } from './prospectService';
import { InteractionService } from './interactionService';
import { DomainError } from './domainErrors';
import type { MedicineRepository } from '../repositories/medicineRepository';
import type { ProspectRepository } from '../repositories/prospectRepository';
import type { InteractionRepository } from '../repositories/interactionRepository';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEmptySearchResult(page = 1): SearchResult {
  return { medicines: [], total: 0, page, pageSize: 20, totalPages: 0 };
}

function makeMedicine(id: string): Medicine {
  return {
    id,
    commercialName: `Medicine ${id}`,
    laboratory: 'Lab',
    pharmaceuticalForm: 'comprimido',
    requiresPrescription: false,
    presentations: [{ dose: '500mg', units: 'comprimidos', quantity: 20 }],
    activeIngredients: [{ id: `ai-${id}`, name: `Ingredient ${id}`, synonyms: [] }],
  };
}

function makeProspect(medicineId: string): Prospect {
  return {
    medicineId,
    indications: 'Dolor',
    dosage: '500mg',
    contraindications: 'Ninguna',
    warnings: 'Ninguna',
    interactionsText: 'Ninguna',
    adverseEffects: 'Ninguno',
    overdose: 'Consultar médico',
    storage: 'Temperatura ambiente',
  };
}

// ─── SearchService ────────────────────────────────────────────────────────────

describe('SearchService', () => {
  let mockRepo: MedicineRepository;
  let service: SearchService;

  beforeEach(() => {
    mockRepo = {
      searchByActiveIngredient: vi.fn().mockResolvedValue(makeEmptySearchResult()),
      searchByCommercialName: vi.fn().mockResolvedValue(makeEmptySearchResult()),
      getSuggestions: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as MedicineRepository;

    service = new SearchService(mockRepo);
  });

  it('lanza QUERY_TOO_SHORT cuando el término tiene menos de 3 caracteres', async () => {
    await expect(service.search('ab', 'active', {}, 1)).rejects.toMatchObject({
      code: 'QUERY_TOO_SHORT',
    });
  });

  it('lanza QUERY_TOO_SHORT para cadena vacía', async () => {
    await expect(service.search('', 'active', {}, 1)).rejects.toMatchObject({
      code: 'QUERY_TOO_SHORT',
    });
  });

  it('lanza QUERY_TOO_SHORT para término con solo espacios', async () => {
    await expect(service.search('   ', 'active', {}, 1)).rejects.toMatchObject({
      code: 'QUERY_TOO_SHORT',
    });
  });

  it('delega en searchByActiveIngredient cuando type es "active"', async () => {
    await service.search('ibuprofeno', 'active', {}, 1);
    expect(mockRepo.searchByActiveIngredient).toHaveBeenCalledOnce();
    expect(mockRepo.searchByCommercialName).not.toHaveBeenCalled();
  });

  it('delega en searchByCommercialName cuando type es "commercial"', async () => {
    await service.search('ibupirac', 'commercial', {}, 1);
    expect(mockRepo.searchByCommercialName).toHaveBeenCalledOnce();
    expect(mockRepo.searchByActiveIngredient).not.toHaveBeenCalled();
  });

  it('acepta término de exactamente 3 caracteres', async () => {
    await expect(service.search('ibu', 'active', {}, 1)).resolves.toBeDefined();
  });

  it('getSuggestions lanza QUERY_TOO_SHORT para término corto', async () => {
    await expect(service.getSuggestions('ab', 'active')).rejects.toMatchObject({
      code: 'QUERY_TOO_SHORT',
    });
  });

  it('getSuggestions delega en el repositorio para término válido', async () => {
    await service.getSuggestions('ibu', 'active');
    expect(mockRepo.getSuggestions).toHaveBeenCalledOnce();
  });

  it('el error lanzado es instancia de DomainError', async () => {
    try {
      await service.search('ab', 'active', {}, 1);
      expect.fail('Debería haber lanzado un error');
    } catch (err) {
      expect(err).toBeInstanceOf(DomainError);
    }
  });
});

// ─── ProspectService ──────────────────────────────────────────────────────────

describe('ProspectService', () => {
  let mockRepo: ProspectRepository;
  let service: ProspectService;

  beforeEach(() => {
    mockRepo = {
      findByMedicineId: vi.fn(),
    } as unknown as ProspectRepository;

    service = new ProspectService(mockRepo);
  });

  it('devuelve el prospecto cuando existe', async () => {
    const prospect = makeProspect('med-1');
    vi.mocked(mockRepo.findByMedicineId).mockResolvedValue(prospect);

    const result = await service.getProspect('med-1');
    expect(result).toEqual(prospect);
  });

  it('lanza PROSPECT_NOT_FOUND cuando el repositorio devuelve null', async () => {
    vi.mocked(mockRepo.findByMedicineId).mockResolvedValue(null);

    await expect(service.getProspect('med-inexistente')).rejects.toMatchObject({
      code: 'PROSPECT_NOT_FOUND',
    });
  });

  it('el error PROSPECT_NOT_FOUND es instancia de DomainError', async () => {
    vi.mocked(mockRepo.findByMedicineId).mockResolvedValue(null);

    try {
      await service.getProspect('med-inexistente');
      expect.fail('Debería haber lanzado un error');
    } catch (err) {
      expect(err).toBeInstanceOf(DomainError);
    }
  });

  it('el mensaje de error menciona el id del medicamento', async () => {
    vi.mocked(mockRepo.findByMedicineId).mockResolvedValue(null);

    try {
      await service.getProspect('med-xyz');
      expect.fail('Debería haber lanzado un error');
    } catch (err) {
      expect((err as DomainError).message).toContain('med-xyz');
    }
  });
});

// ─── InteractionService ───────────────────────────────────────────────────────

describe('InteractionService', () => {
  let mockMedicineRepo: MedicineRepository;
  let mockInteractionRepo: InteractionRepository;
  let service: InteractionService;

  beforeEach(() => {
    mockMedicineRepo = {
      findById: vi.fn(),
      searchByActiveIngredient: vi.fn(),
      searchByCommercialName: vi.fn(),
      getSuggestions: vi.fn(),
    } as unknown as MedicineRepository;

    mockInteractionRepo = {
      findInteractions: vi.fn().mockResolvedValue([]),
    } as unknown as InteractionRepository;

    service = new InteractionService(mockMedicineRepo, mockInteractionRepo);
  });

  it('exceedsRecommendedLimit es false con 5 o menos medicamentos', async () => {
    vi.mocked(mockMedicineRepo.findById).mockResolvedValue(makeMedicine('1'));

    const result = await service.checkInteractions(['1', '2', '3', '4', '5']);
    expect(result.exceedsRecommendedLimit).toBe(false);
  });

  it('exceedsRecommendedLimit es true con más de 5 medicamentos', async () => {
    vi.mocked(mockMedicineRepo.findById).mockResolvedValue(makeMedicine('1'));

    const result = await service.checkInteractions(['1', '2', '3', '4', '5', '6']);
    expect(result.exceedsRecommendedLimit).toBe(true);
  });

  it('hasInteractions es false cuando no hay interacciones', async () => {
    vi.mocked(mockMedicineRepo.findById).mockResolvedValue(makeMedicine('1'));
    vi.mocked(mockInteractionRepo.findInteractions).mockResolvedValue([]);

    const result = await service.checkInteractions(['1', '2']);
    expect(result.hasInteractions).toBe(false);
    expect(result.interactions).toHaveLength(0);
  });

  it('hasInteractions es true cuando hay interacciones', async () => {
    const med = makeMedicine('1');
    vi.mocked(mockMedicineRepo.findById).mockResolvedValue(med);
    vi.mocked(mockInteractionRepo.findInteractions).mockResolvedValue([
      {
        ingredientA: { id: 'ai-1', name: 'Ibuprofeno', synonyms: [] },
        ingredientB: { id: 'ai-2', name: 'Warfarina', synonyms: [] },
        severity: 'grave',
        description: 'Aumenta el riesgo de sangrado',
      },
    ]);

    const result = await service.checkInteractions(['1', '2']);
    expect(result.hasInteractions).toBe(true);
    expect(result.interactions).toHaveLength(1);
  });

  it('maneja medicamentos no encontrados (findById devuelve null) sin lanzar error', async () => {
    vi.mocked(mockMedicineRepo.findById).mockResolvedValue(null);

    const result = await service.checkInteractions(['inexistente']);
    expect(result).toBeDefined();
    expect(result.interactions).toHaveLength(0);
  });

  it('con exactamente 6 medicamentos activa exceedsRecommendedLimit', async () => {
    vi.mocked(mockMedicineRepo.findById).mockResolvedValue(makeMedicine('x'));

    const ids = ['1', '2', '3', '4', '5', '6'];
    const result = await service.checkInteractions(ids);
    expect(result.exceedsRecommendedLimit).toBe(true);
  });

  it('la respuesta siempre incluye las tres propiedades requeridas', async () => {
    vi.mocked(mockMedicineRepo.findById).mockResolvedValue(makeMedicine('1'));

    const result: InteractionResult = await service.checkInteractions(['1']);
    expect(result).toHaveProperty('interactions');
    expect(result).toHaveProperty('hasInteractions');
    expect(result).toHaveProperty('exceedsRecommendedLimit');
  });
});
