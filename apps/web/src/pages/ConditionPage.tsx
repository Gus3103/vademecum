import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabaseQuery } from '../supabaseClient';
import { useSearchStore } from '../store';
import { searchByActiveIngredient } from '../searchService';
import { Colors } from '../theme';
import type { ActiveIngredient } from '../types';

export function ConditionPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const conditionName = decodeURIComponent(searchParams.get('name') ?? '');
  const navigate = useNavigate();
  const { setQuery, setResults, setLoading, setError, setSearchType } = useSearchStore();
  const [ingredients, setIngredients] = useState<ActiveIngredient[]>([]);
  const [loading, setLocalLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabaseQuery<{ active_ingredient_id: string }>('ingredient_conditions', {
      select: 'active_ingredient_id', filters: [`condition_id=eq.${id}`],
    }).then(async ({ data: links }) => {
      const ids = links.map(l => l.active_ingredient_id);
      if (!ids.length) { setLocalLoading(false); return; }
      const { data } = await supabaseQuery<{ id: string; name: string; synonyms: string[] | null }>('active_ingredients', {
        select: 'id,name,synonyms', filters: [`id=in.(${ids.join(',')})`], order: 'name.asc',
      });
      setIngredients(data.map(ai => ({ id: ai.id, name: ai.name, synonyms: ai.synonyms ?? [] })));
    }).finally(() => setLocalLoading(false));
  }, [id]);

  const handleIngredientPress = async (ingredient: ActiveIngredient) => {
    setLoading(true); setError(null);
    setQuery(ingredient.name);
    setSearchType('active');
    try {
      const result = await searchByActiveIngredient(ingredient.name);
      setResults(result);
      navigate('/results');
    } catch { setError('Error al buscar.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: Colors.primary }}>←</button>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 20 }}>🩺 {conditionName}</h2>
          <p style={{ fontSize: 13, color: Colors.textMuted }}>Principios activos indicados</p>
        </div>
      </div>

      {loading && <p style={{ color: Colors.textMuted }}>Cargando...</p>}

      {!loading && ingredients.length === 0 && (
        <p style={{ color: Colors.textMuted, textAlign: 'center', padding: 32 }}>No hay principios activos registrados para esta dolencia.</p>
      )}

      {ingredients.map(ai => (
        <div key={ai.id} onClick={() => handleIngredientPress(ai)}
          style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 10, padding: '14px 16px', marginBottom: 10, border: `1px solid ${Colors.border}`, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)')}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: Colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginRight: 14, flexShrink: 0 }}>🔬</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{ai.name}</div>
            {ai.synonyms.length > 0 && <div style={{ fontSize: 12, color: Colors.textMuted }}>También: {ai.synonyms.join(', ')}</div>}
          </div>
          <div style={{ color: Colors.primary, fontWeight: 700, fontSize: 18 }}>›</div>
        </div>
      ))}
    </div>
  );
}
