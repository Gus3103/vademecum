/**
 * MedicineCard component.
 *
 * Displays a medicine's key information:
 *   - Commercial name (bold)
 *   - Active ingredients (comma-separated)
 *   - Laboratory
 *   - Presentations (dose + units)
 *
 * Accessible: descriptive accessibilityLabel.
 * Wraps in TouchableOpacity when onPress is provided.
 *
 * Requirements: 2.4, 7.4
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { Medicine } from '@drug-medicine-lookup/shared';

interface MedicineCardProps {
  medicine: Medicine;
  onPress?: () => void;
}

export function MedicineCard({ medicine, onPress }: MedicineCardProps) {
  const activeIngredientNames = medicine.activeIngredients
    .map((ai) => ai.name)
    .join(', ');

  const presentationLabels = medicine.presentations
    .map((p) => `${p.dose} ${p.units}`)
    .join(' · ');

  const accessibilityLabel = [
    medicine.commercialName,
    activeIngredientNames,
    medicine.laboratory,
  ]
    .filter(Boolean)
    .join(', ');

  const cardContent = (
    <View style={styles.card}>
      {/* Commercial name */}
      <Text style={styles.commercialName} numberOfLines={2}>
        {medicine.commercialName}
      </Text>

      {/* Active ingredients */}
      {activeIngredientNames.length > 0 && (
        <Text style={styles.activeIngredients} numberOfLines={2}>
          {activeIngredientNames}
        </Text>
      )}

      {/* Laboratory */}
      <Text style={styles.laboratory} numberOfLines={1}>
        {medicine.laboratory}
      </Text>

      {/* Presentations */}
      {presentationLabels.length > 0 && (
        <Text style={styles.presentations} numberOfLines={2}>
          {presentationLabels}
        </Text>
      )}

      {/* Prescription badge */}
      <View style={styles.badgeRow}>
        <View
          style={[
            styles.prescriptionBadge,
            medicine.requiresPrescription
              ? styles.prescriptionRequired
              : styles.prescriptionFree,
          ]}
        >
          <Text style={styles.prescriptionText}>
            {medicine.requiresPrescription ? 'Con receta' : 'Sin receta'}
          </Text>
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Toca para ver el detalle del medicamento"
        activeOpacity={0.7}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return (
    <View
      accessibilityRole="none"
      accessibilityLabel={accessibilityLabel}
    >
      {cardContent}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  commercialName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  activeIngredients: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  laboratory: {
    fontSize: 13,
    color: '#777',
    marginBottom: 4,
  },
  presentations: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  prescriptionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  prescriptionRequired: {
    backgroundColor: '#FFF3CD',
  },
  prescriptionFree: {
    backgroundColor: '#D4EDDA',
  },
  prescriptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
});

export default MedicineCard;
