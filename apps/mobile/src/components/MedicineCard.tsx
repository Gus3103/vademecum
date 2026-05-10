/**
 * MedicineCard — tarjeta rediseñada con ícono, condiciones y mejor estética.
 * Requirements: 2.4, 7.4
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Medicine } from '@drug-medicine-lookup/shared';
import { MedicineIcon } from './MedicineIcon';
import { ConditionTags } from './ConditionTags';
import { Colors, Spacing, Radius, Typography, Shadow } from '../theme';

interface MedicineCardProps {
  medicine: Medicine;
  onPress?: () => void;
}

export function MedicineCard({ medicine, onPress }: MedicineCardProps) {
  const ingredientNames = medicine.activeIngredients.map((ai) => ai.name).join(' · ');
  const presentations = medicine.presentations.map((p) => `${p.dose} ${p.units}`).join(' · ');
  const allConditions = medicine.activeIngredients.flatMap((ai) => ai.conditions ?? []);
  // Deduplicate conditions by id
  const uniqueConditions = allConditions.filter(
    (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i,
  );

  const a11yLabel = [medicine.commercialName, ingredientNames, medicine.laboratory]
    .filter(Boolean)
    .join(', ');

  const content = (
    <View style={styles.card}>
      {/* Top row: icon + main info */}
      <View style={styles.topRow}>
        <MedicineIcon pharmaceuticalForm={medicine.pharmaceuticalForm} size={52} />

        <View style={styles.mainInfo}>
          <Text style={styles.commercialName} numberOfLines={1}>
            {medicine.commercialName}
          </Text>
          {ingredientNames.length > 0 && (
            <Text style={styles.ingredients} numberOfLines={2}>
              {ingredientNames}
            </Text>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>🏭 {medicine.laboratory}</Text>
            <View
              style={[
                styles.rxBadge,
                medicine.requiresPrescription ? styles.rxRequired : styles.rxFree,
              ]}
            >
              <Text style={[
                styles.rxText,
                { color: medicine.requiresPrescription ? Colors.warning : Colors.success },
              ]}>
                {medicine.requiresPrescription ? '📋 Con receta' : '✅ Sin receta'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Presentations */}
      {presentations.length > 0 && (
        <View style={styles.presentationsRow}>
          <Text style={styles.presentationsLabel}>Presentaciones: </Text>
          <Text style={styles.presentationsValue} numberOfLines={1}>{presentations}</Text>
        </View>
      )}

      {/* Conditions */}
      {uniqueConditions.length > 0 && (
        <ConditionTags conditions={uniqueConditions} maxVisible={3} />
      )}

      {/* Tap hint */}
      {onPress && (
        <Text style={styles.tapHint}>Ver prospecto →</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint="Toca para ver el prospecto"
        activeOpacity={0.75}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View accessibilityLabel={a11yLabel}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
    marginHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  topRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  mainInfo: {
    flex: 1,
    gap: 3,
  },
  commercialName: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  ingredients: {
    ...Typography.small,
    color: Colors.primary,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 2,
  },
  metaText: {
    ...Typography.tiny,
    color: Colors.textSecondary,
  },
  rxBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  rxRequired: {
    backgroundColor: Colors.warningLight,
  },
  rxFree: {
    backgroundColor: Colors.successLight,
  },
  rxText: {
    fontSize: 11,
    fontWeight: '600',
  },
  presentationsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  presentationsLabel: {
    ...Typography.tiny,
    color: Colors.textMuted,
  },
  presentationsValue: {
    ...Typography.tiny,
    color: Colors.textSecondary,
    flex: 1,
  },
  tapHint: {
    ...Typography.tiny,
    color: Colors.primary,
    textAlign: 'right',
    marginTop: Spacing.xs,
    fontWeight: '600',
  },
});

export default MedicineCard;
