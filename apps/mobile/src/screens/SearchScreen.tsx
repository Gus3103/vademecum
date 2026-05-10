/**
 * SearchScreen — Pantalla principal de búsqueda.
 *
 * - Integra SearchBar con searchStore
 * - Muestra banner de sin conexión cuando !isConnected
 * - Permite alternar entre búsqueda por principio activo y nombre comercial
 * - Al confirmar búsqueda: llama al servicio, actualiza el store y navega a ResultsScreen
 * - Registra la consulta en historyService
 *
 * Requisitos: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 7.5
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { SearchBar } from '../components/SearchBar';
import { useSearchStore } from '../store/searchStore';
import { searchByActiveIngredient, searchByCommercialName } from '../services/searchService';
import { historyService } from '../services/historyService';
import { getIsConnected, subscribeToConnectivity } from '../services/connectivityService';

interface SearchScreenProps {
  navigation: any;
}

type SearchType = 'active' | 'commercial';

export function SearchScreen({ navigation }: SearchScreenProps) {
  const { query, setQuery, setResults, setLoading, setError, isLoading, error, setCurrentPage } =
    useSearchStore();

  const [searchType, setSearchType] = useState<SearchType>('active');
  const [isConnected, setIsConnected] = useState<boolean>(getIsConnected());

  // Subscribe to connectivity changes
  useEffect(() => {
    const unsubscribe = subscribeToConnectivity((connected) => {
      setIsConnected(connected);
    });
    return unsubscribe;
  }, []);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (trimmed.length < 3) {
        setError('Ingrese al menos 3 caracteres para buscar.');
        return;
      }

      if (!isConnected) {
        setError('Sin conexión a internet. Verifique su conexión e intente nuevamente.');
        return;
      }

      setLoading(true);
      setError(null);
      setCurrentPage(1);

      try {
        const result =
          searchType === 'active'
            ? await searchByActiveIngredient(trimmed)
            : await searchByCommercialName(trimmed);

        setResults(result);

        // Save to history
        await historyService.addEntry({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          query: trimmed,
          type: searchType === 'active' ? 'active_ingredient' : 'commercial_name',
          timestamp: Date.now(),
        });

        navigation.navigate('Results');
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Error al realizar la búsqueda. Intente nuevamente.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [isConnected, searchType, setLoading, setError, setResults, setCurrentPage, navigation],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Offline banner */}
        {!isConnected && (
          <View
            style={styles.offlineBanner}
            accessibilityRole="alert"
            accessibilityLabel="Sin conexión a internet"
          >
            <Text style={styles.offlineBannerText}>
              Sin conexión a internet. Se requiere conexión para realizar consultas.
            </Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Consulta de Medicamentos</Text>
          <Text style={styles.subtitle}>Busque por principio activo o nombre comercial</Text>
        </View>

        {/* Search type toggle */}
        <View style={styles.typeToggleContainer} accessibilityRole="radiogroup">
          <TouchableOpacity
            style={[styles.typeButton, searchType === 'active' && styles.typeButtonActive]}
            onPress={() => setSearchType('active')}
            accessibilityRole="radio"
            accessibilityLabel="Buscar por principio activo"
            accessibilityState={{ checked: searchType === 'active' }}
          >
            <Text
              style={[styles.typeButtonText, searchType === 'active' && styles.typeButtonTextActive]}
            >
              Principio activo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, searchType === 'commercial' && styles.typeButtonActive]}
            onPress={() => setSearchType('commercial')}
            accessibilityRole="radio"
            accessibilityLabel="Buscar por nombre comercial"
            accessibilityState={{ checked: searchType === 'commercial' }}
          >
            <Text
              style={[
                styles.typeButtonText,
                searchType === 'commercial' && styles.typeButtonTextActive,
              ]}
            >
              Nombre comercial
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchBarContainer}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onSubmit={handleSearch}
            type={searchType}
            placeholder={
              searchType === 'active'
                ? 'Ej: ibuprofeno, amoxicilina...'
                : 'Ej: Advil, Amoxil...'
            }
          />
        </View>

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#1A73E8"
              accessibilityLabel="Buscando medicamentos..."
            />
            <Text style={styles.loadingText}>Buscando...</Text>
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

        {/* Search hint */}
        {!isLoading && error === null && (
          <Text style={styles.hint}>
            Ingrese al menos 3 caracteres para ver sugerencias
          </Text>
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  offlineBanner: {
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  offlineBannerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
  },
  typeToggleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    overflow: 'hidden',
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  typeButtonActive: {
    backgroundColor: '#1A73E8',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  typeButtonTextActive: {
    color: '#FFF',
  },
  searchBarContainer: {
    marginBottom: 16,
    zIndex: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 32,
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
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default SearchScreen;
