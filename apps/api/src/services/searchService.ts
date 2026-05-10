import { normalizeText } from '@drug-medicine-lookup/shared';
import type { SearchResult, FilterState } from '@drug-medicine-lookup/shared';
import { MedicineRepository } from '../repositories/medicineRepository';
import { DomainError } from './domainErrors';

/**
 * SearchService orchestrates medicine search operations.
 *
 * Applies `normalizeText` to the incoming query before delegating to
 * `MedicineRepository`. Throws a `DomainError` with code `QUERY_TOO_SHORT`
 * when the trimmed query is shorter than 3 characters.
 */
export class SearchService {
  private readonly medicineRepository: MedicineRepository;

  constructor(medicineRepository?: MedicineRepository) {
    this.medicineRepository = medicineRepository ?? new MedicineRepository();
  }

  /**
   * Searches medicines by active ingredient or commercial name.
   *
   * @param query   - Raw search term entered by the user
   * @param type    - 'active' to search by active ingredient, 'commercial' by commercial name
   * @param filters - Optional filters (laboratory, pharmaceuticalForm, requiresPrescription, sortOrder)
   * @param page    - 1-based page number
   * @throws {DomainError} with code `QUERY_TOO_SHORT` if `query.trim().length < 3`
   */
  async search(
    query: string,
    type: 'active' | 'commercial',
    filters: FilterState,
    page: number,
  ): Promise<SearchResult> {
    if (query.trim().length < 3) {
      throw new DomainError(
        'QUERY_TOO_SHORT',
        'El término de búsqueda debe tener al menos 3 caracteres.',
      );
    }

    const normalizedQuery = normalizeText(query);

    if (type === 'active') {
      return this.medicineRepository.searchByActiveIngredient(normalizedQuery, filters, page);
    }

    return this.medicineRepository.searchByCommercialName(normalizedQuery, filters, page);
  }

  /**
   * Returns autocomplete suggestions for the given query.
   *
   * @param query - Raw search term entered by the user
   * @param type  - 'active' for active ingredient names, 'commercial' for commercial names
   * @throws {DomainError} with code `QUERY_TOO_SHORT` if `query.trim().length < 3`
   */
  async getSuggestions(query: string, type: 'active' | 'commercial'): Promise<string[]> {
    if (query.trim().length < 3) {
      throw new DomainError(
        'QUERY_TOO_SHORT',
        'El término de búsqueda debe tener al menos 3 caracteres.',
      );
    }

    const normalizedQuery = normalizeText(query);
    return this.medicineRepository.getSuggestions(normalizedQuery, type);
  }
}
