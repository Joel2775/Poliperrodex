---
name: 01-login
description: Implementar autenticación de entrenadores mediante Google OAuth y Supabase Auth en Poliperrodex, reemplazando el sistema local de apodos y ajustando la política de inserción de avistamientos, conservando la arquitectura existente.
---

# Skill: Supabase Auth con Google en Poliperrodex

## 1. Objetivo

Reemplazar el sistema actual de identificación del entrenador mediante un apodo almacenado localmente por autenticación real con una cuenta de Google utilizando Supabase Auth.

La implementación debe aprovechar la arquitectura existente de Poliperrodex.

**Regla principal:** no reconstruir la aplicación ni cambiar su arquitectura. El proyecto ya tiene una separación adecuada de responsabilidades. El cambio debe concentrarse en:

- `src/data/repositories/entrenador-repository.ts`
- La política RLS de inserción de la tabla `avistamientos` en Supabase.

Solo se deben modificar otros archivos cuando sea estrictamente necesario para conectar el nuevo mecanismo de autenticación con el flujo existente.

## 2. Contexto tecnológico del proyecto

Respetar las tecnologías y versiones existentes:

- Expo SDK 57.
- React Native.
- TypeScript.
- Expo Router.
- Supabase JS v2.
- Supabase Auth.
- Google OAuth.
- React Hooks.
- Arquitectura por capas existente.

No actualizar Expo, React Native, TypeScript ni otras dependencias por iniciativa propia.

Antes de instalar una dependencia, comprobar si realmente es necesaria y si es compatible con Expo SDK 57.

## 3. Arquitectura que se debe conservar

Mantener la estructura actual:

- `src/app/`: navegación y rutas mediante Expo Router.
- `src/ui/`: pantallas, componentes y ViewModels.
- `src/domain/`: modelos y reglas de dominio.
- `src/data/repositories/`: acceso a datos y repositorios.
- `src/data/services/`: servicios externos, incluido Supabase.

No introducir nuevas capas, gestores de estado global ni patrones arquitectónicos innecesarios.

La autenticación debe permanecer encapsulada en el repositorio del entrenador, utilizando el cliente Supabase que ya existe en:

`src/data/services/supabase-service.ts`

## 4. Implementación del repositorio del entrenador

Modificar:

`src/data/repositories/entrenador-repository.ts`

Reemplazar la persistencia local mediante `expo-file-system` y `apodo.txt` por operaciones de Supabase Auth.

El repositorio debe proporcionar operaciones equivalentes a:

- Obtener la sesión actual.
- Obtener el usuario autenticado.
- Iniciar sesión con Google.
- Cerrar sesión.
- Escuchar cambios en el estado de autenticación.
- Comprobar si existe una sesión válida.

Utilizar los métodos oficiales de Supabase Auth.

No almacenar contraseñas, tokens ni credenciales manualmente en archivos locales.

No implementar un sistema de registro mediante correo y contraseña: el acceso solicitado es mediante Google.

### Identidad del entrenador

La identidad debe obtenerse del usuario autenticado de Supabase.

Priorizar:

- `user.id`: identificador único del usuario.
- `user.email`: correo electrónico.
- `user.user_metadata.full_name`: nombre completo, cuando esté disponible.
- `user.user_metadata.name`: nombre alternativo, cuando esté disponible.
- `user.user_metadata.avatar_url`: fotografía de perfil, cuando esté disponible.

No utilizar el nombre visible de Google como identificador único.

Si no existe nombre visible, utilizar un texto alternativo apropiado sin impedir la autenticación.

## 5. Inicio de sesión con Google

Implementar el flujo de Google OAuth compatible con Expo SDK 57 y Supabase Auth.

Antes de escribir código:

1. Revisar el servicio Supabase existente.
2. Revisar `app.json` o `app.config.ts`.
3. Revisar la configuración de esquemas y deep links.
4. Comprobar las dependencias instaladas.
5. Revisar si ya existe alguna implementación parcial de OAuth.

El flujo debe:

1. Mostrar la opción de iniciar sesión con Google.
2. Abrir el proceso de autenticación de Google.
3. Obtener la autorización del usuario.
4. Intercambiar correctamente el resultado de OAuth por una sesión de Supabase.
5. Recuperar el usuario autenticado.
6. Permitir el acceso a la aplicación.
7. Mantener la sesión entre aperturas de la aplicación mediante la persistencia segura compatible con el cliente Supabase existente.

No simular una autenticación exitosa.

No considerar autenticado al usuario solamente porque Google devolvió un nombre o correo.

La sesión válida debe provenir de Supabase Auth.

## 6. Política de inserción de avistamientos

La tabla involucrada es:

`avistamientos`

Actualmente, el repositorio de avistamientos realiza inserciones mediante Supabase y envía información del entrenador junto con los datos de la captura.

Revisar la estructura real de la tabla y las políticas RLS existentes antes de modificar SQL.

Actualizar únicamente la política de inserción necesaria para que solo los usuarios autenticados puedan insertar avistamientos.

La validación de autenticación debe realizarse en PostgreSQL mediante RLS, no únicamente desde React Native.

La política debe contemplar el uso de:

`auth.uid()`

No desactivar RLS.

No crear políticas que permitan insertar registros a usuarios anónimos.

No modificar las políticas de lectura ni las demás operaciones si no es necesario.

**Importante:** no asumir que existe una columna `user_id`, `entrenador_id` u otra columna de identificación. Comprobar primero el esquema real. Si la política requiere una columna que todavía no existe, explicar esa dependencia y proponer el cambio mínimo antes de aplicarlo.

