/**
 * Supabase REST client — usa fetch directamente sin el SDK oficial.
 * Evita el problema de import.meta en el bundler de Expo/Metro.
 */

const SUPABASE_URL = process.env['EXPO_PUBLIC_SUPABASE_URL'] ?? '';
const SUPABASE_ANON_KEY = process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

const BASE_HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

export interface QueryOptions {
  select?: string;
  filters?: string[];   // e.g. ['name_normalized=ilike.*ibu*']
  order?: string;       // e.g. 'name.asc'
  limit?: number;
  offset?: number;
  count?: 'exact';
}

/**
 * Executes a GET query against a Supabase table via the REST API.
 */
export async function supabaseQuery<T>(
  table: string,
  options: QueryOptions = {},
): Promise<{ data: T[]; count: number | null }> {
  const params = new URLSearchParams();

  if (options.select) params.set('select', options.select);
  if (options.order) params.set('order', options.order);
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.offset !== undefined) params.set('offset', String(options.offset));

  for (const filter of options.filters ?? []) {
    const [col, ...rest] = filter.split('=');
    if (col && rest.length > 0) params.set(col, rest.join('='));
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

  const headers: Record<string, string> = { ...BASE_HEADERS };
  if (options.count === 'exact') {
    headers['Prefer'] = 'count=exact';
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Supabase error: ${err}`);
  }

  const countHeader = response.headers.get('content-range');
  let count: number | null = null;
  if (countHeader) {
    const match = countHeader.match(/\/(\d+)$/);
    if (match?.[1]) count = parseInt(match[1], 10);
  }

  const data: T[] = await response.json();
  return { data, count };
}

/**
 * Executes a GET query returning a single row.
 */
export async function supabaseQuerySingle<T>(
  table: string,
  options: QueryOptions = {},
): Promise<T | null> {
  const { data } = await supabaseQuery<T>(table, { ...options, limit: 1 });
  return data[0] ?? null;
}
