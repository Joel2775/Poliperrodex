import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

import { supabase } from '../services/supabase-service';

function parametroUnico(
  parametros: Record<string, string | string[] | undefined> | null,
  nombre: string,
): string | undefined {
  const valor = parametros?.[nombre];
  return Array.isArray(valor) ? valor[0] : valor;
}

export const entrenadorRepository = {
  async obtenerSesion(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(`No se pudo leer la sesión: ${error.message}`);
    return data.session;
  },

  async obtenerUsuario(): Promise<User | null> {
    const sesion = await this.obtenerSesion();
    if (!sesion) return null;

    const { data, error } = await supabase.auth.getUser();
    if (error) throw new Error(`No se pudo validar la sesión: ${error.message}`);
    return data.user;
  },

  async tieneSesionValida(): Promise<boolean> {
    return (await this.obtenerUsuario()) !== null;
  },

  async iniciarSesionConGoogle(): Promise<'autenticado' | 'cancelado'> {
    const redirectTo = Linking.createURL('auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    });

    if (error) throw new Error(`No se pudo iniciar Google OAuth: ${error.message}`);
    if (!data.url) throw new Error('Supabase no devolvió la URL de Google OAuth');

    const resultado = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (resultado.type === 'cancel' || resultado.type === 'dismiss') return 'cancelado';
    if (resultado.type !== 'success' || !resultado.url) {
      throw new Error('Google OAuth no devolvió una URL de respuesta');
    }

    const parametros = Linking.parse(resultado.url).queryParams;
    const errorOAuth =
      parametroUnico(parametros, 'error_description') ??
      parametroUnico(parametros, 'error');
    if (errorOAuth) throw new Error(`Google OAuth fue rechazado: ${errorOAuth}`);

    const codigo = parametroUnico(parametros, 'code');
    if (!codigo) throw new Error('La respuesta de Google OAuth no contiene un código');

    const { data: sesion, error: errorIntercambio } =
      await supabase.auth.exchangeCodeForSession(codigo);
    if (errorIntercambio) {
      throw new Error(`No se pudo validar la sesión con Supabase: ${errorIntercambio.message}`);
    }
    if (!sesion.session?.user.id) {
      throw new Error('Supabase no devolvió una sesión autenticada');
    }

    return 'autenticado';
  },

  async cerrarSesion(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(`No se pudo cerrar la sesión: ${error.message}`);
  },

  escucharCambios(
    alCambiar: (evento: AuthChangeEvent, sesion: Session | null) => void,
  ): { unsubscribe: () => void } {
    const { data } = supabase.auth.onAuthStateChange(alCambiar);
    return data.subscription;
  },
};
