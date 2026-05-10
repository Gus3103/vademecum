/**
 * Frontend prospect service.
 *
 * Wraps the API endpoint:
 *   GET /api/v1/medicines/:id/prospect
 *
 * Uses fetchWithRetry for timeout + exponential backoff on 5xx errors.
 */

import type { Prospect } from '@drug-medicine-lookup/shared';
import { API_BASE_URL, fetchWithRetry } from './apiClient';

/**
 * Fetches the full prospect (leaflet) for a given medicine.
 *
 * @param medicineId UUID of the medicine
 * @returns          Prospect data
 * @throws           Error with status 404 if the prospect is not available (PROSPECT_NOT_FOUND)
 */
export async function getProspect(medicineId: string): Promise<Prospect> {
  const url = `${API_BASE_URL}/api/v1/medicines/${encodeURIComponent(medicineId)}/prospect`;

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error((body as { message?: string }).message ?? `HTTP ${response.status}`),
      { status: response.status, body },
    );
  }

  return response.json() as Promise<Prospect>;
}

export const prospectService = {
  getProspect,
};
