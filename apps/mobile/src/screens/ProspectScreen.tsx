/**
 * ProspectScreen — Pantalla de detalle del prospecto de un medicamento.
 *
 * - Recibe `medicineId` como parámetro de ruta
 * - Obtiene el prospecto al montar usando prospectService.getProspect
 * - Muestra indicador de carga mientras obtiene datos
 * - Muestra mensaje de error con "consulte a su profesional de salud" si PROSPECT_NOT_FOUND
 * - Muestra todas las secciones del prospecto con índice de contenidos navegable
 * - Botón de imprimir/exportar PDF (condicional según plataforma)
 *
 * Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { getProspect } from '../services/prospectService';
import type { Prospect } from '@drug-medicine-lookup/shared';

interface ProspectScreenProps {
  navigation: any;
  route: {
    params: {
      medicineId: string;
    };
  };
}

interface ProspectSection {
  key: keyof Omit<Prospect, 'medicineId'>;
  title: string;
}

const PROSPECT_SECTIONS: ProspectSection[] = [
  { key: 'indications', title: 'Indicaciones terapéuticas' },
  { key: 'dosage', title: 'Posología y forma de administración' },
  { key: 'contraindications', title: 'Contraindicaciones' },
  { key: 'warnings', title: 'Advertencias y precauciones' },
  { key: 'interactionsText', title: 'Interacciones medicamentosas' },
  { key: 'adverseEffects', title: 'Efectos adversos' },
  { key: 'overdose', title: 'Sobredosis' },
  { key: 'storage', title: 'Condiciones de almacenamiento' },
];

export function ProspectScreen({ navigation, route }: ProspectScreenProps) {
  const { medicineId } = route.params;

  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    async function fetchProspect() {
      setIsLoading(true);
      setError(null);
      setIsNotFound(false);

      try {
        const data = await getProspect(medicineId);
        if (!cancelled) {
          setProspect(data);
        }
      } catch (err: unknown) {
        if (cancelled) return;

        const status = (err as { status?: number }).status;
        if (status === 404) {
          setIsNotFound(true);
        } else {
          const message =
            err instanceof Error
              ? err.message
              : 'Error al cargar el prospecto. Intente nuevamente.';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchProspect();

    return () => {
      cancelled = true;
    };
  }, [medicineId]);

  const scrollToSection = useCallback((sectionKey: string) => {
    const yOffset = sectionRefs.current[sectionKey];
    if (yOffset !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
    }
  }, []);

  const handlePrint = useCallback(() => {
    // Placeholder: in a real app this would use react-native-print or expo-print
    Alert.alert(
      'Exportar prospecto',
      'La función de exportar a PDF estará disponible próximamente.',
      [{ text: 'Aceptar' }],
    );
  }, []);

  const handleSectionLayout = useCallback(
    (sectionKey: string) => (event: { nativeEvent: { layout: { y: number } } }) => {
      sectionRefs.current[sectionKey] = event.nativeEvent.layout.y;
    },
    [],
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator
            size="large"
            color="#1A73E8"
            accessibilityLabel="Cargando prospecto..."
          />
          <Text style={styles.loadingText}>Cargando prospecto...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Prospect not found
  if (isNotFound) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredContainer}>
          <View
            style={styles.notFoundContainer}
            accessibilityRole="alert"
            accessibilityLabel="Prospecto no disponible"
          >
            <Text style={styles.notFoundTitle}>Prospecto no disponible</Text>
            <Text style={styles.notFoundMessage}>
              El prospecto de este medicamento no se encuentra disponible en el catálogo.
            </Text>
            <Text style={styles.notFoundAdvice}>
              Consulte a su profesional de salud o farmacéutico para obtener información
              detallada sobre este medicamento.
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Volver a resultados"
            >
              <Text style={styles.backButtonText}>Volver a resultados</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Generic error
  if (error !== null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredContainer}>
          <View
            style={styles.errorContainer}
            accessibilityRole="alert"
            accessibilityLabel={error}
          >
            <Text style={styles.errorTitle}>Error al cargar el prospecto</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Volver a resultados"
            >
              <Text style={styles.backButtonText}>Volver a resultados</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (prospect === null) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Table of contents */}
        <View style={styles.tocContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tocContent}
            accessibilityRole="tablist"
            accessibilityLabel="Índice de contenidos del prospecto"
          >
            {PROSPECT_SECTIONS.map((section) => (
              <TouchableOpacity
                key={section.key}
                style={styles.tocItem}
                onPress={() => scrollToSection(section.key)}
                accessibilityRole="tab"
                accessibilityLabel={`Ir a sección: ${section.title}`}
              >
                <Text style={styles.tocItemText} numberOfLines={1}>
                  {section.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Print/export button */}
        {Platform.OS !== 'web' && (
          <TouchableOpacity
            style={styles.printButton}
            onPress={handlePrint}
            accessibilityRole="button"
            accessibilityLabel="Exportar o imprimir prospecto en PDF"
          >
            <Text style={styles.printButtonText}>Exportar / Imprimir PDF</Text>
          </TouchableOpacity>
        )}

        {/* Prospect content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {PROSPECT_SECTIONS.map((section) => {
            const content = prospect[section.key];
            return (
              <View
                key={section.key}
                style={styles.section}
                onLayout={handleSectionLayout(section.key)}
                accessibilityRole="none"
              >
                <Text
                  style={styles.sectionTitle}
                  accessibilityRole="header"
                >
                  {section.title}
                </Text>
                <Text style={styles.sectionContent}>
                  {content !== '' ? content : 'Información no disponible.'}
                </Text>
              </View>
            );
          })}
        </ScrollView>
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
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 15,
    color: '#666',
    marginTop: 12,
  },
  notFoundContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
    textAlign: 'center',
  },
  notFoundMessage: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  notFoundAdvice: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#C62828',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#C62828',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1A73E8',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  tocContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  tocContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tocItem: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    maxWidth: 180,
  },
  tocItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3730A3',
  },
  printButton: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F4FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignItems: 'center',
  },
  printButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3730A3',
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
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 8,
  },
  sectionContent: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
});

export default ProspectScreen;