No ejecutar modificaciones destructivas ni borrar registros existentes.

## 7. Compatibilidad con las funcionalidades actuales

La aplicación ya utiliza el apodo del entrenador en diferentes partes:

- Pokédex.
- Perfil del perro.
- Identificación de capturas propias.
- Registro de avistamientos.
- Presentación del entrenador en pantalla.

No romper estas funcionalidades.

Revisar especialmente:

- `src/ui/core/apodo-view-model.ts`
- `src/ui/core/formulario-apodo.tsx`
- `src/ui/pokedex/pokedex-screen.tsx`
- `src/ui/perfil-perro/perfil-perro-screen.tsx`
- `src/ui/perfil-perro/use-perfil-perro-view-model.ts`
- `src/data/repositories/avistamientos-repository.ts`
- `src/data/repositories/entrenador-repository.ts`

Eliminar el formulario de apodo y la escritura de `apodo.txt` cuando hayan sido sustituidos correctamente por la autenticación.

Conservar los contratos actuales de los ViewModels siempre que sea posible.

Si es necesario modificar alguna llamada que actualmente recibe un apodo, realizar el ajuste mínimo y explicar por qué es indispensable.

No cambiar la lógica de la Pokédex, las fotografías, los avistamientos, el mapa, las coordenadas ni el sistema de detección de caídas.

## 8. Manejo de estados y errores

Contemplar los siguientes estados:

- Cargando sesión.
- Usuario no autenticado.
- Autenticando con Google.
- Usuario autenticado.
- Error de autenticación.
- Error de conexión.
- Sesión cerrada.

Evitar que la aplicación muestre temporalmente la pantalla principal antes de comprobar la sesión.

Evitar llamadas duplicadas de autenticación.

Manejar correctamente la cancelación del inicio de sesión y los errores de OAuth.

El usuario debe poder cerrar sesión y volver a autenticarse con otra cuenta de Google.

## 9. Seguridad

- No colocar `service_role` en la aplicación móvil.
- No exponer secretos OAuth en el código fuente.
- Utilizar las variables de entorno existentes cuando corresponda.
- No guardar tokens manualmente.
- No confiar en datos de identidad enviados por el cliente para autorizar inserciones.
- Utilizar RLS como protección real de la base de datos.
- No permitir inserciones anónimas.
- No deshabilitar políticas de seguridad existentes sin justificación.

## 10. Restricciones de implementación

Queda prohibido:

- Reconstruir la aplicación desde cero.
- Cambiar toda la estructura de carpetas.
- Crear otro cliente Supabase si ya existe uno correctamente configurado.
- Reemplazar Supabase por Firebase.
- Introducir Redux, Zustand u otro gestor global sin necesidad.
- Modificar tablas que no intervengan en la autenticación.
- Cambiar el diseño general de la aplicación.
- Eliminar funcionalidades existentes.
- Instalar dependencias innecesarias.
- Modificar políticas RLS ajenas al requerimiento.
- Inventar columnas, variables de entorno o rutas de navegación.

## 11. Orden de trabajo

Seguir este orden:

1. Analizar el repositorio actual.
2. Identificar cómo se utiliza actualmente el apodo.
3. Revisar el cliente Supabase y su persistencia de sesión.
4. Revisar la configuración de Google OAuth y Expo.
5. Identificar el cambio mínimo en `entrenador-repository.ts`.
6. Implementar el inicio y cierre de sesión.
7. Conectar el estado de autenticación con el flujo actual.
8. Retirar el formulario de apodo y la persistencia local obsoleta.
9. Revisar el repositorio de avistamientos.
10. Preparar la nueva política RLS de inserción.
11. Validar los cambios sin alterar las demás funcionalidades.

Si falta alguna configuración externa de Google Cloud o Supabase Dashboard, indicar exactamente qué debe configurar el desarrollador. No inventar credenciales.

## 12. Criterios de aceptación

La implementación se considera terminada cuando:

- [ ] El usuario puede iniciar sesión con Google.
- [ ] Supabase Auth devuelve una sesión válida.
- [ ] El usuario autenticado se identifica mediante su UUID.
- [ ] La sesión persiste al cerrar y abrir la aplicación.
- [ ] El usuario puede cerrar sesión.
- [ ] Ya no es necesario registrar un apodo manualmente.
- [ ] La aplicación no permite acceder al flujo autenticado sin sesión.
- [ ] Los avistamientos siguen registrándose correctamente.
- [ ] La política RLS impide inserciones de usuarios anónimos.
- [ ] La Pokédex continúa funcionando.
- [ ] El perfil de los perros continúa funcionando.
- [ ] Las fotografías y los avistamientos existentes se conservan.
- [ ] No se han alterado funcionalidades ajenas al requerimiento.
- [ ] No existen errores de TypeScript ni de ESLint.

## 13. Informe final obligatorio

Al terminar, presentar:

1. Archivos modificados.
2. Archivos nuevos, si realmente fueron necesarios.
3. Explicación de cómo funciona el nuevo inicio de sesión.
4. Explicación de la política RLS implementada.
5. SQL necesario para Supabase Dashboard, si corresponde.
6. Variables de entorno necesarias, sin inventar valores.
7. Configuración pendiente en Google Cloud y Supabase.
8. Pruebas realizadas y resultados.
9. Cualquier limitación o requisito pendiente.

**Prioridad absoluta:** implementar autenticación real con Google y Supabase Auth manteniendo la arquitectura y el funcionamiento de Poliperrodex. Realizar el menor número posible de modificaciones.