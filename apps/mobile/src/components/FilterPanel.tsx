/**
 * FilterPanel component.
 *
 * Provides controls for filtering and sorting medicine search results:
 *   - TextInput for laboratory filter
 *   - Toggle buttons for pharmaceutical form
 *   - Toggle buttons for prescription condition (con receta / sin receta / todos)
 *   - Toggle buttons for sort order (A→Z / Z→A)
 *   - "Limpiar filtros" button that calls clearFilters() from filterStore
 *
 * Requirements: 5.1, 5.2, 5.4
 */

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useFilterStore } from '../store/filterStore';
import type { FilterState } from '@drug-medicine-lookup/shared';

interface FilterPanelProps {
  onFiltersChange?: (filters: FilterState) => void;
}

const PHARMACEUTICAL_FORMS = [
  'comprimido',
  'jarabe',
  'inyectable',
  'crema',
  'gotas',
  'otro',
] as const;

type PharmaceuticalForm = (typeof PHARMACEUTICAL_FORMS)[number];

export function FilterPanel({ onFiltersChange }: FilterPanelProps) {
  const { activeFilters, setFilter, clearFilters } = useFilterStore();

  // Notify parent whenever filters change
  useEffect(() => {
    onFiltersChange?.(activeFilters);
  }, [activeFilters, onFiltersChange]);

  const handleLaboratoryChange = useCallback(
    (text: string) => {
      setFilter('laboratory', text.length > 0 ? text : undefined);
    },
    [setFilter],
  );

  const handleFormToggle = useCallback(
    (form: PharmaceuticalForm) => {
      const current = activeFilters.pharmaceuticalForm;
      setFilter('pharmaceuticalForm', current === form ? undefined : form);
    },
    [activeFilters.pharmaceuticalForm, setFilter],
  );

  const handlePrescriptionToggle = useCallback(
    (value: boolean | undefined) => {
      const current = activeFilters.requiresPrescription;
      setFilter('requiresPrescription', current === value ? undefined : value);
    },
    [activeFilters.requiresPrescription, setFilter],
  );

  const handleSortToggle = useCallback(
    (order: 'name_asc' | 'name_desc') => {
      const current = activeFilters.sortOrder;
      setFilter('sortOrder', current === order ? undefined : order);
    },
    [activeFilters.sortOrder, setFilter],
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      accessibilityRole="none"
      accessibilityLabel="Panel de filtros"
    >
      {/* Laboratory filter */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Laboratorio</Text>
        <TextInput
          style={styles.textInput}
          value={activeFilters.laboratory ?? ''}
          onChangeText={handleLaboratoryChange}
          placeholder="Filtrar por laboratorio..."
          placeholderTextColor="#888"
          autoCorrect={false}
          autoCapitalize="words"
          accessibilityLabel="Filtrar por laboratorio"
          accessibilityHint="Ingrese el nombre del laboratorio para filtrar resultados"
          returnKeyType="done"
        />
      </View>

      {/* Pharmaceutical form filter */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Forma farmacéutica</Text>
        <View style={styles.toggleGroup}>
          {PHARMACEUTICAL_FORMS.map((form) => {
            const isSelected = activeFilters.pharmaceuticalForm === form;
            return (
              <TouchableOpacity
                key={form}
                style={[styles.toggleButton, isSelected && styles.toggleButtonSelected]}
                onPress={() => handleFormToggle(form)}
                accessibilityRole="button"
                accessibilityLabel={`Forma farmacéutica: ${form}`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    isSelected && styles.toggleButtonTextSelected,
                  ]}
                >
                  {form.charAt(0).toUpperCase() + form.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Prescription condition filter */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Condición de venta</Text>
        <View style={styles.toggleGroup}>
          {/* "Todos" option — clears the prescription filter */}
          <TouchableOpacity
            style={[
              styles.toggleButton,
              activeFilters.requiresPrescription === undefined &&
                styles.toggleButtonSelected,
            ]}
            onPress={() => handlePrescriptionToggle(undefined)}
            accessibilityRole="button"
            accessibilityLabel="Condición de venta: todos"
            accessibilityState={{
              selected: activeFilters.requiresPrescription === undefined,
            }}
          >
            <Text
              style={[
                styles.toggleButtonText,
                activeFilters.requiresPrescription === undefined &&
                  styles.toggleButtonTextSelected,
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              activeFilters.requiresPrescription === true &&
                styles.toggleButtonSelected,
            ]}
            onPress={() => handlePrescriptionToggle(true)}
            accessibilityRole="button"
            accessibilityLabel="Condición de venta: con receta"
            accessibilityState={{
              selected: activeFilters.requiresPrescription === true,
            }}
          >
            <Text
              style={[
                styles.toggleButtonText,
                activeFilters.requiresPrescription === true &&
                  styles.toggleButtonTextSelected,
              ]}
            >
              Con receta
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              activeFilters.requiresPrescription === false &&
                styles.toggleButtonSelected,
            ]}
            onPress={() => handlePrescriptionToggle(false)}
            accessibilityRole="button"
            accessibilityLabel="Condición de venta: sin receta"
            accessibilityState={{
              selected: activeFilters.requiresPrescription === false,
            }}
          >
            <Text
              style={[
                styles.toggleButtonText,
                activeFilters.requiresPrescription === false &&
                  styles.toggleButtonTextSelected,
              ]}
            >
              Sin receta
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort order */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ordenar por nombre</Text>
        <View style={styles.toggleGroup}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              activeFilters.sortOrder === 'name_asc' && styles.toggleButtonSelected,
            ]}
            onPress={() => handleSortToggle('name_asc')}
            accessibilityRole="button"
            accessibilityLabel="Ordenar de A a Z"
            accessibilityState={{ selected: activeFilters.sortOrder === 'name_asc' }}
          >
            <Text
              style={[
                styles.toggleButtonText,
                activeFilters.sortOrder === 'name_asc' &&
                  styles.toggleButtonTextSelected,
              ]}
            >
              A → Z
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              activeFilters.sortOrder === 'name_desc' && styles.toggleButtonSelected,
            ]}
            onPress={() => handleSortToggle('name_desc')}
            accessibilityRole="button"
            accessibilityLabel="Ordenar de Z a A"
            accessibilityState={{ selected: activeFilters.sortOrder === 'name_desc' }}
          >
            <Text
              style={[
                styles.toggleButtonText,
                activeFilters.sortOrder === 'name_desc' &&
                  styles.toggleButtonTextSelected,
              ]}
            >
              Z → A
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Clear filters button */}
      <TouchableOpacity
        style={styles.clearButton}
        onPress={handleClearFilters}
        accessibilityRole="button"
        accessibilityLabel="Limpiar filtros"
        accessibilityHint="Elimina todos los filtros activos y restaura los resultados originales"
      >
        <Text style={styles.clearButtonText}>Limpiar filtros</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: '#FFF',
    color: '#333',
  },
  toggleGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CCC',
    backgroundColor: '#FFF',
  },
  toggleButtonSelected: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  toggleButtonTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  clearButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D32F2F',
  },
});

export default FilterPanel;
