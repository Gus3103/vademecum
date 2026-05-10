const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

const BASE_HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

export interface QueryOptions {
  select?: string;
  filters?: string[];
  order?: string;
  limit?: number;
  offset?: number;
  count?: 'exact';
}

export async function supabaseQuery<T>(table: string, options: QueryOptions = {}): Promise<{ data: T[]; count: number | null }> {
  const params = new URLSearchParams();
  if (options.select) params.set('select', options.select);
  if (options.order) params.set('order', options.order);
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.offset !== undefined) params.set('offset', String(options.offset));
  for (const filter of options.filters ?? []) {
    const eqIdx = filter.indexOf('=');
    if (eqIdx > 0) params.set(filter.slice(0, eqIdx), filter.slice(eqIdx + 1));
  }

  const headers: Record<string, string> = { ...BASE_HEADERS };
  if (options.count === 'exact') headers['Prefer'] = 'count=exact';

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers });
  if (!response.ok) throw new Error(await response.text());

  const countHeader = response.headers.get('content-range');
  const count = countHeader ? parseInt(countHeader.split('/')[1] ?? '0', 10) : null;
  const data: T[] = await response.json();
  return { data, count };
}
