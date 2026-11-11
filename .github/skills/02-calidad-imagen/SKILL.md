---
name: 02-calidad-imagen
description: Implementar validación automática de calidad de fotografías en Poliperrodex para evitar registrar imágenes borrosas, con baja resolución, mala iluminación o distorsionadas, conservando la arquitectura existente del proyecto.
---

# Skill: Validación de calidad de fotografías en Poliperrodex

## 1. Objetivo

Implementar un mecanismo de validación automática que permita determinar si una fotografía tomada desde la aplicación Poliperrodex tiene la calidad suficiente para ser registrada como un avistamiento de un perro.

Actualmente, la aplicación permite guardar fotografías borrosas, desenfocadas, con baja resolución o con problemas de iluminación. Esto puede afectar la identificación visual del perro y la confiabilidad de los registros.

La solución debe validar la imagen antes de enviarla a Supabase Storage y antes de registrar el avistamiento.

## 2. Contexto tecnológico del proyecto

Antes de realizar cualquier modificación, inspeccionar el proyecto y respetar sus tecnologías actuales:

- Expo SDK 57.
- React Native 0.86.
- TypeScript.
- Expo Router.
- Supabase JS v2.
- Expo Camera.
- Expo Image.
- Arquitectura por capas existente.

Estructura general:

```text
src/
├── app/
├── ui/
│   ├── core/
│   ├── pokedex/
│   └── ...
├── domain/
└── data/
    ├── repositories/
    └── services/
```

No modificar versiones de Expo, React Native ni otras dependencias principales para implementar esta funcionalidad.

## 3. Análisis previo obligatorio

Antes de programar:

1. Revisar cómo se realiza actualmente la captura de fotografías.
2. Identificar la pantalla y los componentes que utilizan Expo Camera.
3. Identificar el ViewModel o controlador encargado de procesar la fotografía.
4. Revisar `src/data/repositories/avistamientos-repository.ts`.
5. Identificar en qué momento se sube la imagen a Supabase Storage.
6. Comprobar cómo se registra posteriormente el avistamiento.
7. Revisar las dependencias existentes para evitar instalar librerías innecesarias.

No inventar archivos ni reemplazar componentes existentes sin comprobar su implementación.

## 4. Validaciones que debe implementar

Crear un mecanismo de evaluación de calidad de imagen que contemple los siguientes aspectos:

### 4.1. Detección de imágenes borrosas

Implementar un método que permita estimar la nitidez de una fotografía.

Se recomienda investigar e implementar la **varianza del Laplaciano (Variance of Laplacian)** como técnica de detección de desenfoque.

Funcionamiento esperado:

- Analizar los detalles y bordes de la fotografía.
- Calcular una medida relacionada con la nitidez.
- Comparar el resultado con un umbral configurable.
- Determinar si la imagen presenta un nivel de desenfoque que impide utilizarla correctamente.

No utilizar un umbral arbitrario sin documentar su propósito. Permitir ajustar el valor después de realizar pruebas con fotografías reales.

### 4.2. Resolución de la fotografía

Comprobar que la imagen tenga dimensiones suficientes para conservar detalles visuales.

- Obtener el ancho y alto de la imagen.
- Definir una resolución mínima configurable.
- Rechazar imágenes que no cumplan el mínimo establecido.

No reducir la resolución antes de realizar esta validación.

### 4.3. Iluminación y contraste

Comprobar si la fotografía presenta condiciones que dificulten observar al perro.

Identificar situaciones como:

- Fotografías demasiado oscuras.
- Fotografías sobreexpuestas.
- Contraste insuficiente.

Cuando sea posible, calcular indicadores de iluminación y contraste para evaluar estos problemas.

### 4.4. Distorsión y deformaciones

Investigar si es posible detectar automáticamente deformaciones importantes que afecten la interpretación de la fotografía.

No afirmar que cualquier distorsión puede detectarse mediante una simple métrica.

Priorizar la detección de problemas que realmente puedan evaluarse con los recursos disponibles en Expo y React Native.

Si no es posible detectar una deformación de manera confiable, documentar la limitación y evitar bloquear fotografías válidas por falsos positivos.

## 5. Arquitectura e integración

Mantener la arquitectura actual del proyecto.

La implementación debe separar la evaluación de calidad de la interfaz y del repositorio encargado de guardar los avistamientos.

Se recomienda incorporar un servicio dentro de:

```text
src/data/services/
```

El nombre del archivo debe seguir las convenciones existentes del proyecto. Por ejemplo:

```text
image-quality-service.ts
```

Este servicio debe encargarse de:

- Recibir la imagen capturada.
- Obtener sus características necesarias.
- Ejecutar las validaciones.
- Devolver el resultado de la evaluación.
- Indicar qué problemas se encontraron.

El resultado debe ser estructurado y tipado con TypeScript.

Ejemplo conceptual:

```typescript
interface ImageQualityResult {
  isValid: boolean;
  issues: string[];
  metrics?: {
    sharpness?: number;
    width?: number;
    height?: number;
    brightness?: number;
    contrast?: number;
  };
}
```

