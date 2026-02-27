# Flujo de Completado y Edición de Ejercicios/Platos

Este documento describe la lógica implementada para el seguimiento del progreso en OMNIA Fitness Platform.

## 1. Identificación Única (Composite Keys)
Debido a que un mismo ejercicio puede aparecer múltiples veces en una actividad (ej. diferentes bloques), utilizamos una clave compuesta para rastrear el progreso:
`{ejercicio_id}_{bloque}_{orden}`

Ejemplo: `1230_1_2` (Ejercicio 1230, Bloque 1, Orden 2).

## 2. Persistencia en Base de Datos (`progreso_cliente`)
Los datos se almacenan de forma granular para permitir estadísticas y ajustes adaptativos:
- **`ejercicios_pendientes`**: Map con las claves compuestas de ejercicios no realizados.
- **`ejercicios_completados`**: Map con las claves compuestas de ejercicios realizados.
- **`detalles_series`**: JSONB que almacena objetos con `detalle_series` (string formateado: `(reps-peso-sets);(...)`) y metadatos (`bloque`, `orden`).
- **Columnas de Stats (`peso`, `series`, `reps`)**: Almacenan el último PR o valor registrado para cada clave compuesta.

## 3. Lógica de Propagación ("Aplicar siempre a este caso")
Cuando un usuario modifica un peso o repetición y selecciona "Aplicar siempre a este caso":

1.  La API identifica la clave específica siendo editada (`ejId_b_o`).
2.  Busca todos los registros de progreso futuros (`fecha > hoy`) para el usuario y actividad.
3.  **Filtrado por Caso**: Solo se actualiza la entrada en `detalles_series` y columnas de stats que coincidan exactamente con la clave compuesta.
4.  **No Interferencia**: Si el mismo ejercicio aparece en otro bloque (ej. `ejId_2_1`), ese valor NO se toca, permitiendo planificaciones asimétricas.

## 4. Navegación entre Ejercicios
La navegación (botones ← →) utiliza la misma lógica de claves compuestas para encontrar la posición del ejercicio actual en la lista del día, asegurando que el orden se respete incluso con ejercicios duplicados.

## 5. UI Premium (Overlays)
- **Glassmorphism**: Uso de `backdrop-filter` y transparencias para una sensación de profundidad.
- **Visual Feedback**: Sincronización optimista para que el botón de completado (Fuego) cambie instantáneamente antes de que la API confirme.
