import { supabaseQuery } from './supabaseClient';
import { normalizeText } from '@drug-medicine-lookup/shared';
import type { Medicine, SearchResult, FilterState, ActiveIngredient } from './types';

const PAGE_SIZE = 20;

async function fetchIngredients(medicineIds: string[]): Promise<Map<string, ActiveIngredient[]>> {
  if (!medicineIds.length) return new Map();
  const { data: links } = await supabaseQuery<{ medicine_id: string; active_ingredient_id: string }>('medicine_ingredients', {
    select: 'medicine_id,active_ingredient_id',
    filters: [`medicine_id=in.(${medicineIds.join(',')})`],
  });
  const ingIds = [...new Set(links.map(l => l.active_ingredient_id))];
  if (!ingIds.length) return new Map();
  const { data: ings } = await supabaseQuery<{ id: string; name: string; synonyms: string[] | null }>('active_ingredients', {
    select: 'id,name,synonyms',
    filters: [`id=in.(${ingIds.join(',')})`],
  });
  const byId = new Map(ings.map(ai => [ai.id, ai]));
  const map = new Map<string, ActiveIngredient[]>();
  for (const link of links) {
    const ai = byId.get(link.active_ingredient_id);
    if (!ai) continue;
    const list = map.get(link.medicine_id) ?? [];
    list.push({ id: ai.id, name: ai.name, synonyms: ai.synonyms ?? [] });
    map.set(link.medicine_id, list);
  }
  return map;
}

function rowToMedicine(row: Record<string, unknown>, ingredients: ActiveIngredient[]): Medicine {
  const presentations = Array.isArray(row.presentations)
    ? (row.presentations as Array<{ dose: string; units: string; quantity: number }>).map(p => ({ dose: p.dose, units: p.units, quantity: p.quantity }))
    : [];
  return {
    id: row.id as string,
    commercialName: row.commercial_name as string,
    laboratory: row.laboratory as string,
    pharmaceuticalForm: row.pharmaceutical_form as string,
    requiresPrescription: row.requires_prescription as boolean,
    presentations,
    activeIngredients: ingredients,
  };
}

export async function searchByActiveIngredient(query: string, filters: FilterState = {}, page = 1): Promise<SearchResult> {
  const term = normalizeText(query);
  const { data: aiData } = await supabaseQuery<{ id: string }>('active_ingredients', {
    select: 'id', filters: [`name_normalized=ilike.*${term}*`],
  });
  const ingredientIds = aiData.map(r => r.id);
  if (!ingredientIds.length) return { medicines: [], total: 0, page, pageSize: PAGE_SIZE, totalPages: 0 };

  const { data: linkData } = await supabaseQuery<{ medicine_id: string }>('medicine_ingredients', {
    select: 'medicine_id', filters: [`active_ingredient_id=in.(${ingredientIds.join(',')})`],
  });
  const medicineIds = [...new Set(linkData.map(r => r.medicine_id))];
  if (!medicineIds.length) return { medicines: [], total: 0, page, pageSize: PAGE_SIZE, totalPages: 0 };

  const total = medicineIds.length;
  const pageIds = medicineIds.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const medFilters = [`id=in.(${pageIds.join(',')})`];
  if (filters.laboratory) medFilters.push(`laboratory=eq.${filters.laboratory}`);
  if (filters.pharmaceuticalForm) medFilters.push(`pharmaceutical_form=eq.${filters.pharmaceuticalForm}`);
  if (filters.requiresPrescription != null) medFilters.push(`requires_prescription=eq.${filters.requiresPrescription}`);

  const { data } = await supabaseQuery<Record<string, unknown>>('medicines', {
    select: 'id,commercial_name,laboratory,pharmaceutical_form,requires_prescription,presentations',
    filters: medFilters,
    order: filters.sortOrder === 'name_desc' ? 'commercial_name.desc' : 'commercial_name.asc',
  });
  const ingredientMap = await fetchIngredients(pageIds);
  return { medicines: data.map(r => rowToMedicine(r, ingredientMap.get(r.id as string) ?? [])), total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function searchByCommercialName(query: string, filters: FilterState = {}, page = 1): Promise<SearchResult> {
  const term = normalizeText(query);
  const offset = (page - 1) * PAGE_SIZE;
  const medFilters = [`commercial_name_normalized=ilike.*${term}*`];
  if (filters.laboratory) medFilters.push(`laboratory=eq.${filters.laboratory}`);
  if (filters.pharmaceuticalForm) medFilters.push(`pharmaceutical_form=eq.${filters.pharmaceuticalForm}`);
  if (filters.requiresPrescription != null) medFilters.push(`requires_prescription=eq.${filters.requiresPrescription}`);

  const { data, count } = await supabaseQuery<Record<string, unknown>>('medicines', {
    select: 'id,commercial_name,laboratory,pharmaceutical_form,requires_prescription,presentations',
    filters: medFilters,
    order: filters.sortOrder === 'name_desc' ? 'commercial_name.desc' : 'commercial_name.asc',
    limit: PAGE_SIZE, offset, count: 'exact',
  });
  const pageIds = data.map(r => r.id as string);
  const ingredientMap = await fetchIngredients(pageIds);
  const total = count ?? 0;
  return { medicines: data.map(r => rowToMedicine(r, ingredientMap.get(r.id as string) ?? [])), total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getSuggestions(query: string, type: 'active' | 'commercial'): Promise<string[]> {
  const term = normalizeText(query);
  if (type === 'active') {
    const { data } = await supabaseQuery<{ name: string }>('active_ingredients', { select: 'name', filters: [`name_normalized=ilike.*${term}*`], order: 'name.asc', limit: 10 });
    return data.map(r => r.name);
  }
  const { data } = await supabaseQuery<{ commercial_name: string }>('medicines', { select: 'commercial_name', filters: [`commercial_name_normalized=ilike.*${term}*`], order: 'commercial_name.asc', limit: 10 });
  return data.map(r => r.commercial_name);
}
