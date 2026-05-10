/**
 * interactionService — llama directo a Supabase.
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { supabase } from './supabaseClient';
import type { InteractionResult, DrugInteraction } from '@drug-medicine-lookup/shared';

const RECOMMENDED_LIMIT = 5;

interface IngredientData {
  id: string;
  name: string;
  synonyms: string[] | null;
}

interface InteractionRow {
  severity: 'leve' | 'moderada' | 'grave';
  description: string;
  ingredient_a: IngredientData | IngredientData[] | null;
  ingredient_b: IngredientData | IngredientData[] | null;
}

function toIngredient(raw: IngredientData | IngredientData[] | null) {
  const ai = Array.isArray(raw) ? raw[0] : raw;
  if (!ai) return null;
  return { id: ai.id, name: ai.name, synonyms: ai.synonyms ?? [] };
}

export async function checkInteractions(medicineIds: string[]): Promise<InteractionResult> {
  const exceedsRecommendedLimit = medicineIds.length > RECOMMENDED_LIMIT;

  // Get active ingredient IDs for all selected medicines
  const { data: linkData } = await supabase
    .from('medicine_ingredients')
    .select('active_ingredient_id')
    .in('medicine_id', medicineIds);

  const ingredientIds = [
    ...new Set(
      ((linkData ?? []) as Array<{ active_ingredient_id: string }>).map((r) => r.active_ingredient_id),
    ),
  ];

  if (ingredientIds.length === 0) {
    return { interactions: [], hasInteractions: false, exceedsRecommendedLimit };
  }

  const { data, error } = await supabase
    .from('drug_interactions')
    .select(`
      severity,
      description,
      ingredient_a:active_ingredients!ingredient_a_id(id, name, synonyms),
      ingredient_b:active_ingredients!ingredient_b_id(id, name, synonyms)
    `)
    .or(`ingredient_a_id.in.(${ingredientIds.join(',')}),ingredient_b_id.in.(${ingredientIds.join(',')})`);

  if (error) throw new Error(error.message);

  const interactions: DrugInteraction[] = [];

  for (const row of (data ?? []) as unknown as InteractionRow[]) {
    const aiA = toIngredient(row.ingredient_a);
    const aiB = toIngredient(row.ingredient_b);
    if (!aiA || !aiB) continue;

    interactions.push({ ingredientA: aiA, ingredientB: aiB, severity: row.severity, description: row.description });
    interactions.push({ ingredientA: aiB, ingredientB: aiA, severity: row.severity, description: row.description });
  }

  return { interactions, hasInteractions: interactions.length > 0, exceedsRecommendedLimit };
}
