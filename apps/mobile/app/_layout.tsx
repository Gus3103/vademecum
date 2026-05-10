import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1A73E8' },
        headerTintColor: '#FFF',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Vademécum' }} />
      <Stack.Screen name="results" options={{ title: 'Resultados' }} />
      <Stack.Screen name="prospect/[id]" options={{ title: 'Prospecto' }} />
      <Stack.Screen name="condition/[id]" options={{ title: 'Dolencia' }} />
      <Stack.Screen name="interactions" options={{ title: 'Interacciones' }} />
      <Stack.Screen name="history" options={{ title: 'Historial' }} />
    </Stack>
  );
}
