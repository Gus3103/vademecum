import type { Prospect } from '@drug-medicine-lookup/shared';
import { ProspectRepository } from '../repositories/prospectRepository';
import { DomainError } from './domainErrors';

/**
 * ProspectService handles retrieval of medicine prospect information.
 *
 * Delegates to `ProspectRepository` and throws a `DomainError` with code
 * `PROSPECT_NOT_FOUND` when no prospect exists for the requested medicine.
 */
export class ProspectService {
  private readonly prospectRepository: ProspectRepository;

  constructor(prospectRepository?: ProspectRepository) {
    this.prospectRepository = prospectRepository ?? new ProspectRepository();
  }

  /**
   * Returns the prospect for the given medicine ID.
   *
   * @param medicineId - UUID of the medicine
   * @throws {DomainError} with code `PROSPECT_NOT_FOUND` if no prospect exists
   */
  async getProspect(medicineId: string): Promise<Prospect> {
    const prospect = await this.prospectRepository.findByMedicineId(medicineId);

    if (prospect === null) {
      throw new DomainError(
        'PROSPECT_NOT_FOUND',
        `No se encontró el prospecto para el medicamento con id "${medicineId}". Consulte a su profesional de salud.`,
      );
    }

    return prospect;
  }
}