Este ejemplo puede adaptarse a las convenciones del proyecto.

## 6. Flujo de funcionamiento esperado

Implementar el siguiente flujo:

1. El usuario abre la cámara.
2. Toma una fotografía.
3. La aplicación obtiene la imagen capturada.
4. Se ejecuta el servicio de validación de calidad.
5. Se evalúan nitidez, resolución, iluminación y los demás criterios implementados.
6. Si la fotografía es válida, se permite continuar con el registro del avistamiento.
7. Si la fotografía no es válida, se muestra una advertencia y se permite tomar otra fotografía.
8. Solamente después de superar la validación se permite subir la imagen a Supabase Storage.
9. Finalmente, se registra el avistamiento como se realiza actualmente.

**Regla fundamental:** una fotografía rechazada no debe llegar al proceso de subida ni generar un registro de avistamiento.

## 7. Experiencia de usuario

La validación debe ser clara y fácil de entender.

Si la imagen no cumple los requisitos, mostrar mensajes específicos.

Ejemplos:

- "La fotografía está borrosa. Intenta mantener el teléfono estable."
- "La fotografía tiene poca iluminación. Busca un lugar más iluminado."
- "La resolución de la fotografía es insuficiente."
- "La fotografía presenta problemas de calidad. Intenta capturarla nuevamente."

Incluir:

- Indicador de validación mientras se procesa la imagen.
- Mensajes de error comprensibles.
- Opción para volver a tomar la fotografía.
- Vista previa de la fotografía.
- Bloqueo temporal del botón de registro mientras se realiza la validación.

No mostrar mensajes técnicos al usuario final.

## 8. Compatibilidad y selección de librerías

Antes de instalar cualquier dependencia:

1. Revisar si las herramientas existentes permiten realizar el procesamiento requerido.
2. Comprobar la compatibilidad de las librerías con Expo SDK 57 y React Native 0.86.
3. Verificar si requieren módulos nativos.
4. Comprobar si funcionan con Expo Go o requieren un development build.
5. Evitar dependencias incompatibles con la configuración actual.

No instalar OpenCV automáticamente sin verificar su compatibilidad.

Si se requiere una librería nativa, explicar previamente qué cambios implica y cómo afecta la ejecución de la aplicación.

Priorizar una solución eficiente, mantenible y compatible con el entorno actual.

## 9. Restricciones

- No modificar el sistema de autenticación con Supabase.
- No modificar las tablas de Supabase.
- No modificar las políticas RLS.
- No cambiar el modelo de datos de avistamientos.
- No reemplazar el repositorio de avistamientos.
- No alterar la lógica de subida de fotografías, excepto para impedir que se suban imágenes rechazadas.
- No modificar pantallas que no estén relacionadas con la captura y registro de fotografías.
- No implementar inteligencia artificial o modelos de aprendizaje automático si no son necesarios para resolver el problema.
- No duplicar validaciones en diferentes capas.
- No eliminar funcionalidades existentes.

La validación debe realizarse antes de ejecutar el repositorio que registra los avistamientos.

## 10. Pruebas obligatorias

Probar los siguientes escenarios:

| Caso | Resultado esperado |
|---|---|
| Fotografía nítida y bien iluminada | Permitir registro |
| Fotografía muy borrosa | Rechazar fotografía |
| Fotografía con poca resolución | Rechazar fotografía |
| Fotografía demasiado oscura | Advertir o rechazar según el umbral |
| Fotografía sobreexpuesta | Advertir o rechazar según el umbral |
| Fotografía con calidad suficiente | Permitir registro |
| Error durante la evaluación | Informar el problema y no subir la imagen |

Comprobar también que una fotografía rechazada no genere archivos innecesarios en Storage ni registros incompletos en Supabase.

Los umbrales deben probarse con fotografías reales tomadas desde diferentes distancias y condiciones de iluminación.

## 11. Criterios de aceptación

La implementación se considera terminada cuando:

- La aplicación puede evaluar la calidad de una fotografía antes de registrarla.
- Se detectan fotografías borrosas mediante un método documentado.
- Se comprueba la resolución mínima.
- Se evalúan condiciones básicas de iluminación y contraste.
- Se informa al usuario qué problema tiene la fotografía.
- Se permite volver a tomarla.
- Las fotografías rechazadas no se suben a Supabase Storage.
- Las fotografías válidas continúan utilizando el flujo actual de registro.
- La aplicación mantiene su arquitectura y funcionalidades existentes.
- No se introducen dependencias incompatibles con Expo SDK 57.

## 12. Informe final obligatorio

Al finalizar la implementación, presentar:

1. Archivos nuevos creados.
2. Archivos existentes modificados.
3. Dependencias instaladas, si corresponde.
4. Técnica utilizada para detectar fotografías borrosas.
5. Criterios y umbrales de validación implementados.
6. Explicación del funcionamiento del flujo.
7. Pruebas realizadas y resultados.
8. Limitaciones conocidas de la solución.
9. Instrucciones para ejecutar y probar la aplicación.

**Importante:** implementar la solución sobre el código existente. No reconstruir el proyecto ni cambiar su arquitectura por comodidad.
---