/**
 * ConditionTags — muestra las dolencias/indicaciones de un principio activo
 * como chips de colores por categoría.
 *
 * Requirements: nueva feature de condiciones
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Condition, ConditionCategory } from '@drug-medicine-lookup/shared';

interface ConditionTagsProps {
  conditions: Condition[];
  maxVisible?: number;
}

const CATEGORY_COLORS: Record<ConditionCategory, { bg: string; text: string }> = {
  dolor:             { bg: '#FFF3CD', text: '#856404' },
  infeccion:         { bg: '#F8D7DA', text: '#721C24' },
  cardiovascular:    { bg: '#F8D7DA', text: '#721C24' },
  digestivo:         { bg: '#D1ECF1', text: '#0C5460' },
  respiratorio:      { bg: '#CCE5FF', text: '#004085' },
  neurologico:       { bg: '#E2D9F3', text: '#4A235A' },
  endocrino:         { bg: '#D4EDDA', text: '#155724' },
  musculoesqueletico:{ bg: '#FFF3CD', text: '#856404' },
  dermatologico:     { bg: '#FDEBD0', text: '#784212' },
  otro:              { bg: '#E2E3E5', text: '#383D41' },
};

export function ConditionTags({ conditions, maxVisible = 4 }: ConditionTagsProps) {
  if (conditions.length === 0) return null;

  const visible = conditions.slice(0, maxVisible);
  const remaining = conditions.length - maxVisible;

  return (
    <View style={styles.container} accessibilityRole="none">
      <Text style={styles.label}>Indicado para:</Text>
      <View style={styles.tagsRow}>
        {visible.map((c) => {
          const colors = CATEGORY_COLORS[c.category] ?? CATEGORY_COLORS.otro;
          return (
            <View
              key={c.id}
              style={[styles.tag, { backgroundColor: colors.bg }]}
              accessibilityLabel={c.name}
            >
              <Text style={[styles.tagText, { color: colors.text }]} numberOfLines={1}>
                {c.name}
              </Text>
            </View>
          );
        })}
        {remaining > 0 && (
          <View style={[styles.tag, { backgroundColor: '#E2E3E5' }]}>
            <Text style={[styles.tagText, { color: '#383D41' }]}>
              +{remaining} más
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ConditionTags;
