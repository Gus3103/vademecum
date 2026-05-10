/**
 * InteractionBadge component.
 *
 * Displays a drug interaction severity level with WCAG 2.1 AA compliant colors:
 *   - leve:     background #FFF3CD, text #856404  (dark yellow on light yellow)
 *   - moderada: background #FFE0B2, text #E65100  (dark orange on light orange)
 *   - grave:    background #FFCDD2, text #B71C1C  (dark red on light red)
 *
 * Requirements: 4.2, 7.4
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Severity = 'leve' | 'moderada' | 'grave';

interface InteractionBadgeProps {
  severity: Severity;
  label?: string;
}

const SEVERITY_STYLES: Record<
  Severity,
  { backgroundColor: string; color: string; borderColor: string }
> = {
  leve: {
    backgroundColor: '#FFF3CD',
    color: '#856404',
    borderColor: '#FFEAA7',
  },
  moderada: {
    backgroundColor: '#FFE0B2',
    color: '#E65100',
    borderColor: '#FFCC80',
  },
  grave: {
    backgroundColor: '#FFCDD2',
    color: '#B71C1C',
    borderColor: '#EF9A9A',
  },
};

const SEVERITY_LABELS: Record<Severity, string> = {
  leve: 'Leve',
  moderada: 'Moderada',
  grave: 'Grave',
};

export function InteractionBadge({ severity, label }: InteractionBadgeProps) {
  const colorStyle = SEVERITY_STYLES[severity];
  const displayLabel = label ?? SEVERITY_LABELS[severity];
  const accessibilityLabel = `Interacción de severidad ${SEVERITY_LABELS[severity]}`;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colorStyle.backgroundColor,
          borderColor: colorStyle.borderColor,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
    >
      <Text
        style={[styles.label, { color: colorStyle.color }]}
        numberOfLines={1}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default InteractionBadge;
