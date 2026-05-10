/**
 * Frontend interaction service.
 *
 * Wraps the API endpoint:
 *   POST /api/v1/interactions/check
 *
 * Uses fetchWithRetry for timeout + exponential backoff on 5xx errors.
 */

import type { InteractionResult } from '@drug-medicine-lookup/shared';
import { API_BASE_URL, fetchWithRetry } from './apiClient';

/**
 * Checks drug interactions for the given list of medicine IDs.
 *
 * When more than 5 medicines are provided, the API will set
 * `exceedsRecommendedLimit: true` in the response (Req. 4.4).
 *
 * @param medicineIds Array of medicine UUIDs to check
 * @returns           InteractionResult with interactions and metadata
 */
export async function checkInteractions(
  medicineIds: string[],
): Promise<InteractionResult> {
  const url = `${API_BASE_URL}/api/v1/interactions/check`;

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ medicineIds }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error((body as { message?: string }).message ?? `HTTP ${response.status}`),
      { status: response.status, body },
    );
  }

  return response.json() as Promise<InteractionResult>;
}

export const interactionService = {
  checkInteractions,
};
