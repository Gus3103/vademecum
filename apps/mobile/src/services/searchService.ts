/**
 * Frontend search service.
 *
 * Wraps the API endpoints:
 *   GET /api/v1/medicines/search
 *   GET /api/v1/medicines/suggestions
 *
 * Uses fetchWithRetry for timeout + exponential backoff on 5xx errors.
 * Applies normalizeText to query params before sending (Req. 1.4).
 */

import type { SearchResult, FilterState } from '@drug-medicine-lookup/shared';
import { normalizeText } from '@drug-medicine-lookup/shared';
import { API_BASE_URL, fetchWithRetry } from './apiClient';

/**
 * Builds a URLSearchParams object from the common search parameters.
 */
function buildSearchParams(
  query: string,
  type: 'active' | 'commercial',
  filters?: FilterState,
  page?: number,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set('q', normalizeText(query));
  params.set('type', type);
  if (page !== undefined) {
    params.set('page', String(page));
  }
  if (filters?.laboratory) {
    params.set('lab', filters.laboratory);
  }
  if (filters?.pharmaceuticalForm) {
    params.set('form', filters.pharmaceuticalForm);
  }
  if (filters?.requiresPrescription !== undefined) {
    params.set('prescription', String(filters.requiresPrescription));
  }
  if (filters?.sortOrder) {
    params.set('sort', filters.sortOrder);
  }
  return params;
}

/**
 * Searches medicines by active ingredient (principio activo).
 *
 * @param query   Search term (will be normalized before sending)
 * @param filters Optional filter/sort criteria
 * @param page    Page number (1-based, default: 1)
 * @returns       Paginated SearchResult
 */
export async function searchByActiveIngredient(
  query: string,
  filters?: FilterState,
  page?: number,
): Promise<SearchResult> {
  const params = buildSearchParams(query, 'active', filters, page);
  const url = `${API_BASE_URL}/api/v1/medicines/search?${params.toString()}`;

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error((body as { message?: string }).message ?? `HTTP ${response.status}`),
      { status: response.status, body },
    );
  }

  return response.json() as Promise<SearchResult>;
}

/**
 * Searches medicines by commercial name (nombre comercial).
 *
 * @param query   Search term (will be normalized before sending)
 * @param filters Optional filter/sort criteria
 * @param page    Page number (1-based, default: 1)
 * @returns       Paginated SearchResult
 */
export async function searchByCommercialName(
  query: string,
  filters?: FilterState,
  page?: number,
): Promise<SearchResult> {
  const params = buildSearchParams(query, 'commercial', filters, page);
  const url = `${API_BASE_URL}/api/v1/medicines/search?${params.toString()}`;

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error((body as { message?: string }).message ?? `HTTP ${response.status}`),
      { status: response.status, body },
    );
  }

  return response.json() as Promise<SearchResult>;
}

/**
 * Fetches autocomplete suggestions for a search term.
 *
 * @param query Search term (will be normalized before sending)
 * @param type  Whether to suggest active ingredients or commercial names
 * @returns     Array of suggestion strings
 */
export async function getSuggestions(
  query: string,
  type: 'active' | 'commercial' = 'active',
): Promise<string[]> {
  const params = new URLSearchParams();
  params.set('q', normalizeText(query));
  params.set('type', type);

  const url = `${API_BASE_URL}/api/v1/medicines/suggestions?${params.toString()}`;

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error((body as { message?: string }).message ?? `HTTP ${response.status}`),
      { status: response.status, body },
    );
  }

  return response.json() as Promise<string[]>;
}

export const searchService = {
  searchByActiveIngredient,
  searchByCommercialName,
  getSuggestions,
};
