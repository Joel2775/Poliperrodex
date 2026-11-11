import { Redirect } from 'expo-router';

import { useEntrenador } from '@/ui/core/entrenador-view-model';
import { Estado } from '@/ui/core/estado';

export default function AuthCallbackScreen() {
  const { entrenador, autenticando, listo } = useEntrenador();

  if (!listo) return <Estado cargando />;
  if (entrenador || !autenticando) return <Redirect href="/(tabs)" />;
  return <Estado cargando />;
}
