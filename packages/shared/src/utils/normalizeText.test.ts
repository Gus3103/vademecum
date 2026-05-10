/**
 * Tests for normalizeText utility.
 *
 * Covers:
 *  - Tarea 2.2: Property-based test — idempotencia (Propiedad 1)
 *  - Tarea 2.3: Unit tests — casos concretos
 *
 * Requirements: 1.4
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { normalizeText } from './normalizeText.js';

// ─── Tarea 2.2: Test de propiedad ────────────────────────────────────────────

describe('Propiedad 1: Normalización de texto es idempotente', () => {
  it('normalizeText(x) === normalizeText(normalizeText(x)) para cualquier string', () => {
    // Feature: drug-medicine-lookup, Propiedad 1: Normalización de texto es idempotente
    fc.assert(
      fc.property(fc.string(), (text) => {
        const once = normalizeText(text);
        const twice = normalizeText(once);
        return once === twice;
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Tarea 2.3: Tests unitarios ──────────────────────────────────────────────

describe('normalizeText — tests unitarios', () => {
  it('convierte a minúsculas', () => {
    expect(normalizeText('IBUPROFENO')).toBe('ibuprofeno');
    expect(normalizeText('Paracetamol')).toBe('paracetamol');
  });

  it('elimina tildes (á, é, í, ó, ú)', () => {
    expect(normalizeText('ácido')).toBe('acido');
    expect(normalizeText('éter')).toBe('eter');
    expect(normalizeText('índice')).toBe('indice');
    expect(normalizeText('óxido')).toBe('oxido');
    expect(normalizeText('úlcera')).toBe('ulcera');
  });

  it('elimina tildes en mayúsculas', () => {
    expect(normalizeText('Ácido Acetilsalicílico')).toBe('acido acetilsalicilico');
    expect(normalizeText('IBUPROFÉN')).toBe('ibuprofen');
  });

  it('normaliza la ñ', () => {
    expect(normalizeText('ñoño')).toBe('nono');
    expect(normalizeText('España')).toBe('espana');
  });

  it('maneja cadena vacía', () => {
    expect(normalizeText('')).toBe('');
  });

  it('preserva números', () => {
    expect(normalizeText('Vitamina B12')).toBe('vitamina b12');
    expect(normalizeText('400mg')).toBe('400mg');
  });

  it('preserva caracteres especiales no diacríticos', () => {
    expect(normalizeText('anti-inflamatorio')).toBe('anti-inflamatorio');
    expect(normalizeText('(comprimido)')).toBe('(comprimido)');
  });

  it('es idempotente en casos concretos', () => {
    const cases = ['Ácido', 'IBUPROFENO', 'ñoño', '', 'paracetamol'];
    for (const input of cases) {
      const once = normalizeText(input);
      expect(normalizeText(once)).toBe(once);
    }
  });
});
