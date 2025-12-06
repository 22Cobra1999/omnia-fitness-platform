# Resumen de Migraciones - Sistema de Actividades

## 📋 Cambios Realizados

### 1. **activity_enrollments** - Columna `is_active`
**Archivo:** `add_activity_enrollments_is_active.sql`

- ✅ Agregada columna `is_active` (BOOLEAN, default TRUE)
- ✅ Indica si la inscripción está activa o finalizada
- ✅ Si el taller finalizó sin fechas nuevas, `is_active = FALSE`
- ✅ Índice creado para búsquedas rápidas
- ❌ **NO se agregó `finished_at`** (según requerimiento)

### 2. **activity_surveys** - Columnas `rating_date` y `calificacion_omnia`
**Archivo:** `add_activity_survey_rating_date.sql`

- ✅ Agregada columna `rating_date` (TIMESTAMP WITH TIME ZONE, default CURRENT_TIMESTAMP)
  - Almacena el día en que se realizó la calificación
  - Permite tanto al cliente como al coach calificar el uso de la página
  - Índice creado para búsquedas por fecha
- ✅ Agregada columna `calificacion_omnia` (INTEGER 1-5, nullable)
  - Calificación general de Omnia (1-5)
  - Puede ser calificada tanto por el cliente como por el coach sobre el uso de la página
  - Índice creado para búsquedas por calificación
- ✅ Las demás columnas ya existentes sirven para recibir encuesta de coach o cliente

### 3. **activities** - Columnas `is_active` y `workshop_versions`
**Archivo:** `add_activities_is_active_and_versions.sql`

#### Columna `is_active`:
- ✅ Agregada columna `is_active` (BOOLEAN, default TRUE)
- ✅ Indica si el producto está activo para nuevas compras
- ✅ Un taller finalizado sin fechas nuevas siempre estará `is_active = FALSE` hasta que se agreguen nuevas fechas
- ✅ El coach puede activar/desactivar libremente un producto
- ✅ Índice creado para búsquedas rápidas

#### Columna `workshop_versions` (JSONB):
- ✅ Agregada columna `workshop_versions` (JSONB, default `{"versions": []}`)
- ✅ Almacena las versiones del taller cuando finaliza y se agregan nuevas fechas
- ✅ Estructura en español: `{"versions": [{"version": 1, "empezada_el": "01/01/2024", "finalizada_el": "15/01/2024"}, ...]}`
- ✅ Formato: "version 1 empezada el dd/mm/aa y finalizada el dd/mm/aa"
- ✅ Permite entender cuántas vueltas del taller van y qué versión es
- ✅ Índice GIN creado para búsquedas eficientes

## 🔄 Orden de Ejecución

1. `add_activity_enrollments_is_active.sql`
2. `add_activity_survey_rating_date.sql`
3. `add_activities_is_active_and_versions.sql`
4. `update_enrollments_after_activities_is_active.sql` (ejecutar después del paso 3)

## 📝 Notas Importantes

- ✅ **NO se agregaron columnas de feedback en activities** - El feedback y rating del coach se almacenan en `activity_surveys`
- Todas las migraciones usan `IF NOT EXISTS` para evitar errores si las columnas ya existen
- Los índices se crean condicionalmente para mejorar el rendimiento
- Los comentarios en las columnas documentan su propósito
- Las actualizaciones automáticas se ejecutan para datos existentes donde sea necesario
- El endpoint `/api/activities/[id]/finish-workshop` ha sido actualizado para guardar feedback en `activity_surveys`

