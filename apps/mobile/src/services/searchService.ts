/**
 * searchService — llama directo a Supabase (sin API Express intermedia).
 * Requirements: 1.1, 1.2, 1.4, 2.1, 2.2
 */

import { supabase } from './supabaseClient';
import { normalizeText } from '@drug-medicine-lookup/shared';
import type { Medicine, SearchResult, FilterState, ActiveIngredient, Presentation } from '@drug-medicine-lookup/shared';

const PAGE_SIZE = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchIngredients(medicineIds: string[]): Promise<Map<string, ActiveIngredient[]>> {
  if (medicineIds.length === 0) return new Map();

  const { data } = await supabase
    .from('medicine_ingredients')
    .select('medicine_id, active_ingredient_id, active_ingredients(id, name, synonyms)')
    .in('medicine_id', medicineIds);

  const map = new Map<string, ActiveIngredient[]>();
  for (const row of (data ?? []) as unknown as Array<{
    medicine_id: string;
    active_ingredient_id: string;
    active_ingredients: { id: string; name: string; synonyms: string[] | null } | null;
  }>) {
    const ai = row.active_ingredients;
    if (!ai) continue;
    const list = map.get(row.medicine_id) ?? [];
    list.push({ id: ai.id, name: ai.name, synonyms: ai.synonyms ?? [] });
    map.set(row.medicine_id, list);
  }
  return map;
}

interface MedicineRow {
  id: string;
  commercial_name: string;
  laboratory: string;
  pharmaceutical_form: string;
  requires_prescription: boolean;
  presentations: Array<{ dose: string; units: string; quantity: number }> | null;
}

function rowToMedicine(row: MedicineRow, ingredients: ActiveIngredient[]): Medicine {
  const presentations: Presentation[] = Array.isArray(row.presentations)
    ? row.presentations.map((p) => ({ dose: p.dose, units: p.units, quantity: p.quantity }))
    : [];
  return {
    id: row.id,
    commercialName: row.commercial_name,
    laboratory: row.laboratory,
    pharmaceuticalForm: row.pharmaceutical_form,
    requiresPrescription: row.requires_prescription,
    presentations,
    activeIngredients: ingredients,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function searchByActiveIngredient(
  query: string,
  filters: FilterState = {},
  page = 1,
): Promise<SearchResult> {
  const term = normalizeText(query);

  // Find matching ingredient IDs
  const { data: aiData } = await supabase
    .from('active_ingredients')
    .select('id')
    .ilike('name_normalized', `%${term}%`);

  const ingredientIds = ((aiData ?? []) as Array<{ id: string }>).map((r) => r.id);
  if (ingredientIds.length === 0) {
    return { medicines: [], total: 0, page, pageSize: PAGE_SIZE, totalPages: 0 };
  }

  // Find medicine IDs linked to those ingredients
  const { data: linkData } = await supabase
    .from('medicine_ingredients')
    .select('medicine_id')
    .in('active_ingredient_id', ingredientIds);

  const medicineIds = [
    ...new Set(((linkData ?? []) as Array<{ medicine_id: string }>).map((r) => r.medicine_id)),
  ];
  if (medicineIds.length === 0) {
    return { medicines: [], total: 0, page, pageSize: PAGE_SIZE, totalPages: 0 };
  }

  const total = medicineIds.length;
  const offset = (page - 1) * PAGE_SIZE;
  const pageIds = medicineIds.slice(offset, offset + PAGE_SIZE);

  // Build query with optional filters
  let medQuery = supabase
    .from('medicines')
    .select('id, commercial_name, laboratory, pharmaceutical_form, requires_prescription, presentations')
    .in('id', pageIds)
    .order('commercial_name', { ascending: filters.sortOrder !== 'name_desc' });

  if (filters.laboratory) medQuery = medQuery.eq('laboratory', filters.laboratory);
  if (filters.pharmaceuticalForm) medQuery = medQuery.eq('pharmaceutical_form', filters.pharmaceuticalForm);
  if (filters.requiresPrescription != null) medQuery = medQuery.eq('requires_prescription', filters.requiresPrescription);

  const { data: medData, error } = await medQuery;
  if (error) throw new Error(error.message);

  const ingredientMap = await fetchIngredients(pageIds);
  const medicines = ((medData ?? []) as MedicineRow[]).map((row) =>
    rowToMedicine(row, ingredientMap.get(row.id) ?? []),
  );

  return { medicines, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function searchByCommercialName(
  query: string,
  filters: FilterState = {},
  page = 1,
): Promise<SearchResult> {
  const term = normalizeText(query);
  const offset = (page - 1) * PAGE_SIZE;

  // Count
  let countQuery = supabase
    .from('medicines')
    .select('id', { count: 'exact', head: true })
    .ilike('commercial_name_normalized', `%${term}%`);
  if (filters.laboratory) countQuery = countQuery.eq('laboratory', filters.laboratory);
  if (filters.pharmaceuticalForm) countQuery = countQuery.eq('pharmaceutical_form', filters.pharmaceuticalForm);
  if (filters.requiresPrescription != null) countQuery = countQuery.eq('requires_prescription', filters.requiresPrescription);

  const { count } = await countQuery;
  const total = count ?? 0;

  // Data
  let dataQuery = supabase
    .from('medicines')
    .select('id, commercial_name, laboratory, pharmaceutical_form, requires_prescription, presentations')
    .ilike('commercial_name_normalized', `%${term}%`)
    .order('commercial_name', { ascending: filters.sortOrder !== 'name_desc' })
    .range(offset, offset + PAGE_SIZE - 1);
  if (filters.laboratory) dataQuery = dataQuery.eq('laboratory', filters.laboratory);
  if (filters.pharmaceuticalForm) dataQuery = dataQuery.eq('pharmaceutical_form', filters.pharmaceuticalForm);
  if (filters.requiresPrescription != null) dataQuery = dataQuery.eq('requires_prescription', filters.requiresPrescription);

  const { data, error } = await dataQuery;
  if (error) throw new Error(error.message);

  const pageIds = ((data ?? []) as MedicineRow[]).map((r) => r.id);
  const ingredientMap = await fetchIngredients(pageIds);
  const medicines = ((data ?? []) as MedicineRow[]).map((row) =>
    rowToMedicine(row, ingredientMap.get(row.id) ?? []),
  );

  return { medicines, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getSuggestions(query: string, type: 'active' | 'commercial'): Promise<string[]> {
  const term = normalizeText(query);

  if (type === 'active') {
    const { data } = await supabase
      .from('active_ingredients')
      .select('name')
      .ilike('name_normalized', `%${term}%`)
      .order('name')
      .limit(10);
    return ((data ?? []) as Array<{ name: string }>).map((r) => r.name);
  }

  const { data } = await supabase
    .from('medicines')
    .select('commercial_name')
    .ilike('commercial_name_normalized', `%${term}%`)
    .order('commercial_name')
    .limit(10);
  return ((data ?? []) as Array<{ commercial_name: string }>).map((r) => r.commercial_name);
}
