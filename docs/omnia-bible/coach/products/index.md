# 🛒 Gestión de Productos (Coach)

Esta sección detalla cómo el coach visualiza y gestiona sus ejercicios (Fitness) y platos (Nutrición).

## 📡 Flujo de Consulta
El componente clave es `CSVManagerEnhanced.tsx`, que interactúa con el API `/api/coach/exercises`.

1.  **Categorización**: Se separa la consulta por `category=fitness` o `category=nutricion`.
2.  **Estrategias de Búsqueda**:
    *   **Estrategia 1**: Búsqueda directa por `coach_id`.
    *   **Estrategia 2 (Fallback)**: Si no hay registros directos, se buscan ejercicios asociados a las actividades del coach (vía JSONB en `activity_id`).

## 📥 Flujo de Creación y Carga (Bulk)
Cuando un coach guarda una planificación o sube un CSV:

1.  **API Bulk**: Se llama a `/api/activities/exercises/bulk` (Fitness) o `/api/activity-nutrition/bulk` (Nutrición).
2.  **Procesamiento**:
    *   **Sanitización**: Se normalizan nombres, tipos e intensidades.
    *   **Recetas**: Para nutrición, se inserta primero en la tabla `recetas` y se vincula el `receta_id`.
    *   **JSONB Mapping**: Se actualiza la columna `activity_id` (o `activity_id_new`) con el ID de la actividad y el flag `activo: true`.
3.  **Persistencia**:
    *   **Fitness**: Tabla `ejercicios_detalles`.
    *   **Nutrición**: Tabla `nutrition_program_details` (y espejo en `platos_detalles`).

## 🛠️ Herramientas de Mantenimiento
*   **Importación Masiva**: Soporte para archivos Excel/CSV con validación en tiempo real.
*   **Gestión de Estados**: Marcar elementos como activos/inactivos sin borrarlos de la base de datos para mantener el histórico.

> [!NOTE]
> Las consultas SQL para esta sección se encuentran en [queries.sql](queries.sql).
