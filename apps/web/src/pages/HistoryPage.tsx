import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchStore } from '../store';
import { searchByActiveIngredient, searchByCommercialName } from '../searchService';
import { Colors } from '../theme';

interface HistoryEntry {
  id: string;
  query: string;
  type: 'active_ingredient' | 'commercial_name';
  timestamp: number;
}

const STORAGE_KEY = 'vademecum_history';

function getHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 20)));
}

export function addHistoryEntry(entry: HistoryEntry) {
  const entries = getHistory().filter(e => e.query !== entry.query || e.type !== entry.type);
  saveHistory([entry, ...entries]);
}

export function HistoryPage() {
  const navigate = useNavigate();
  const { setQuery, setResults, setLoading, setError, setSearchType } = useSearchStore();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => { setEntries(getHistory()); }, []);

  const handleRerun = async (entry: HistoryEntry) => {
    setLoading(true); setError(null);
    setQuery(entry.query);
    setSearchType(entry.type === 'active_ingredient' ? 'active' : 'commercial');
    try {
      const result = entry.type === 'active_ingredient'
        ? await searchByActiveIngredient(entry.query)
        : await searchByCommercialName(entry.query);
      setResults(result);
      navigate('/results');
    } catch { setError('Error al ejecutar la búsqueda.'); }
    finally { setLoading(false); }
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveHistory(updated);
  };

  const handleClearAll = () => {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, fontSize: 20 }}>📋 Historial</h2>
        {entries.length > 0 && (
          <button onClick={handleClearAll} style={{ background: Colors.dangerLight, color: Colors.danger, border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            Borrar todo
          </button>
        )}
      </div>

      {entries.length === 0
        ? <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48 }}>📋</div>
          <p style={{ color: Colors.textMuted, marginTop: 12 }}>No hay consultas recientes.</p>
        </div>
        : entries.map(entry => (
          <div key={entry.id} style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 10, padding: '12px 14px', marginBottom: 8, border: `1px solid ${Colors.border}` }}>
            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleRerun(entry)}>
              <div style={{ fontWeight: 600 }}>{entry.query}</div>
              <div style={{ fontSize: 12, color: Colors.textMuted }}>
                {entry.type === 'active_ingredient' ? '🔬 Principio activo' : '🏷️ Nombre comercial'} · {new Date(entry.timestamp).toLocaleDateString('es-AR')}
              </div>
            </div>
            <button onClick={() => handleRerun(entry)} style={{ background: Colors.primaryLight, color: Colors.primary, border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 12, marginRight: 8 }}>
              Repetir
            </button>
            <button onClick={() => handleDelete(entry.id)} style={{ background: Colors.dangerLight, color: Colors.danger, border: 'none', borderRadius: 999, width: 28, height: 28, cursor: 'pointer', fontWeight: 700 }}>✕</button>
          </div>
        ))
      }
    </div>
  );
}
