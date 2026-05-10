import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseQuery } from '../supabaseClient';
import { Colors } from '../theme';
import type { Prospect } from '../types';

const SECTIONS = [
  { key: 'indications', label: '✅ Indicaciones terapéuticas' },
  { key: 'dosage', label: '💉 Posología y administración' },
  { key: 'contraindications', label: '🚫 Contraindicaciones' },
  { key: 'warnings', label: '⚠️ Advertencias y precauciones' },
  { key: 'interactionsText', label: '⚡ Interacciones medicamentosas' },
  { key: 'adverseEffects', label: '😟 Efectos adversos' },
  { key: 'overdose', label: '🆘 Sobredosis' },
  { key: 'storage', label: '📦 Condiciones de almacenamiento' },
] as const;

export function ProspectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('indications');

  useEffect(() => {
    if (!id) return;
    supabaseQuery<Record<string, string>>('prospects', {
      select: 'medicine_id,indications,dosage,contraindications,warnings,interactions_text,adverse_effects,overdose,storage',
      filters: [`medicine_id=eq.${id}`],
    }).then(({ data }) => {
      if (!data.length) { setError('Prospecto no disponible. Consulte a su profesional de salud.'); return; }
      const d = data[0]!;
      setProspect({
        medicineId: d['medicine_id'] ?? '',
        indications: d['indications'] ?? '',
        dosage: d['dosage'] ?? '',
        contraindications: d['contraindications'] ?? '',
        warnings: d['warnings'] ?? '',
        interactionsText: d['interactions_text'] ?? '',
        adverseEffects: d['adverse_effects'] ?? '',
        overdose: d['overdose'] ?? '',
        storage: d['storage'] ?? '',
      });
    }).catch(() => setError('Error al cargar el prospecto.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: Colors.primary }}>←</button>
        <h2 style={{ fontWeight: 700, fontSize: 20 }}>Prospecto</h2>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 32 }}>Cargando prospecto...</div>}
      {error && (
        <div style={{ background: Colors.dangerLight, color: Colors.danger, padding: 16, borderRadius: 8 }}>
          <strong>⚠️ {error}</strong>
        </div>
      )}

      {prospect && (
        <div>
          {/* Index */}
          <div style={{ background: Colors.primaryLight, borderRadius: 10, padding: 12, marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: Colors.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>Índice</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SECTIONS.map(s => (
                <button key={s.key} onClick={() => { setActiveSection(s.key); document.getElementById(s.key)?.scrollIntoView({ behavior: 'smooth' }); }}
                  style={{ padding: '4px 10px', borderRadius: 999, border: `1px solid ${activeSection === s.key ? Colors.primary : Colors.border}`, background: activeSection === s.key ? Colors.primary : '#fff', color: activeSection === s.key ? '#fff' : Colors.textSecondary, fontSize: 12, cursor: 'pointer' }}>
                  {s.label.split(' ').slice(1).join(' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Sections */}
          {SECTIONS.map(s => {
            const content = prospect[s.key as keyof Prospect];
            if (!content) return null;
            return (
              <div key={s.key} id={s.key} style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, border: `1px solid ${Colors.border}` }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: Colors.primary, marginBottom: 8 }}>{s.label}</h3>
                <p style={{ fontSize: 14, color: Colors.textPrimary, lineHeight: 1.6 }}>{content}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
