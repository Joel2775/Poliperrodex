import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';

import { entrenadorRepository } from '@/data/repositories/entrenador-repository';

export type Entrenador = {
  id: string;
  nombre: string;
  apodo: string;
  email: string | null;
  avatarUrl: string | null;
};

type EstadoEntrenador = {
  entrenador: Entrenador | null;
  listo: boolean;
  autenticando: boolean;
  error: string | null;
  iniciarSesionConGoogle: () => Promise<void>;
  cerrarSesion: () => Promise<void>;
  reintentar: () => Promise<void>;
};

const EntrenadorContext = createContext<EstadoEntrenador | null>(null);

function aEntrenador(usuario: User): Entrenador {
  const metadata = usuario.user_metadata;
  const nombreCompleto =
    typeof metadata.full_name === 'string' ? metadata.full_name.trim() : '';
  const nombreAlternativo = typeof metadata.name === 'string' ? metadata.name.trim() : '';
  const nombre = nombreCompleto || nombreAlternativo || usuario.email || 'Entrenador';
  const apodo = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_ñÑáéíóúÁÉÍÓÚ-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 20);

  return {
    id: usuario.id,
    nombre,
    apodo: apodo.length >= 3 ? apodo : 'Entrenador',
    email: usuario.email ?? null,
    avatarUrl: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null,
  };
}

export function EntrenadorProvider({ children }: { children: ReactNode }) {
  const [entrenador, setEntrenador] = useState<Entrenador | null>(null);
  const [listo, setListo] = useState(false);
  const [autenticando, setAutenticando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cargaEnCurso = useRef(false);
  const loginEnCurso = useRef(false);
  const sesionInicialValidada = useRef(false);

  const cargarUsuario = useCallback(async () => {
    if (cargaEnCurso.current) return;
    cargaEnCurso.current = true;
    try {
      const usuario = await entrenadorRepository.obtenerUsuario();
      setEntrenador(usuario ? aEntrenador(usuario) : null);
    } catch (e) {
      setEntrenador(null);
      setError(e instanceof Error ? e.message : 'No se pudo validar la sesión');
    } finally {
      cargaEnCurso.current = false;
      sesionInicialValidada.current = true;
      setListo(true);
    }
  }, []);

  useEffect(() => {
    const suscripcion = entrenadorRepository.escucharCambios((evento, sesion) => {
      if (evento === 'INITIAL_SESSION') return;
      if (evento === 'SIGNED_OUT') {
        setEntrenador(null);
        setError(null);
        sesionInicialValidada.current = true;
        setListo(true);
      } else if (sesion?.user && sesionInicialValidada.current) {
        setEntrenador(aEntrenador(sesion.user));
        setError(null);
        setListo(true);
      }
    });
    void Promise.resolve().then(cargarUsuario);
    return () => suscripcion.unsubscribe();
  }, [cargarUsuario]);

  const reintentar = useCallback(async () => {
    setListo(false);
    setError(null);
    await cargarUsuario();
  }, [cargarUsuario]);

  const iniciarSesionConGoogle = useCallback(async () => {
    if (loginEnCurso.current) return;
    loginEnCurso.current = true;
    setAutenticando(true);
    setError(null);
    try {
      const resultado = await entrenadorRepository.iniciarSesionConGoogle();
      if (resultado === 'cancelado') return;
      const usuario = await entrenadorRepository.obtenerUsuario();
      if (!usuario) throw new Error('Supabase no confirmó el usuario autenticado');
      setEntrenador(aEntrenador(usuario));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión con Google');
    } finally {
      loginEnCurso.current = false;
      setAutenticando(false);
    }
  }, []);

  const cerrarSesion = useCallback(async () => {
    setError(null);
    try {
      await entrenadorRepository.cerrarSesion();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cerrar la sesión');
    }
  }, []);

  return (
    <EntrenadorContext.Provider
      value={{
        entrenador,
        listo,
        autenticando,
        error,
        iniciarSesionConGoogle,
        cerrarSesion,
        reintentar,
      }}>
      {children}
    </EntrenadorContext.Provider>
  );
}

export function useEntrenador(): EstadoEntrenador {
  const valor = useContext(EntrenadorContext);
  if (!valor) throw new Error('useEntrenador debe usarse dentro de <EntrenadorProvider>');
  return valor;
}
