import { Stack, useRouter, usePathname } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

function TabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { label: '🔍 Buscar', path: '/' },
    { label: '⚡ Interacciones', path: '/interactions' },
    { label: '📋 Historial', path: '/history' },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <TouchableOpacity
            key={tab.path}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => router.push(tab.path as any)}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1A73E8' },
          headerTintColor: '#FFF',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Vademécum — Consulta de Medicamentos' }} />
        <Stack.Screen name="results" options={{ title: 'Resultados de búsqueda' }} />
        <Stack.Screen name="prospect/[id]" options={{ title: 'Prospecto' }} />
        <Stack.Screen name="condition/[id]" options={{ title: 'Dolencia' }} />
        <Stack.Screen name="interactions" options={{ title: 'Verificar Interacciones' }} />
        <Stack.Screen name="history" options={{ title: 'Historial de consultas' }} />
      </Stack>
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: 4,
    paddingTop: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: '#E8F0FE',
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#1A73E8',
    fontWeight: '700',
  },
});
