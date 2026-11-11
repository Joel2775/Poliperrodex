import { StyleSheet, View } from 'react-native';

import { Boton } from './boton';
import { colores, espacio } from './tema';
import { Texto } from './texto';
import { useEntrenador } from './entrenador-view-model';

export function InicioSesion() {
  const { autenticando, error, iniciarSesionConGoogle, reintentar, listo } =
    useEntrenador();

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.contenido}>
        <Texto variante="titulo">Poliperrodex</Texto>
        <Texto variante="subtitulo">Tu libreta de avistamientos</Texto>
        <Texto>
          Inicia sesión con Google para guardar tus capturas y encontrarlas en todos tus
          dispositivos.
        </Texto>
        {error && <Texto style={estilos.error}>{error}</Texto>}
        {error && (
          <Boton
            titulo="Reintentar"
            variante="secundario"
            onPress={reintentar}
            deshabilitado={!listo}
            cargando={!listo}
          />
        )}
        <Boton
          titulo="Continuar con Google"
          onPress={iniciarSesionConGoogle}
          cargando={autenticando}
          deshabilitado={!listo}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    padding: espacio.l,
    backgroundColor: colores.papel,
  },
  contenido: { gap: espacio.m },
  error: { color: colores.alerta },
});
