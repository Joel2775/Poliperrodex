import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
 
import { useEntrenador } from '@/ui/core/entrenador-view-model';
import { Estado } from '@/ui/core/estado';
import { colores, espacio } from '@/ui/core/tema';
import { Texto } from '@/ui/core/texto';
 
import { TarjetaPerro } from './tarjeta-perro';
import { usePokedexViewModel } from './use-pokedex-view-model';
 
export function PokedexScreen() {
  const { entrenador, cerrarSesion, error } = useEntrenador();
  const vm = usePokedexViewModel(entrenador?.id ?? '');
 
  if (vm.cargando || (vm.error && vm.perros.length === 0)) {
    return (
      <Estado cargando={vm.cargando} error={vm.error} onReintentar={vm.recargar} />
    );
  }
 
  return (
    <FlatList
      data={vm.perros}
      keyExtractor={(perro) => perro.id}
      contentContainerStyle={estilos.lista}
      ItemSeparatorComponent={() => <View style={{ height: espacio.s }} />}
      ListHeaderComponent={
        <View style={estilos.cabecera}>
          <Texto variante="nota">Entrenador: {entrenador?.nombre}</Texto>
          <Texto variante="subtitulo">{vm.resumen}</Texto>
          {error && <Texto style={{ color: colores.alerta }}>{error}</Texto>}
          <Pressable onPress={cerrarSesion} hitSlop={8}>
            <Texto variante="nota" style={estilos.enlace}>
              Cerrar sesión
            </Texto>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => (
        <TarjetaPerro
          perro={item}
          capturado={vm.estaCapturado(item.id)}
          onPress={() =>
            router.push({ pathname: '/perro/[id]', params: { id: item.id } })
          }
        />
      )}
    />
  );
}
 
const estilos = StyleSheet.create({
  lista: { padding: espacio.m },
  cabecera: { gap: espacio.xs, marginBottom: espacio.m },
  enlace: { color: colores.terracota, textDecorationLine: 'underline' },
});
