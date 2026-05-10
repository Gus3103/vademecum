/**
 * ConditionResultsScreen — muestra los principios activos para una dolencia
 * y permite buscar medicamentos que los contengan.
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
} from 'react-native';
import { Colors, Spacing, Radius, Typography, Shadow } from '../theme';
import { supabase } from '../services/supabaseClient';
import { searchByActiveIngredient } from '../services/searchService';
import { useSearchStore } from '../store/searchStore';
import type { ActiveIngredient, ConditionSearchResult } from '@drug-medicine-lookup/shared';

interface ConditionResultsScreenProps {
  navigation: any;
  route: { params: { conditionId: string; conditionName: string } };
}

export function ConditionResultsScreen({ navigation, route }: ConditionResultsScreenProps) {
  const { conditionId, conditionName } = route.params;
  const { setResults, setLoading, setError, setQuery, setCurrentPage } = useSearchStore();

  const [data, setData] = useState<ConditionSearchResult | null>(null);
  const [loading, setLocalLoading] = useState(true);
  const [error, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('ingredient_conditions')
          .select('active_ingredients(id, name, synonyms)')
          .eq('condition_id', conditionId);

        if (error || !data) { setLocalError('No se pudo cargar la información.'); return; }

        const ingredients: ActiveIngredient[] = (data as unknown as Array<{
          active_ingredients: { id: string; name: string; synonyms: string[] | null } | null;
        }>)
          .map((r) => r.active_ingredients)
          .filter((ai): ai is { id: string; name: string; synonyms: string[] | null } => ai !== null)
          .map((ai) => ({ id: ai.id, name: ai.name, synonyms: ai.synonyms ?? [] }));

        setData({ condition: { id: conditionId, name: conditionName, category: 'otro' }, activeIngredients: ingredients });
      } catch {
        setLocalError('No se pudo cargar la información.');
      } finally {
        setLocalLoading(false);
      }
    })();
  }, [conditionId, conditionName]);

  const handleIngredientPress = useCallback(
    async (ingredient: ActiveIngredient) => {
      setLoading(true);
      setError(null);
      setQuery(ingredient.name);
      setCurrentPage(1);
      try {
        const result = await searchByActiveIngredient(ingredient.name);
        setResults(result);
        navigation.navigate('Results');
      } catch {
        setError('Error al buscar medicamentos.');
      } finally {
        setLoading(false);
      }
    },
    [navigation, setLoading, setError, setQuery, setCurrentPage, setResults],
  );

  const renderIngredient = useCallback(
    ({ item }: { item: ActiveIngredient }) => (
      <TouchableOpacity
        style={styles.ingredientCard}
        onPress={() => handleIngredientPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`Buscar medicamentos con ${item.name}`}
      >
        <View style={styles.ingredientIcon}>
          <Text style={styles.ingredientEmoji}>🔬</Text>
        </View>
        <View style={styles.ingredientInfo}>
          <Text style={styles.ingredientName}>{item.name}</Text>
          {item.synonyms.length > 0 && (
            <Text style={styles.ingredientSynonyms} numberOfLines={1}>
              También: {item.synonyms.join(', ')}
            </Text>
          )}
        </View>
        <Text style={styles.ingredientArrow}>→</Text>
      </TouchableOpacity>
    ),
    [handleIngredientPress],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.conditionEmoji}>🩺</Text>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{conditionName}</Text>
          <Text style={styles.headerSubtitle}>Principios activos indicados</Text>
        </View>
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {error !== null && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {data !== null && !loading && (
        <>
          <Text style={styles.countText}>
            {data.activeIngredients.length} principio{data.activeIngredients.length !== 1 ? 's' : ''} activo{data.activeIngredients.length !== 1 ? 's' : ''} encontrado{data.activeIngredients.length !== 1 ? 's' : ''}
          </Text>
          <FlatList
            data={data.activeIngredients}
            keyExtractor={(item) => item.id}
            renderItem={renderIngredient}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={styles.emptyText}>No hay principios activos registrados para esta dolencia.</Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  conditionEmoji: { fontSize: 40 },
  headerText: { flex: 1 },
  headerTitle: { ...Typography.h3 },
  headerSubtitle: { ...Typography.small, color: Colors.textSecondary },

  countText: {
    ...Typography.small,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },

  ingredientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  ingredientIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientEmoji: { fontSize: 22 },
  ingredientInfo: { flex: 1 },
  ingredientName: { ...Typography.bodyBold },
  ingredientSynonyms: { ...Typography.tiny, color: Colors.textMuted, marginTop: 2 },
  ingredientArrow: { fontSize: 18, color: Colors.primary, fontWeight: '700' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyText: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },

  errorBox: {
    backgroundColor: Colors.dangerLight,
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  errorText: { color: Colors.danger, textAlign: 'center' },
});

export default ConditionResultsScreen;
