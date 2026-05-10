/**
 * searchService — usa Supabase REST API directamente (sin SDK).
 * Requirements: 1.1, 1.2, 1.4, 2.1, 2.2
 */

import { supabaseQuery } from './supabaseClient';
import { normalizeText } from '@drug-medicine-lookup/shared';
import type { Medicine, SearchResult, FilterState, ActiveIngredient, Presentation } from '@drug-medicine-lookup/shared';

const PAGE_SIZE = 20;

interface MedicineRow {
  id: string;
  commercial_name: string;
  laboratory: string;
  pharmaceutical_form: string;
  requires_prescription: boolean;
  presentations: Array<{ dose: string; units: string; quantity: number }> | null;
}

interface IngredientLinkRow {
  medicine_id: string;
  active_ingredient_id: string;
}

interface IngredientRow {
  id: string;
  name: string;
  synonyms: string[] | null;
}

async function fetchIngredients(medicineIds: string[]): Promise<Map<string, ActiveIngredient[]>> {
  if (medicineIds.length === 0) return new Map();

  const { data: links } = await supabaseQuery<IngredientLinkRow>('medicine_ingredients', {
    select: 'medicine_id,active_ingredient_id',
    filters: [`medicine_id=in.(${medicineIds.join(',')})`],
  });

  const ingredientIds = [...new Set(links.map((l) => l.active_ingredient_id))];
  if (ingredientIds.length === 0) return new Map();

  const { data: ingredients } = await supabaseQuery<IngredientRow>('active_ingredients', {
    select: 'id,name,synonyms',
    filters: [`id=in.(${ingredientIds.join(',')})`],
  });

  const ingredientById = new Map(ingredients.map((ai) => [ai.id, ai]));
  const map = new Map<string, ActiveIngredient[]>();

  for (const link of links) {
    const ai = ingredientById.get(link.active_ingredient_id);
    if (!ai) continue;
    const list = map.get(link.medicine_id) ?? [];
    list.push({ id: ai.id, name: ai.name, synonyms: ai.synonyms ?? [] });
    map.set(link.medicine_id, list);
  }

  return map;
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

export async function searchByActiveIngredient(
  query: string,
  filters: FilterState = {},
  page = 1,
): Promise<SearchResult> {
  const term = normalizeText(query);

  const { data: aiData } = await supabaseQuery<{ id: string }>('active_ingredients', {
    select: 'id',
    filters: [`name_normalized=ilike.*${term}*`],
  });

  const ingredientIds = aiData.map((r) => r.id);
  if (ingredientIds.length === 0) {
    return { medicines: [], total: 0, page, pageSize: PAGE_SIZE, totalPages: 0 };
  }

  const { data: linkData } = await supabaseQuery<{ medicine_id: string }>('medicine_ingredients', {
    select: 'medicine_id',
    filters: [`active_ingredient_id=in.(${ingredientIds.join(',')})`],
  });

  const medicineIds = [...new Set(linkData.map((r) => r.medicine_id))];
  if (medicineIds.length === 0) {
    return { medicines: [], total: 0, page, pageSize: PAGE_SIZE, totalPages: 0 };
  }

  const total = medicineIds.length;
  const offset = (page - 1) * PAGE_SIZE;
  const pageIds = medicineIds.slice(offset, offset + PAGE_SIZE);

  const medFilters = [`id=in.(${pageIds.join(',')})`];
  if (filters.laboratory) medFilters.push(`laboratory=eq.${filters.laboratory}`);
  if (filters.pharmaceuticalForm) medFilters.push(`pharmaceutical_form=eq.${filters.pharmaceuticalForm}`);
  if (filters.requiresPrescription != null) medFilters.push(`requires_prescription=eq.${filters.requiresPrescription}`);

  const { data: medData } = await supabaseQuery<MedicineRow>('medicines', {
    select: 'id,commercial_name,laboratory,pharmaceutical_form,requires_prescription,presentations',
    filters: medFilters,
    order: filters.sortOrder === 'name_desc' ? 'commercial_name.desc' : 'commercial_name.asc',
  });

  const ingredientMap = await fetchIngredients(pageIds);
  const medicines = medData.map((row) => rowToMedicine(row, ingredientMap.get(row.id) ?? []));

  return { medicines, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function searchByCommercialName(
  query: string,
  filters: FilterState = {},
  page = 1,
): Promise<SearchResult> {
  const term = normalizeText(query);
  const offset = (page - 1) * PAGE_SIZE;

  const medFilters = [`commercial_name_normalized=ilike.*${term}*`];
  if (filters.laboratory) medFilters.push(`laboratory=eq.${filters.laboratory}`);
  if (filters.pharmaceuticalForm) medFilters.push(`pharmaceutical_form=eq.${filters.pharmaceuticalForm}`);
  if (filters.requiresPrescription != null) medFilters.push(`requires_prescription=eq.${filters.requiresPrescription}`);

  const { data, count } = await supabaseQuery<MedicineRow>('medicines', {
    select: 'id,commercial_name,laboratory,pharmaceutical_form,requires_prescription,presentations',
    filters: medFilters,
    order: filters.sortOrder === 'name_desc' ? 'commercial_name.desc' : 'commercial_name.asc',
    limit: PAGE_SIZE,
    offset,
    count: 'exact',
  });

  const total = count ?? 0;
  const pageIds = data.map((r) => r.id);
  const ingredientMap = await fetchIngredients(pageIds);
  const medicines = data.map((row) => rowToMedicine(row, ingredientMap.get(row.id) ?? []));

  return { medicines, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getSuggestions(query: string, type: 'active' | 'commercial'): Promise<string[]> {
  const term = normalizeText(query);

  if (type === 'active') {
    const { data } = await supabaseQuery<{ name: string }>('active_ingredients', {
      select: 'name',
      filters: [`name_normalized=ilike.*${term}*`],
      order: 'name.asc',
      limit: 10,
    });
    return data.map((r) => r.name);
  }

  const { data } = await supabaseQuery<{ commercial_name: string }>('medicines', {
    select: 'commercial_name',
    filters: [`commercial_name_normalized=ilike.*${term}*`],
    order: 'commercial_name.asc',
    limit: 10,
  });
  return data.map((r) => r.commercial_name);
}
