/**
 * interactionService — usa Supabase REST API directamente.
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { supabaseQuery } from './supabaseClient';
import type { InteractionResult, DrugInteraction } from '@drug-medicine-lookup/shared';

const RECOMMENDED_LIMIT = 5;

interface IngredientLinkRow { active_ingredient_id: string; }

interface InteractionRow {
  ingredient_a_id: string;
  ingredient_b_id: string;
  severity: 'leve' | 'moderada' | 'grave';
  description: string;
}

interface IngredientRow { id: string; name: string; synonyms: string[] | null; }

export async function checkInteractions(medicineIds: string[]): Promise<InteractionResult> {
  const exceedsRecommendedLimit = medicineIds.length > RECOMMENDED_LIMIT;

  const { data: links } = await supabaseQuery<IngredientLinkRow>('medicine_ingredients', {
    select: 'active_ingredient_id',
    filters: [`medicine_id=in.(${medicineIds.join(',')})`],
  });

  const ingredientIds = [...new Set(links.map((r) => r.active_ingredient_id))];
  if (ingredientIds.length === 0) {
    return { interactions: [], hasInteractions: false, exceedsRecommendedLimit };
  }

  const idList = ingredientIds.join(',');

  const { data: rows } = await supabaseQuery<InteractionRow>('drug_interactions', {
    select: 'ingredient_a_id,ingredient_b_id,severity,description',
    filters: [`or=(ingredient_a_id.in.(${idList}),ingredient_b_id.in.(${idList}))`],
  });

  if (rows.length === 0) {
    return { interactions: [], hasInteractions: false, exceedsRecommendedLimit };
  }

  // Fetch all involved ingredient details
  const allIds = [...new Set(rows.flatMap((r) => [r.ingredient_a_id, r.ingredient_b_id]))];
  const { data: ingredients } = await supabaseQuery<IngredientRow>('active_ingredients', {
    select: 'id,name,synonyms',
    filters: [`id=in.(${allIds.join(',')})`],
  });

  const byId = new Map(ingredients.map((ai) => [ai.id, ai]));

  const interactions: DrugInteraction[] = [];
  for (const row of rows) {
    const aiA = byId.get(row.ingredient_a_id);
    const aiB = byId.get(row.ingredient_b_id);
    if (!aiA || !aiB) continue;

    const ingA = { id: aiA.id, name: aiA.name, synonyms: aiA.synonyms ?? [] };
    const ingB = { id: aiB.id, name: aiB.name, synonyms: aiB.synonyms ?? [] };

    interactions.push({ ingredientA: ingA, ingredientB: ingB, severity: row.severity, description: row.description });
    interactions.push({ ingredientA: ingB, ingredientB: ingA, severity: row.severity, description: row.description });
  }

  return { interactions, hasInteractions: interactions.length > 0, exceedsRecommendedLimit };
}
