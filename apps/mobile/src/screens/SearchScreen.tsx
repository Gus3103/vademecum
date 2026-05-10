/**
 * SearchScreen — pantalla principal rediseñada.
 * Incluye búsqueda por principio activo, nombre comercial y dolencia.
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 7.5
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { SearchBar } from '../components/SearchBar';
import { useSearchStore } from '../store/searchStore';
import { searchByActiveIngredient, searchByCommercialName } from '../services/searchService';
import { historyService } from '../services/historyService';
import { getIsConnected, subscribeToConnectivity } from '../services/connectivityService';
import { Colors, Spacing, Radius, Typography, Shadow } from '../theme';
import { supabaseQuery } from '../services/supabaseClient';
import { normalizeText } from '@drug-medicine-lookup/shared';
import type { Condition } from '@drug-medicine-lookup/shared';

interface SearchScreenProps {
  navigation: any;
}

type SearchType = 'active' | 'commercial' | 'condition';

const SEARCH_TYPES: { key: SearchType; label: string; emoji: string; placeholder: string }[] = [
  { key: 'active',     label: 'Principio activo', emoji: '🔬', placeholder: 'Ej: ibuprofeno, amoxicilina...' },
  { key: 'commercial', label: 'Nombre comercial',  emoji: '🏷️', placeholder: 'Ej: Advil, Amoxil...' },
  { key: 'condition',  label: 'Dolencia',          emoji: '🩺', placeholder: 'Ej: dolor, fiebre, diabetes...' },
];

export function SearchScreen({ navigation }: SearchScreenProps) {
  const { query, setQuery, setResults, setLoading, setError, isLoading, error, setCurrentPage } =
    useSearchStore();

  const [searchType, setSearchType] = useState<SearchType>('active');
  const [isConnected, setIsConnected] = useState<boolean>(getIsConnected());
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [conditionsLoading, setConditionsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToConnectivity(setIsConnected);
    return unsubscribe;
  }, []);

  // Load all conditions for the condition browser
  useEffect(() => {
    if (searchType !== 'condition') return;
    setConditionsLoading(true);
    void (async () => {
      try {
        const { data } = await supabaseQuery<Condition>('conditions', {
          select: 'id,name,category',
          order: 'category.asc,name.asc',
        });
        setConditions(data);
      } finally {
        setConditionsLoading(false);
      }
    })();
  }, [searchType]);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (trimmed.length < 3) {
        setError('Ingrese al menos 3 caracteres para buscar.');
        return;
      }
      if (!isConnected) {
        setError('Sin conexión a internet.');
        return;
      }

      setLoading(true);
      setError(null);
      setCurrentPage(1);

      try {
        if (searchType === 'condition') {
          const { data: found } = await supabaseQuery<{ id: string; name: string }>('conditions', {
            select: 'id,name',
            filters: [`name_normalized=ilike.*${normalizeText(trimmed)}*`],
            limit: 5,
          });
          if (found.length === 0) {
            setError('No se encontraron dolencias con ese término.');
            setLoading(false);
            return;
          }
          const first = found[0]!;
          navigation.navigate('ConditionResults', { conditionId: first.id, conditionName: first.name });
          setLoading(false);
          return;
        }

        const result = searchType === 'active'
          ? await searchByActiveIngredient(trimmed)
          : await searchByCommercialName(trimmed);

        setResults(result);
        await historyService.addEntry({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          query: trimmed,
          type: searchType === 'active' ? 'active_ingredient' : 'commercial_name',
          timestamp: Date.now(),
        });
        navigation.navigate('Results');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al buscar. Intente nuevamente.');
      } finally {
        setLoading(false);
      }
    },
    [isConnected, searchType, setLoading, setError, setResults, setCurrentPage, navigation],
  );

  const handleConditionPress = useCallback(
    (condition: Condition) => {
      navigation.navigate('ConditionResults', { conditionId: condition.id, conditionName: condition.name });
    },
    [navigation],
  );

  const currentType = SEARCH_TYPES.find((t) => t.key === searchType)!;

  // Group conditions by category for the browser
  const conditionsByCategory = conditions.reduce<Record<string, Condition[]>>((acc, c) => {
    const list = acc[c.category] ?? [];
    list.push(c);
    acc[c.category] = list;
    return acc;
  }, {});

  const CATEGORY_LABELS: Record<string, string> = {
    dolor: '😣 Dolor',
    infeccion: '🦠 Infección',
    cardiovascular: '❤️ Cardiovascular',
    digestivo: '🫃 Digestivo',
    respiratorio: '🫁 Respiratorio',
    neurologico: '🧠 Neurológico',
    endocrino: '⚗️ Endocrino',
    musculoesqueletico: '🦴 Músculo-esquelético',
    dermatologico: '🩹 Dermatológico',
    otro: '💊 Otros',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Offline banner */}
        {!isConnected && (
          <View style={styles.offlineBanner} accessibilityRole="alert">
            <Text style={styles.offlineText}>📡 Sin conexión — se requiere internet para buscar</Text>
          </View>
        )}

        {/* Hero header */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>💊</Text>
          <Text style={styles.heroTitle}>Vademécum</Text>
          <Text style={styles.heroSubtitle}>Consulta de medicamentos</Text>
        </View>

        {/* Search type selector */}
        <View style={styles.typeSelector}>
          {SEARCH_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.typeChip, searchType === t.key && styles.typeChipActive]}
              onPress={() => { setSearchType(t.key); setQuery(''); setError(null); }}
              accessibilityRole="radio"
              accessibilityState={{ checked: searchType === t.key }}
              accessibilityLabel={t.label}
            >
              <Text style={styles.typeChipEmoji}>{t.emoji}</Text>
              <Text style={[styles.typeChipLabel, searchType === t.key && styles.typeChipLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onSubmit={handleSearch}
            type={searchType === 'condition' ? 'active' : searchType}
            placeholder={currentType.placeholder}
          />
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Buscando...</Text>
          </View>
        )}

        {/* Error */}
        {error !== null && !isLoading && (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Condition browser */}
        {searchType === 'condition' && !isLoading && (
          <View style={styles.conditionBrowser}>
            <Text style={styles.sectionTitle}>Explorar por dolencia</Text>
            {conditionsLoading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              Object.entries(conditionsByCategory).map(([cat, items]) => (
                <View key={cat} style={styles.categoryGroup}>
                  <Text style={styles.categoryLabel}>{CATEGORY_LABELS[cat] ?? cat}</Text>
                  <View style={styles.conditionChips}>
                    {items.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={styles.conditionChip}
                        onPress={() => handleConditionPress(c)}
                        accessibilityRole="button"
                        accessibilityLabel={c.name}
                      >
                        <Text style={styles.conditionChipText}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Quick access */}
        {searchType !== 'condition' && !isLoading && error === null && (
          <View style={styles.quickAccess}>
            <Text style={styles.sectionTitle}>Búsquedas frecuentes</Text>
            <View style={styles.quickChips}>
              {['Ibuprofeno', 'Paracetamol', 'Amoxicilina', 'Omeprazol', 'Atorvastatina'].map((term) => (
                <TouchableOpacity
                  key={term}
                  style={styles.quickChip}
                  onPress={() => { setQuery(term); handleSearch(term); }}
                  accessibilityRole="button"
                  accessibilityLabel={`Buscar ${term}`}
                >
                  <Text style={styles.quickChipText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xxl },

  offlineBanner: {
    backgroundColor: Colors.danger,
    padding: Spacing.sm,
    margin: Spacing.md,
    borderRadius: Radius.md,
  },
  offlineText: { color: Colors.white, textAlign: 'center', fontWeight: '600', fontSize: 13 },

  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  heroEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  heroTitle: { ...Typography.h1, color: Colors.primary, marginBottom: 4 },
  heroSubtitle: { ...Typography.body, color: Colors.textSecondary },

  typeSelector: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  typeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 2,
    ...Shadow.sm,
  },
  typeChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  typeChipEmoji: { fontSize: 20 },
  typeChipLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },
  typeChipLabelActive: { color: Colors.primary },

  searchContainer: { marginHorizontal: Spacing.md, marginBottom: Spacing.md, zIndex: 10 },

  centered: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  loadingText: { ...Typography.body, color: Colors.textSecondary },

  errorBox: {
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: { color: Colors.danger, fontSize: 14, textAlign: 'center' },

  sectionTitle: { ...Typography.h4, marginBottom: Spacing.sm, marginHorizontal: Spacing.md },

  conditionBrowser: { marginTop: Spacing.md },
  categoryGroup: { marginBottom: Spacing.md },
  categoryLabel: {
    ...Typography.label,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    color: Colors.textMuted,
  },
  conditionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  conditionChip: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  conditionChipText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },

  quickAccess: { marginTop: Spacing.lg },
  quickChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  quickChip: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  quickChipText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
});

export default SearchScreen;
