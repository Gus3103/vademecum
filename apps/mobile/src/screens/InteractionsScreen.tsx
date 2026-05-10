/**
 * InteractionsScreen — Pantalla de verificación de interacciones medicamentosas.
 *
 * - Usa useInteractionStore para gestionar medicamentos seleccionados e interacciones
 * - SearchBar para buscar y agregar medicamentos a la lista de seleccionados
 * - Lista de medicamentos seleccionados con botones de eliminar
 * - Botón "Verificar interacciones" que llama a interactionService.checkInteractions
 * - Aviso cuando se seleccionan más de 5 medicamentos
 * - InteractionBadge por severidad para cada interacción encontrada
 * - Mensaje "No se encontraron interacciones conocidas" cuando interactions está vacío
 *
 * Requisitos: 4.1, 4.2, 4.3, 4.4
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { SearchBar } from '../components/SearchBar';
import { InteractionBadge } from '../components/InteractionBadge';
import { useInteractionStore } from '../store/interactionStore';
import { checkInteractions } from '../services/interactionService';
import { searchByActiveIngredient } from '../services/searchService';
import type { Medicine, DrugInteraction } from '@drug-medicine-lookup/shared';

interface InteractionsScreenProps {
  navigation: any;
}

const MAX_RECOMMENDED_MEDICINES = 5;

export function InteractionsScreen({ _navigation }: { _navigation?: any }) {
  const {
    selectedMedicines,
    interactionResult,
    isLoading,
    error,
    addMedicine,
    removeMedicine,
    setInteractionResult,
    setLoading,
    setError,
  } = useInteractionStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const exceedsLimit = selectedMedicines.length > MAX_RECOMMENDED_MEDICINES;

  const handleSearchSubmit = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 3) return;

    setIsSearching(true);
    try {
      const result = await searchByActiveIngredient(trimmed);
      setSearchResults(result.medicines);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleAddMedicine = useCallback(
    (medicine: Medicine) => {
      addMedicine(medicine);
      setSearchQuery('');
      setSearchResults([]);
    },
    [addMedicine],
  );

  const handleRemoveMedicine = useCallback(
    (id: string) => {
      removeMedicine(id);
      // Clear results when selection changes
      setInteractionResult(null);
    },
    [removeMedicine, setInteractionResult],
  );

  const handleCheckInteractions = useCallback(async () => {
    if (selectedMedicines.length < 2) {
      setError('Seleccione al menos 2 medicamentos para verificar interacciones.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ids = selectedMedicines.map((m) => m.id);
      const result = await checkInteractions(ids);
      setInteractionResult(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al verificar interacciones.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedMedicines, setLoading, setError, setInteractionResult]);

  const renderInteraction = useCallback(
    ({ item }: { item: DrugInteraction }) => (
      <View style={styles.interactionItem} accessibilityRole="none">
        <View style={styles.interactionHeader}>
          <Text style={styles.interactionIngredients}>
            {item.ingredientA.name} + {item.ingredientB.name}
          </Text>
          <InteractionBadge severity={item.severity} />
        </View>
        <Text style={styles.interactionDescription}>{item.description}</Text>
      </View>
    ),
    [],
  );

  const interactions = interactionResult?.interactions ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buscar medicamento</Text>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmit={handleSearchSubmit}
            type="active"
            placeholder="Buscar por principio activo..."
          />

          {/* Search results dropdown */}
          {isSearching && (
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="small" color="#1A73E8" />
            </View>
          )}

          {searchResults.length > 0 && (
            <View style={styles.searchResultsList}>
              {searchResults.slice(0, 5).map((medicine) => {
                const alreadySelected = selectedMedicines.some((m) => m.id === medicine.id);
                return (
                  <TouchableOpacity
                    key={medicine.id}
                    style={[
                      styles.searchResultItem,
                      alreadySelected && styles.searchResultItemDisabled,
                    ]}
                    onPress={() => !alreadySelected && handleAddMedicine(medicine)}
                    disabled={alreadySelected}
                    accessibilityRole="button"
                    accessibilityLabel={`Agregar ${medicine.commercialName}`}
                    accessibilityState={{ disabled: alreadySelected }}
                  >
                    <Text style={styles.searchResultName}>{medicine.commercialName}</Text>
                    <Text style={styles.searchResultIngredients} numberOfLines={1}>
                      {medicine.activeIngredients.map((ai) => ai.name).join(', ')}
                    </Text>
                    {alreadySelected && (
                      <Text style={styles.alreadyAddedText}>Ya agregado</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Selected medicines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Medicamentos seleccionados ({selectedMedicines.length})
          </Text>

          {selectedMedicines.length === 0 ? (
            <Text style={styles.emptySelectionText}>
              Busque y agregue al menos 2 medicamentos para verificar interacciones.
            </Text>
          ) : (
            <View style={styles.selectedList} accessibilityRole="list">
              {selectedMedicines.map((medicine) => (
                <View
                  key={medicine.id}
                  style={styles.selectedItem}
                  accessibilityRole="none"
                >
                  <View style={styles.selectedItemInfo}>
                    <Text style={styles.selectedItemName}>{medicine.commercialName}</Text>
                    <Text style={styles.selectedItemIngredients} numberOfLines={1}>
                      {medicine.activeIngredients.map((ai) => ai.name).join(', ')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveMedicine(medicine.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar ${medicine.commercialName}`}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Warning: more than 5 medicines */}
        {exceedsLimit && (
          <View
            style={styles.warningBanner}
            accessibilityRole="alert"
            accessibilityLabel="Advertencia: más de 5 medicamentos seleccionados"
          >
            <Text style={styles.warningTitle}>⚠ Análisis puede ser incompleto</Text>
            <Text style={styles.warningText}>
              Ha seleccionado más de {MAX_RECOMMENDED_MEDICINES} medicamentos. El análisis de
              interacciones puede ser incompleto. Se recomienda consultar a un profesional de
              salud.
            </Text>
          </View>
        )}

        {/* Check interactions button */}
        <TouchableOpacity
          style={[
            styles.checkButton,
            (selectedMedicines.length < 2 || isLoading) && styles.checkButtonDisabled,
          ]}
          onPress={handleCheckInteractions}
          disabled={selectedMedicines.length < 2 || isLoading}
          accessibilityRole="button"
          accessibilityLabel="Verificar interacciones"
          accessibilityState={{ disabled: selectedMedicines.length < 2 || isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.checkButtonText}>Verificar interacciones</Text>
          )}
        </TouchableOpacity>

        {/* Error message */}
        {error !== null && !isLoading && (
          <View
            style={styles.errorContainer}
            accessibilityRole="alert"
            accessibilityLabel={error}
          >
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Interaction results */}
        {interactionResult !== null && !isLoading && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resultados</Text>

            {interactions.length === 0 ? (
              <View
                style={styles.noInteractionsContainer}
                accessibilityRole="text"
                accessibilityLabel="No se encontraron interacciones conocidas"
              >
                <Text style={styles.noInteractionsText}>
                  No se encontraron interacciones conocidas entre los medicamentos seleccionados.
                </Text>
              </View>
            ) : (
              <FlatList
                data={interactions}
                keyExtractor={(item, index) =>
                  `${item.ingredientA.id}-${item.ingredientB.id}-${index}`
                }
                renderItem={renderInteraction}
                scrollEnabled={false}
                accessibilityRole="list"
                accessibilityLabel="Lista de interacciones encontradas"
              />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  searchingContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchResultsList: {
    marginTop: 8,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    overflow: 'hidden',
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchResultItemDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  searchResultIngredients: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
    fontStyle: 'italic',
  },
  alreadyAddedText: {
    fontSize: 12,
    color: '#1A73E8',
    marginTop: 2,
    fontWeight: '500',
  },
  emptySelectionText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
  selectedList: {
    gap: 8,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedItemInfo: {
    flex: 1,
    marginRight: 8,
  },
  selectedItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  selectedItemIngredients: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
    fontStyle: 'italic',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 14,
    color: '#C62828',
    fontWeight: '700',
  },
  warningBanner: {
    marginTop: 16,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F57F17',
    marginBottom: 6,
  },
  warningText: {
    fontSize: 14,
    color: '#795548',
    lineHeight: 20,
  },
  checkButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
  },
  checkButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  errorContainer: {
    marginTop: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
  },
  noInteractionsContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    alignItems: 'center',
  },
  noInteractionsText: {
    fontSize: 15,
    color: '#2E7D32',
    textAlign: 'center',
    lineHeight: 22,
  },
  interactionItem: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  interactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  interactionIngredients: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  interactionDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});

export default InteractionsScreen;
