/**
 * Normalizes a text string for case- and diacritic-insensitive comparison.
 *
 * Steps:
 *  1. Convert to lowercase
 *  2. Decompose characters using NFD (Canonical Decomposition)
 *  3. Strip combining diacritical marks (U+0300–U+036F)
 *
 * Examples:
 *   normalizeText('Ácido Acetilsalicílico') → 'acido acetilsalicilico'
 *   normalizeText('IBUPROFÉN')             → 'ibuprofén' → 'ibuprofen'
 *   normalizeText('ñoño')                  → 'nono'
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
