/**
 * HistoryScreen — Pantalla de historial de consultas.
 *
 * - Carga entradas de historyService.getEntries() al montar
 * - FlatList de entradas (query + tipo + fecha), ordenadas de más reciente a más antigua
 * - Cada entrada tiene botón "Re-ejecutar" que navega a ResultsScreen con la consulta guardada
 * - Botón de eliminar por entrada llamando a historyService.removeEntry
 * - Botón "Borrar historial completo" llamando a historyService.clearAll
 *
 * Requisitos: 6.2, 6.3, 6.4
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { historyService } from '../services/historyService';
import { useSearchStore } from '../store/searchStore';
import { searchByActiveIngredient, searchByCommercialName } from '../services/searchService';
import type { HistoryEntry } from '@drug-medicine-lookup/shared';

interface HistoryScreenProps {
  navigation: any;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatType(type: HistoryEntry['type']): string {
  return type === 'active_ingredient' ? 'Principio activo' : 'Nombre comercial';
}

export function HistoryScreen({ navigation }: HistoryScreenProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRerunning, setIsRerunning] = useState<string | null>(null);

  const { setQuery, setResults, setLoading, setError, setCurrentPage } = useSearchStore();

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await historyService.getEntries();
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const handleRerun = useCallback(
    async (entry: HistoryEntry) => {
      setIsRerunning(entry.id);
      setQuery(entry.query);
      setCurrentPage(1);
      setLoading(true);
      setError(null);

      try {
        const result =
          entry.type === 'active_ingredient'
            ? await searchByActiveIngredient(entry.query)
            : await searchByCommercialName(entry.query);

        setResults(result);
        navigation.navigate('Results');
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Error al ejecutar la consulta.';
        setError(message);
      } finally {
        setLoading(false);
        setIsRerunning(null);
      }
    },
    [navigation, setQuery, setCurrentPage, setLoading, setError, setResults],
  );

  const handleRemoveEntry = useCallback(
    async (id: string) => {
      try {
        await historyService.removeEntry(id);
        setEntries((prev) => prev.filter((e) => e.id !== id));
      } catch {
        // Silently ignore removal errors
      }
    },
    [],
  );

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Borrar historial',
      '¿Está seguro de que desea borrar todo el historial de consultas? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: async () => {
            try {
              await historyService.clearAll();
              setEntries([]);
            } catch {
              // Silently ignore clear errors
            }
          },
        },
      ],
    );
  }, []);

  const renderEntry = useCallback(
    ({ item }: { item: HistoryEntry }) => {
      const isRunning = isRerunning === item.id;

      return (
        <View
          style={styles.entryItem}
          accessibilityRole="none"
        >
          <View style={styles.entryInfo}>
            <Text style={styles.entryQuery} numberOfLines={2}>
              {item.query}
            </Text>
            <View style={styles.entryMeta}>
              <View style={styles.entryTypeBadge}>
                <Text style={styles.entryTypeText}>{formatType(item.type)}</Text>
              </View>
              <Text style={styles.entryDate}>{formatDate(item.timestamp)}</Text>
            </View>
          </View>

          <View style={styles.entryActions}>
            <TouchableOpacity
              style={[styles.rerunButton, isRunning && styles.rerunButtonDisabled]}
              onPress={() => handleRerun(item)}
              disabled={isRunning}
              accessibilityRole="button"
              accessibilityLabel={`Re-ejecutar búsqueda: ${item.query}`}
              accessibilityState={{ disabled: isRunning }}
            >
              {isRunning ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.rerunButtonText}>Re-ejecutar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleRemoveEntry(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Eliminar entrada: ${item.query}`}
            >
              <Text style={styles.deleteButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [isRerunning, handleRerun, handleRemoveEntry],
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;

    return (
      <View
        style={styles.emptyContainer}
        accessibilityRole="text"
        accessibilityLabel="No hay consultas en el historial"
      >
        <Text style={styles.emptyTitle}>Sin historial</Text>
        <Text style={styles.emptySubtitle}>
          Las consultas que realice aparecerán aquí para que pueda volver a ejecutarlas
          fácilmente.
        </Text>
      </View>
    );
  }, [isLoading]);

  const keyExtractor = useCallback((item: HistoryEntry) => item.id, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Historial de consultas</Text>
          {entries.length > 0 && (
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={handleClearAll}
              accessibilityRole="button"
              accessibilityLabel="Borrar historial completo"
            >
              <Text style={styles.clearAllButtonText}>Borrar todo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Loading indicator */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#1A73E8"
              accessibilityLabel="Cargando historial..."
            />
            <Text style={styles.loadingText}>Cargando historial...</Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={keyExtractor}
            renderItem={renderEntry}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={
              entries.length === 0 ? styles.emptyListContent : styles.listContent
            }
            showsVerticalScrollIndicator={false}
            accessibilityRole="list"
            accessibilityLabel="Historial de consultas"
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
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  clearAllButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  clearAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C62828',
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 10,
  },
  emptyListContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#444',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  entryItem: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  entryInfo: {
    flex: 1,
  },
  entryQuery: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  entryTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  entryTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3730A3',
  },
  entryDate: {
    fontSize: 12,
    color: '#999',
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rerunButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#1A73E8',
    minWidth: 90,
    alignItems: 'center',
  },
  rerunButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  rerunButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#C62828',
    fontWeight: '700',
  },
});

export default HistoryScreen;
