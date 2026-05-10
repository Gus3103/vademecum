import { Request, Response, NextFunction } from 'express';
import type { ApiError } from '@drug-medicine-lookup/shared';
import { DomainError } from '../services/domainErrors';

/**
 * Maps domain error codes to HTTP status codes.
 */
const DOMAIN_ERROR_STATUS: Record<string, number> = {
  QUERY_TOO_SHORT: 400,
  INVALID_REQUEST: 400,
  PROSPECT_NOT_FOUND: 404,
  MEDICINE_NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
  UPSTREAM_TIMEOUT: 503,
};

/**
 * Global Express error-handling middleware.
 *
 * - Catches `DomainError` instances and maps them to the appropriate HTTP
 *   status code using `DOMAIN_ERROR_STATUS`.
 * - Catches unknown errors and returns 500 with code `INTERNAL_ERROR`.
 * - Includes `details` only when `NODE_ENV === 'development'`.
 *
 * Requisitos: 1.3, 2.3, 3.3, 4.4
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const isDevelopment = process.env['NODE_ENV'] === 'development';

  if (err instanceof DomainError) {
    const status = DOMAIN_ERROR_STATUS[err.code] ?? 500;

    const body: ApiError = {
      code: err.code,
      message: err.message,
      ...(isDevelopment ? { details: { stack: err.stack } } : {}),
    };

    res.status(status).json(body);
    return;
  }

  // Unknown / unexpected error
  const body: ApiError = {
    code: 'INTERNAL_ERROR',
    message: 'Se produjo un error interno. Por favor, inténtelo de nuevo más tarde.',
    ...(isDevelopment && err instanceof Error
      ? { details: { stack: err.stack, originalMessage: err.message } }
      : {}),
  };

  res.status(500).json(body);
}
