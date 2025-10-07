# Actualización de Base de Datos - Columnas Faltantes

## Problema
Los campos `workshopType` y `sessionsPerClient` no se están guardando porque no existen en la tabla `activities`.

## Solución
Ejecutar las siguientes queries SQL en Supabase:

### 1. Agregar las columnas faltantes
```sql
-- Agregar columnas faltantes para workshops
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS workshop_type TEXT,
ADD COLUMN IF NOT EXISTS sessions_per_client INTEGER;
```

### 2. Agregar comentarios para documentación
```sql
-- Comentarios para documentar las nuevas columnas
COMMENT ON COLUMN activities.workshop_type IS 'Tipo de taller: individual o grupal';
COMMENT ON COLUMN activities.sessions_per_client IS 'Número de sesiones que tomará cada cliente inscrito';
```

### 3. Verificar que las columnas se agregaron
```sql
-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'activities' 
AND column_name IN ('workshop_type', 'sessions_per_client');
```

## Mapeo de Variables del Formulario

### Variables que SÍ se guardan en `activities`:
- `title` → `activities.title`
- `description` → `activities.description` 
- `price` → `activities.price`
- `type` → `activities.type`
- `difficulty` → `activities.difficulty`
- `capacity` → `activities.capacity`
- `modality` → `activities.modality`
- `workshopType` → `activities.workshop_type` (NUEVA)
- `sessionsPerClient` → `activities.sessions_per_client` (NUEVA)

### Variables que se guardan en otras tablas:
- `image` → `activity_media.image_url`
- `videoUrl` → `activity_media.video_url`
- `blocks` → `activities.description` (como JSON)

## Pasos para implementar:
1. Ejecutar las queries SQL en Supabase
2. Actualizar los endpoints de la API para incluir los nuevos campos
3. Verificar que los datos se guarden correctamente

