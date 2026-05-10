import type { InteractionResult } from '@drug-medicine-lookup/shared';
import { MedicineRepository } from '../repositories/medicineRepository';
import { InteractionRepository } from '../repositories/interactionRepository';

const RECOMMENDED_MEDICINE_LIMIT = 5;

/**
 * InteractionService checks for drug interactions among a list of medicines.
 *
 * For each medicine ID it resolves the associated active ingredient IDs via
 * `MedicineRepository`, then delegates the interaction lookup to
 * `InteractionRepository`. Sets `exceedsRecommendedLimit: true` when more
 * than 5 medicine IDs are provided (Req. 4.4).
 */
export class InteractionService {
  private readonly medicineRepository: MedicineRepository;
  private readonly interactionRepository: InteractionRepository;

  constructor(
    medicineRepository?: MedicineRepository,
    interactionRepository?: InteractionRepository,
  ) {
    this.medicineRepository = medicineRepository ?? new MedicineRepository();
    this.interactionRepository = interactionRepository ?? new InteractionRepository();
  }

  /**
   * Checks for known drug interactions among the given medicines.
   *
   * @param medicineIds - Array of medicine UUIDs to check
   * @returns An `InteractionResult` with the found interactions, a boolean
   *          `hasInteractions`, and `exceedsRecommendedLimit` set to `true`
   *          when more than 5 medicine IDs are provided.
   */
  async checkInteractions(medicineIds: string[]): Promise<InteractionResult> {
    const exceedsRecommendedLimit = medicineIds.length > RECOMMENDED_MEDICINE_LIMIT;

    // Resolve active ingredient IDs for each medicine (in parallel)
    const medicineResults = await Promise.all(
      medicineIds.map((id) => this.medicineRepository.findById(id)),
    );

    // Collect unique active ingredient IDs across all medicines
    const ingredientIdSet = new Set<string>();
    for (const medicine of medicineResults) {
      if (medicine !== null) {
        for (const ingredient of medicine.activeIngredients) {
          ingredientIdSet.add(ingredient.id);
        }
      }
    }

    const ingredientIds = Array.from(ingredientIdSet);

    // Delegate to the interaction repository
    const interactions = await this.interactionRepository.findInteractions(ingredientIds);

    return {
      interactions,
      hasInteractions: interactions.length > 0,
      exceedsRecommendedLimit,
    };
  }
}
