/**
 * Domain error class for business logic errors.
 * Carries a machine-readable `code` alongside the human-readable message.
 */
export class DomainError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
