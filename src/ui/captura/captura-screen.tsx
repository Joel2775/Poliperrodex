import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { router, useIsFocused } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
 
import { useEntrenador } from '@/ui/core/entrenador-view-model';
import { Boton } from '@/ui/core/boton';
import { Estado } from '@/ui/core/estado';
import { colores, espacio, fuentes, radio } from '@/ui/core/tema';
import { Texto } from '@/ui/core/texto';
 
import { useCapturaViewModel, type PasoCaptura } from './use-captura-view-model';
 
const TEXTO_PASO: Record<PasoCaptura, string> = {
  listo: 'Capturar',
  fotografiando: 'Fotografiando…',
  validando: 'Validando la foto…',
  ubicando: 'Buscando tu ubicación…',
  guardando: 'Guardando…',
};
 
export function CapturaScreen() {
  const { entrenador } = useEntrenador();
 
  if (!entrenador) return <Estado cargando />;
  return <Camara apodo={entrenador.apodo} entrenadorId={entrenador.id} />;
}
 
// La vista solo dibuja lo que el ViewModel le entrega y le avisa de los
// toques. Las únicas decisiones que toma son de interfaz: el permiso de
// la cámara y a qué pantalla ir cuando la captura termina bien.
function Camara({ apodo, entrenadorId }: { apodo: string; entrenadorId: string }) {
  const camara = useRef<CameraView>(null);
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
 
  // Las pestañas siguen montadas aunque no se vean. Con esto, la cámara y
  // el acelerómetro se apagan cuando estás en otra pestaña.
  const enPantalla = useIsFocused();
  const vm = useCapturaViewModel({ apodo, entrenadorId, activo: enPantalla });
 
  async function alCapturar() {
    const foto = await camara.current?.takePictureAsync({
      quality: 0.6,
      shutterSound: false,
    });
    const fotoUri = foto?.uri ?? null;
    setFotoPreview(fotoUri);

    const guardado = await vm.capturar(async () => fotoUri ?? undefined);
    if (guardado && vm.perroId) {
      setFotoPreview(null);
      router.push({ pathname: '/perro/[id]', params: { id: vm.perroId } });
    }
  }
 
  if (!permiso) return <Estado cargando />;
 
  if (!permiso.granted) {
    return (
      <View style={estilos.centro}>
        <Texto style={{ textAlign: 'center' }}>
          Para capturar perros necesitamos la cámara. Solo se usa en esta pestaña.
        </Texto>
        <Boton titulo="Dar permiso" onPress={pedirPermiso} />
      </View>
    );
  }
 
  return (
    <View style={estilos.contenedor}>
      {enPantalla && (
        <CameraView ref={camara} style={StyleSheet.absoluteFill} facing="back" />
      )}
 
      <View style={estilos.arriba}>
        <Texto style={estilos.ayuda}>¿A quién tienes enfrente?</Texto>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.chips}>
          {vm.perros.map((perro) => {
            const activo = perro.id === vm.perroId;
            return (
              <Pressable
                key={perro.id}
                onPress={() => vm.seleccionarPerro(perro.id)}
                style={[estilos.chip, activo && estilos.chipActivo]}>
                <Texto style={estilos.chipTexto}>{perro.nombre}</Texto>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
 
      <View style={estilos.abajo}>
        {vm.error && !fotoPreview && <Texto style={estilos.error}>{vm.error}</Texto>}
        <Boton
          titulo={vm.perroId ? TEXTO_PASO[vm.paso] : 'Elige un perro primero'}
          onPress={alCapturar}
          deshabilitado={!vm.puedeCapturar}
        />
      </View>
 
      {(fotoPreview && (vm.paso === 'validando' || vm.error)) && (
        <View style={estilos.fondoPreview}>
          <View style={estilos.previewCaja}>
            <Image source={{ uri: fotoPreview }} style={estilos.previewImagen} />
            <Texto style={estilos.previewTitulo}>
              {vm.paso === 'validando' ? 'Comprobando la calidad de la foto…' : 'La foto necesita otro intento'}
            </Texto>
            {vm.error && <Texto style={estilos.previewError}>{vm.error}</Texto>}
            {vm.error && (
              <Boton
                titulo="Tomar otra foto"
                onPress={() => {
                  setFotoPreview(null);
                  vm.limpiarError();
                }}
                variante="secundario"
              />
            )}
          </View>
        </View>
      )}

      {/* Tapa el botón mientras está visible: no se puede disparar otra
          foto hasta que el usuario confirme que recogió el teléfono. */}
      {vm.seCayo && (
        <View style={estilos.fondoAviso}>
          <View style={estilos.aviso}>
            <Texto style={estilos.avisoTitulo}>¡Se te cayó de la emoción!</Texto>
            <Texto>No se guardó nada. Recoge el teléfono e inténtalo otra vez.</Texto>
            <Boton titulo="Ya lo recogí" onPress={vm.cerrarAvisoCaida} />
          </View>
        </View>
      )}
    </View>
  );
}
 
const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.tinta },
  centro: { flex: 1, justifyContent: 'center', padding: espacio.l, gap: espacio.m },
  arriba: { paddingTop: espacio.m, gap: espacio.s },
  ayuda: { color: colores.blanco, paddingHorizontal: espacio.m, fontWeight: '600' },
  chips: { gap: espacio.s, paddingHorizontal: espacio.m },
  chip: {
    paddingHorizontal: espacio.m,
    paddingVertical: espacio.s,
    borderRadius: radio,
    borderWidth: 1.5,
    borderColor: colores.blanco,
    backgroundColor: 'rgba(42, 37, 32, 0.55)',
  },
  chipActivo: { backgroundColor: colores.terracota, borderColor: colores.terracota },
  chipTexto: { color: colores.blanco, fontWeight: '600' },
  abajo: { marginTop: 'auto', padding: espacio.m, gap: espacio.s },
  error: { color: colores.blanco, backgroundColor: colores.alerta, padding: espacio.s },
  fondoPreview: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(42, 37, 32, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: espacio.l,
  },
  previewCaja: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colores.papel,
    borderRadius: radio,
    padding: espacio.m,
    gap: espacio.s,
    alignItems: 'center',
  },
  previewImagen: {
    width: '100%',
    height: 220,
    borderRadius: radio,
    backgroundColor: colores.tinta,
  },
  previewTitulo: {
    fontWeight: '700',
    color: colores.tinta,
    textAlign: 'center',
  },
  previewError: { color: colores.alerta, textAlign: 'center' },
  fondoAviso: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(42, 37, 32, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: espacio.l,
  },
  aviso: { backgroundColor: colores.papel, padding: espacio.l, gap: espacio.m },
  avisoTitulo: {
    fontFamily: fuentes.titulo,
    fontSize: 24,
    fontWeight: '700',
    color: colores.alerta,
  },
});
