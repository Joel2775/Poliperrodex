import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
 
import { EntrenadorProvider } from '@/ui/core/entrenador-view-model';
import { colores, fuentes } from '@/ui/core/tema';
 
export default function RootLayout() {
  return (
    <EntrenadorProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colores.papel },
          headerTintColor: colores.tinta,
          headerTitleStyle: { fontFamily: fuentes.titulo },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colores.papel },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="perro/[id]"
          options={{ title: '', headerBackTitle: 'Volver' }}
        />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
      </Stack>
    </EntrenadorProvider>
  );
}
