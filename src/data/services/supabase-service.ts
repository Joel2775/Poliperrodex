import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
 
import { env } from './env';
 
const almacenamientoAuth =
  Platform.OS === 'web'
    ? undefined
    : {
        getItem: SecureStore.getItemAsync,
        setItem: SecureStore.setItemAsync,
        removeItem: SecureStore.deleteItemAsync,
      };

// Service: envuelve una fuente de datos externa y nada más.
// No guarda estado ni transforma datos; eso le toca al repositorio.
export const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: almacenamientoAuth,
  },
});
 
export function urlPublica(ruta: string): string {
  return supabase.storage.from(env.bucket).getPublicUrl(ruta).data.publicUrl;
}
 
export async function subirImagen(ruta: string, bytes: ArrayBuffer): Promise<void> {
  const { error } = await supabase.storage
    .from(env.bucket)
    .upload(ruta, bytes, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error(`No se pudo subir la foto: ${error.message}`);
}
