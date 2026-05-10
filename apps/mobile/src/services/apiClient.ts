/**
 * Shared HTTP client utility for the mobile app.
 *
 * Features:
 * - 10-second timeout via AbortController
 * - Up to 2 retries with exponential backoff (1s, 2s) for 5xx errors only
 * - 4xx errors are NOT retried
 * - Base URL from EXPO_PUBLIC_API_URL environment variable
 */

export const API_BASE_URL =
  process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const BACKOFF_BASE_MS = 1_000;

/**
 * Sleeps for the given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Performs a fetch request with:
 * - A 10-second timeout (AbortController)
 * - Automatic retries with exponential backoff for 5xx responses
 *
 * @param url     Full URL to fetch
 * @param options Standard RequestInit options
 * @param retries Number of retries remaining (default: MAX_RETRIES)
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = MAX_RETRIES,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    // Network error or abort — propagate without retrying
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  // 5xx errors are retried with exponential backoff
  if (response.status >= 500 && retries > 0) {
    const attempt = MAX_RETRIES - retries + 1; // 1-based attempt number
    const delayMs = BACKOFF_BASE_MS * Math.pow(2, attempt - 1); // 1s, 2s
    await sleep(delayMs);
    return fetchWithRetry(url, options, retries - 1);
  }

  return response;
}
