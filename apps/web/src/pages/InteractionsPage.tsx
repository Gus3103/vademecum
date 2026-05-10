import React, { useState } from 'react';
import { useInteractionStore, useSearchStore } from '../store';
import { searchByActiveIngredient } from '../searchService';
import { supabaseQuery } from '../supabaseClient';
import { Colors } from '../theme';
import type { Medicine, DrugInteraction } from '../types';

const SEVERITY_COLORS = {
  leve: { bg: Colors.sevLeveBg, color: Colors.sevLeve },
  moderada: { bg: Colors.sevModeradaBg, color: Colors.sevModerada },
  grave: { bg: Colors.sevGraveBg, color: Colors.sevGrave },
};

async function checkInteractions(medicineIds: string[]) {
  const { data: links } = await supabaseQuery<{ active_ingredient_id: string }>('medicine_ingredients', {
    select: 'active_ingredient_id', filters: [`medicine_id=in.(${medicineIds.join(',')})`],
  });
  const ingIds = [...new Set(links.map(l => l.active_ingredient_id))];
  if (!ingIds.length) return { interactions: [], hasInteractions: false, exceedsRecommendedLimit: medicineIds.length > 5 };

  const idList = ingIds.join(',');
  const { data: rows } = await supabaseQuery<{ ingredient_a_id: string; ingredient_b_id: string; severity: string; description: string }>('drug_interactions', {
    select: 'ingredient_a_id,ingredient_b_id,severity,description',
    filters: [`or=(ingredient_a_id.in.(${idList}),ingredient_b_id.in.(${idList}))`],
  });

  if (!rows.length) return { interactions: [], hasInteractions: false, exceedsRecommendedLimit: medicineIds.length > 5 };

  const allIds = [...new Set(rows.flatMap(r => [r.ingredient_a_id, r.ingredient_b_id]))];
  const { data: ings } = await supabaseQuery<{ id: string; name: string }>('active_ingredients', {
    select: 'id,name', filters: [`id=in.(${allIds.join(',')})`],
  });
  const byId = new Map(ings.map(ai => [ai.id, ai]));

  const interactions: DrugInteraction[] = [];
  for (const row of rows) {
    const aiA = byId.get(row.ingredient_a_id);
    const aiB = byId.get(row.ingredient_b_id);
    if (!aiA || !aiB) continue;
    const ingA = { id: aiA.id, name: aiA.name, synonyms: [] };
    const ingB = { id: aiB.id, name: aiB.name, synonyms: [] };
    interactions.push({ ingredientA: ingA, ingredientB: ingB, severity: row.severity as 'leve' | 'moderada' | 'grave', description: row.description });
    interactions.push({ ingredientA: ingB, ingredientB: ingA, severity: row.severity as 'leve' | 'moderada' | 'grave', description: row.description });
  }

  return { interactions, hasInteractions: interactions.length > 0, exceedsRecommendedLimit: medicineIds.length > 5 };
}

export function InteractionsPage() {
  const { selectedMedicines, result, isLoading, error, addMedicine, removeMedicine, setResult, setLoading, setError } = useInteractionStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (searchQuery.trim().length < 3) return;
    setSearching(true);
    try {
      const r = await searchByActiveIngredient(searchQuery.trim());
      setSearchResults(r.medicines.slice(0, 5));
    } finally { setSearching(false); }
  };

  const handleCheck = async () => {
    if (selectedMedicines.length < 2) { setError('Seleccioná al menos 2 medicamentos.'); return; }
    setLoading(true); setError(null);
    try {
      const r = await checkInteractions(selectedMedicines.map(m => m.id));
      setResult(r);
    } catch { setError('Error al verificar interacciones.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 20 }}>⚡ Verificar Interacciones</h2>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>Buscar medicamento</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por principio activo..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: `1px solid ${Colors.border}`, fontSize: 14 }} />
          <button onClick={handleSearch} disabled={searching}
            style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: Colors.primary, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {searching ? '...' : 'Buscar'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div style={{ background: '#fff', border: `1px solid ${Colors.border}`, borderRadius: 8, marginTop: 8 }}>
            {searchResults.map(m => {
              const added = selectedMedicines.some(x => x.id === m.id);
              return (
                <div key={m.id} onClick={() => { if (!added) { addMedicine(m); setSearchResults([]); setSearchQuery(''); } }}
                  style={{ padding: '10px 14px', borderBottom: `1px solid ${Colors.border}`, cursor: added ? 'default' : 'pointer', opacity: added ? 0.5 : 1 }}>
                  <div style={{ fontWeight: 600 }}>{m.commercialName}</div>
                  <div style={{ fontSize: 12, color: Colors.textMuted }}>{m.activeIngredients.map(ai => ai.name).join(', ')}</div>
                  {added && <div style={{ fontSize: 11, color: Colors.primary }}>Ya agregado</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>Seleccionados ({selectedMedicines.length})</p>
        {selectedMedicines.length === 0
          ? <p style={{ color: Colors.textMuted, fontStyle: 'italic' }}>Agregá al menos 2 medicamentos.</p>
          : selectedMedicines.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 8, padding: '10px 14px', marginBottom: 8, border: `1px solid ${Colors.border}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{m.commercialName}</div>
                <div style={{ fontSize: 12, color: Colors.textMuted }}>{m.activeIngredients.map(ai => ai.name).join(', ')}</div>
              </div>
              <button onClick={() => removeMedicine(m.id)} style={{ background: Colors.dangerLight, color: Colors.danger, border: 'none', borderRadius: 999, width: 28, height: 28, cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>
          ))
        }
      </div>

      {selectedMedicines.length > 5 && (
        <div style={{ background: Colors.warningLight, color: Colors.warning, padding: 12, borderRadius: 8, marginBottom: 16 }}>
          ⚠️ Más de 5 medicamentos — el análisis puede ser incompleto. Consultá a un profesional.
        </div>
      )}

      <button onClick={handleCheck} disabled={selectedMedicines.length < 2 || isLoading}
        style={{ width: '100%', padding: 14, borderRadius: 8, border: 'none', background: selectedMedicines.length < 2 ? '#ccc' : Colors.primary, color: '#fff', fontWeight: 700, fontSize: 15, cursor: selectedMedicines.length < 2 ? 'default' : 'pointer', marginBottom: 20 }}>
        {isLoading ? 'Verificando...' : 'Verificar interacciones'}
      </button>

      {error && <div style={{ background: Colors.dangerLight, color: Colors.danger, padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {result && (
        <div>
          {result.interactions.length === 0
            ? <div style={{ background: Colors.successLight, color: Colors.success, padding: 16, borderRadius: 8, textAlign: 'center' }}>✅ No se encontraron interacciones conocidas.</div>
            : result.interactions.map((inter, i) => {
              const sev = SEVERITY_COLORS[inter.severity] ?? SEVERITY_COLORS.leve;
              return (
                <div key={i} style={{ background: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, border: `1px solid ${Colors.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{inter.ingredientA.name} + {inter.ingredientB.name}</span>
                    <span style={{ padding: '3px 10px', borderRadius: 999, background: sev.bg, color: sev.color, fontSize: 12, fontWeight: 700 }}>{inter.severity.toUpperCase()}</span>
                  </div>
                  <p style={{ fontSize: 13, color: Colors.textSecondary, lineHeight: 1.5 }}>{inter.description}</p>
                </div>
              );
            })
          }
        </div>
      )}
    </div>
  );
}
