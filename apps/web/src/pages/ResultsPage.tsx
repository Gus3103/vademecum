import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchStore } from '../store';
import { searchByActiveIngredient, searchByCommercialName } from '../searchService';
import { Colors } from '../theme';
import type { Medicine } from '../types';

function getFormEmoji(form: string): string {
  const f = form.toLowerCase();
  if (f.includes('comprimido') || f.includes('tableta')) return '💊';
  if (f.includes('cápsula') || f.includes('capsula')) return '💊';
  if (f.includes('jarabe') || f.includes('solución')) return '🧴';
  if (f.includes('inyectable') || f.includes('ampolla')) return '💉';
  if (f.includes('crema') || f.includes('gel')) return '🧴';
  if (f.includes('gotas')) return '💧';
  return '💊';
}

function MedicineCard({ medicine, onPress }: { medicine: Medicine; onPress: () => void }) {
  const ingredients = medicine.activeIngredients.map(ai => ai.name).join(' · ');
  const presentations = medicine.presentations.map(p => `${p.dose} ${p.units}`).join(' · ');

  return (
    <div onClick={onPress} style={{
      background: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
      border: `1px solid ${Colors.border}`, cursor: 'pointer',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)')}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 36, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: Colors.primaryLight, borderRadius: 10, flexShrink: 0 }}>
          {getFormEmoji(medicine.pharmaceuticalForm)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: Colors.textPrimary }}>{medicine.commercialName}</div>
          {ingredients && <div style={{ fontSize: 13, color: Colors.primary, fontStyle: 'italic', marginTop: 2 }}>{ingredients}</div>}
          <div style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 4 }}>🏭 {medicine.laboratory}</div>
          {presentations && <div style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>{presentations}</div>}
          <div style={{ marginTop: 6 }}>
            <span style={{
              padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
              background: medicine.requiresPrescription ? Colors.warningLight : Colors.successLight,
              color: medicine.requiresPrescription ? Colors.warning : Colors.success,
            }}>
              {medicine.requiresPrescription ? '📋 Con receta' : '✅ Sin receta'}
            </span>
          </div>
        </div>
        <div style={{ color: Colors.primary, fontWeight: 700, fontSize: 18 }}>›</div>
      </div>
    </div>
  );
}

export function ResultsPage() {
  const navigate = useNavigate();
  const { query, searchType, results, isLoading, error, filters, setResults, setLoading, setError } = useSearchStore();
  const [loadingMore, setLoadingMore] = useState(false);

  const medicines: Medicine[] = results?.medicines ?? [];
  const hasMore = results !== null && (results.page ?? 1) < results.totalPages;

  const handleLoadMore = async () => {
    if (!results || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = (results.page ?? 1) + 1;
      const more = searchType === 'active'
        ? await searchByActiveIngredient(query, filters, nextPage)
        : await searchByCommercialName(query, filters, nextPage);
      setResults({ ...more, medicines: [...medicines, ...more.medicines] });
    } catch {
      setError('Error al cargar más resultados.');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: Colors.primary }}>←</button>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>"{query}"</div>
          {results && <div style={{ fontSize: 13, color: Colors.textMuted }}>{results.total} resultado{results.total !== 1 ? 's' : ''}</div>}
        </div>
      </div>

      {isLoading && <div style={{ textAlign: 'center', padding: 32, color: Colors.textSecondary }}>Buscando...</div>}
      {error && <div style={{ background: Colors.dangerLight, color: Colors.danger, padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {!isLoading && medicines.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48 }}>🔍</div>
          <h3 style={{ marginTop: 12, color: Colors.textSecondary }}>No se encontraron medicamentos</h3>
          <p style={{ color: Colors.textMuted, marginTop: 8 }}>Intentá con otro término o ajustá los filtros.</p>
        </div>
      )}

      {medicines.map(m => (
        <MedicineCard key={m.id} medicine={m} onPress={() => navigate(`/prospect/${m.id}`)} />
      ))}

      {hasMore && (
        <button onClick={handleLoadMore} disabled={loadingMore}
          style={{ width: '100%', padding: 14, borderRadius: 8, border: 'none', background: Colors.primary, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8 }}>
          {loadingMore ? 'Cargando...' : 'Cargar más'}
        </button>
      )}
    </div>
  );
}
