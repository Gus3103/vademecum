/**
 * ResultsScreen — Pantalla de resultados de búsqueda.
 *
 * - Renderiza lista de MedicineCard con FlatList
 * - Integra FilterPanel y filterStore
 * - Paginación: botón "Cargar más" al final de la lista
 * - Mensaje "No se encontraron medicamentos" cuando results.medicines está vacío
 * - Cada MedicineCard navega a ProspectScreen con el id del medicamento
 *
 * Requisitos: 1.3, 1.6, 2.3, 5.1, 5.2, 5.3, 5.4
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
} from 'react-native';
import { MedicineCard } from '../components/MedicineCard';
import { FilterPanel } from '../components/FilterPanel';
import { useSearchStore } from '../store/searchStore';
import { useFilterStore } from '../store/filterStore';
import { searchByActiveIngredient, searchByCommercialName } from '../services/searchService';
import type { Medicine } from '@drug-medicine-lookup/shared';

interface ResultsScreenProps {
  navigation: any;
}

export function ResultsScreen({ navigation }: ResultsScreenProps) {
  const {
    query,
    results,
    isLoading,
    error,
    currentPage,
    setResults,
    setLoading,
    setError,
    setCurrentPage,
  } = useSearchStore();

  const { activeFilters } = useFilterStore();

  const [showFilters, setShowFilters] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const medicines: Medicine[] = results?.medicines ?? [];
  const hasMore = results !== null && currentPage < results.totalPages;

  const handleMedicinePress = useCallback(
    (medicineId: string) => {
      navigation.navigate('Prospect', { medicineId });
    },
    [navigation],
  );

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || query.trim().length < 3) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      // Determine search type from current results (default to active)
      const result = await searchByActiveIngredient(query, activeFilters, nextPage);

      setResults({
        ...result,
        medicines: [...medicines, ...result.medicines],
      });
      setCurrentPage(nextPage);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar más resultados.';
      setError(message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    isLoadingMore,
    hasMore,
    query,
    currentPage,
    activeFilters,
    medicines,
    setResults,
    setCurrentPage,
    setError,
  ]);

  const handleFiltersChange = useCallback(async () => {
    if (query.trim().length < 3) return;

    setLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      const result = await searchByActiveIngredient(query, activeFilters, 1);
      setResults(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al aplicar filtros.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [query, activeFilters, setLoading, setError, setCurrentPage, setResults]);

  const renderMedicineCard = useCallback(
    ({ item }: { item: Medicine }) => (
      <MedicineCard
        medicine={item}
        onPress={() => handleMedicinePress(item.id)}
      />
    ),
    [handleMedicinePress],
  );

  const renderFooter = useCallback(() => {
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#1A73E8" />
        </View>
      );
    }

    if (hasMore) {
      return (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={handleLoadMore}
          accessibilityRole="button"
          accessibilityLabel="Cargar más resultados"
        >
          <Text style={styles.loadMoreButtonText}>Cargar más</Text>
        </TouchableOpacity>
      );
    }

    return null;
  }, [isLoadingMore, hasMore, handleLoadMore]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;

    return (
      <View
        style={styles.emptyContainer}
        accessibilityRole="text"
        accessibilityLabel="No se encontraron medicamentos"
      >
        <Text style={styles.emptyTitle}>No se encontraron medicamentos</Text>
        <Text style={styles.emptySubtitle}>
          Intente con otro término de búsqueda o ajuste los filtros.
        </Text>
      </View>
    );
  }, [isLoading]);

  const keyExtractor = useCallback((item: Medicine) => item.id, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with result count and filter toggle */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.queryText} numberOfLines={1}>
              "{query}"
            </Text>
            {results !== null && (
              <Text style={styles.resultCount}>
                {results.total} resultado{results.total !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.filterToggleButton, showFilters && styles.filterToggleButtonActive]}
            onPress={() => setShowFilters((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            accessibilityState={{ expanded: showFilters }}
          >
            <Text
              style={[
                styles.filterToggleText,
                showFilters && styles.filterToggleTextActive,
              ]}
            >
              Filtros
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter panel (collapsible) */}
        {showFilters && (
          <View style={styles.filterPanelContainer}>
            <FilterPanel onFiltersChange={handleFiltersChange} />
          </View>
        )}

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

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1A73E8" />
            <Text style={styles.loadingText}>Cargando resultados...</Text>
          </View>
        )}

        {/* Results list */}
        {!isLoading && (
          <FlatList
            data={medicines}
            keyExtractor={keyExtractor}
            renderItem={renderMedicineCard}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            contentContainerStyle={
              medicines.length === 0 ? styles.emptyListContent : styles.listContent
            }
            showsVerticalScrollIndicator={false}
            accessibilityRole="list"
            accessibilityLabel="Lista de medicamentos encontrados"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  queryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  resultCount: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  filterToggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CCC',
    backgroundColor: '#FFF',
  },
  filterToggleButtonActive: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
  filterToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  filterToggleTextActive: {
    color: '#FFF',
  },
  filterPanelContainer: {
    maxHeight: 320,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyListContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#444',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
  },
  loadMoreButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default ResultsScreen;
