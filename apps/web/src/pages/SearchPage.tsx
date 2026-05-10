import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchStore } from '../store';
import { searchByActiveIngredient, searchByCommercialName, getSuggestions } from '../searchService';
import { supabaseQuery } from '../supabaseClient';
import { normalizeText } from '@drug-medicine-lookup/shared';
import { Colors } from '../theme';
import type { Condition } from '../types';

type SearchType = 'active' | 'commercial' | 'condition';

const CATEGORY_LABELS: Record<string, string> = {
  dolor: '😣 Dolor', infeccion: '🦠 Infección', cardiovascular: '❤️ Cardiovascular',
  digestivo: '🫃 Digestivo', respiratorio: '🫁 Respiratorio', neurologico: '🧠 Neurológico',
  endocrino: '⚗️ Endocrino', musculoesqueletico: '🦴 Músculo-esquelético',
  dermatologico: '🩹 Dermatológico', otro: '💊 Otros',
};

export function SearchPage() {
  const navigate = useNavigate();
  const { setQuery, setResults, setLoading, setError, setSearchType } = useSearchStore();
  const [localQuery, setLocalQuery] = useState('');
  const [searchType, setLocalSearchType] = useState<SearchType>('active');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [conditionsLoading, setConditionsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (searchType !== 'condition') return;
    setConditionsLoading(true);
    supabaseQuery<Condition>('conditions', { select: 'id,name,category', order: 'category.asc,name.asc' })
      .then(({ data }) => setConditions(data))
      .finally(() => setConditionsLoading(false));
  }, [searchType]);

  useEffect(() => {
    if (localQuery.length < 3 || searchType === 'condition') { setSuggestions([]); return; }
    const timer = setTimeout(() => {
      getSuggestions(localQuery, searchType as 'active' | 'commercial').then(setSuggestions);
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, searchType]);

  const handleSearch = async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 3) { setLocalError('Ingrese al menos 3 caracteres.'); return; }
    setLocalError(null);
    setSuggestions([]);

    if (searchType === 'condition') {
      const { data } = await supabaseQuery<{ id: string; name: string }>('conditions', {
        select: 'id,name', filters: [`name_normalized=ilike.*${normalizeText(trimmed)}*`], limit: 1,
      });
      if (!data.length) { setLocalError('No se encontraron dolencias.'); return; }
      navigate(`/condition/${data[0]!.id}?name=${encodeURIComponent(data[0]!.name)}`);
      return;
    }

    setIsSearching(true);
    setLoading(true);
    setError(null);
    setQuery(trimmed);
    setSearchType(searchType as 'active' | 'commercial');

    try {
      const result = searchType === 'active'
        ? await searchByActiveIngredient(trimmed)
        : await searchByCommercialName(trimmed);
      setResults(result);
      navigate('/results');
    } catch (e) {
      setError('Error al buscar. Intente nuevamente.');
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  };

  const conditionsByCategory = conditions.reduce<Record<string, Condition[]>>((acc, c) => {
    (acc[c.category] = acc[c.category] ?? []).push(c);
    return acc;
  }, {});

  const QUICK_SEARCHES = ['Ibuprofeno', 'Paracetamol', 'Amoxicilina', 'Omeprazol', 'Atorvastatina'];

  return (
    <div>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
        <div style={{ fontSize: 56 }}>💊</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: Colors.primary, margin: '8px 0 4px' }}>Vademécum</h1>
        <p style={{ color: Colors.textSecondary }}>Consulta de medicamentos</p>
      </div>

      {/* Search type tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'active', label: '🔬 Principio activo' },
          { key: 'commercial', label: '🏷️ Nombre comercial' },
          { key: 'condition', label: '🩺 Dolencia' },
        ].map(t => (
          <button key={t.key} onClick={() => { setLocalSearchType(t.key as SearchType); setLocalQuery(''); setSuggestions([]); }}
            style={{ flex: 1, padding: '10px 4px', borderRadius: 10, border: `2px solid ${searchType === t.key ? Colors.primary : Colors.border}`, background: searchType === t.key ? Colors.primaryLight : '#fff', color: searchType === t.key ? Colors.primary : Colors.textSecondary, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <input
          value={localQuery}
          onChange={e => setLocalQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch(localQuery)}
          placeholder={searchType === 'active' ? 'Ej: ibuprofeno...' : searchType === 'commercial' ? 'Ej: Advil...' : 'Ej: dolor, fiebre...'}
          style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${Colors.border}`, fontSize: 16, outline: 'none' }}
        />
        <button onClick={() => handleSearch(localQuery)} disabled={isSearching}
          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: '8px 16px', borderRadius: 8, border: 'none', background: Colors.primary, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
          {isSearching ? '...' : 'Buscar'}
        </button>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: `1px solid ${Colors.border}`, borderRadius: 8, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            {suggestions.map(s => (
              <div key={s} onClick={() => { setLocalQuery(s); handleSearch(s); }}
                style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: `1px solid ${Colors.border}` }}
                onMouseEnter={e => (e.currentTarget.style.background = Colors.primaryLight)}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div style={{ background: Colors.dangerLight, color: Colors.danger, padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {/* Condition browser */}
      {searchType === 'condition' && (
        <div>
          <h3 style={{ marginBottom: 12, color: Colors.textPrimary }}>Explorar por dolencia</h3>
          {conditionsLoading ? <p>Cargando...</p> : Object.entries(conditionsByCategory).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{CATEGORY_LABELS[cat] ?? cat}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {items.map(c => (
                  <button key={c.id} onClick={() => navigate(`/condition/${c.id}?name=${encodeURIComponent(c.name)}`)}
                    style={{ padding: '6px 14px', borderRadius: 999, border: `1px solid ${Colors.border}`, background: '#fff', cursor: 'pointer', fontSize: 13 }}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick searches */}
      {searchType !== 'condition' && (
        <div>
          <h3 style={{ marginBottom: 12, color: Colors.textPrimary }}>Búsquedas frecuentes</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {QUICK_SEARCHES.map(term => (
              <button key={term} onClick={() => { setLocalQuery(term); handleSearch(term); }}
                style={{ padding: '6px 14px', borderRadius: 999, background: Colors.primaryLight, color: Colors.primary, border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
