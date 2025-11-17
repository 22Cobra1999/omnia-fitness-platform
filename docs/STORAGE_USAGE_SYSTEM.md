# Sistema de Tracking de Storage por Coach

## 📋 Descripción

Sistema para medir y administrar el almacenamiento que usa cada coach en la plataforma, dividido por tipo de contenido (video, imagen, PDF).

## 🗄️ Estructura de Base de Datos

### Tabla `storage_usage`

```
- id: BIGINT (PK)
- coach_id: UUID (FK a auth.users)
- concept: TEXT (video|image|pdf|other)
- gb_usage: DECIMAL(12, 6) - Precisión de 6 decimales
- products: JSONB - Array de activity_ids que usan este storage
- file_name: TEXT - Nombres descriptivos de archivos/actividades
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**Índices:**
- `coach_id` para búsquedas por coach
- `concept` para filtrar por tipo
- `UNIQUE(coach_id, concept)` para evitar duplicados

**RLS (Row Level Security):**
- Coaches solo ven sus propios datos
- Sistema puede insertar/actualizar todos los registros

## 📊 Origen de los Datos

### Videos (Bunny.net)
- `activity_media.video_url` → Bunny API → `storageSize` en bytes
- `ejercicios_detalles.video_url` → Bunny API
- `nutrition_program_details.video_url` → Bunny API

### Imágenes (Supabase Storage)
- Bucket `product-media/coaches/{coach_id}/images`
- Metadata de cada archivo con tamaño en bytes

### PDFs (Supabase Storage)
- Bucket `product-media/coaches/{coach_id}/pdfs`
- Metadata de cada archivo con tamaño en bytes

## 🔄 Flujo de Cálculo

### 1. Obtener videos del coach
```sql
-- De activity_media
SELECT bunny_video_id, activity_id 
FROM activity_media 
WHERE activity_id IN (SELECT id FROM activities WHERE coach_id = ?)

-- De ejercicios_detalles
SELECT bunny_video_id, activity_id 
FROM ejercicios_detalles 
WHERE coach_id = ?

-- De nutrition_program_details
SELECT bunny_video_id, activity_id 
FROM nutrition_program_details 
WHERE coach_id = ?
```

### 2. Consultar tamaños
- **Bunny**: API `/library/{libraryId}/videos/{videoId}` → `storageSize`
- **Supabase**: Storage API `list()` → `metadata.size`

### 3. Calcular y guardar
- Sumar todos los bytes
- Convertir a GB: `bytes / (1024^3)`
- Guardar con 6 decimales
- Agrupar `activity_ids` en array JSON

## 🎨 Componentes UI

### 1. StorageUsageWidget (Widget Simple)
- **Ubicación**: `components/coach/storage-usage-widget.tsx`
- **Integración**: `components/mobile/profile-screen.tsx` (solo coaches)

**Características:**
- Barra segmentada visual (video/imagen/pdf)
- Info Usado/Disponible/Total
- Botón "Ver más" para pantalla detallada
- Diseño minimalista

### 2. StorageDetailScreen (Pantalla Completa)
- **Ubicación**: `components/coach/storage-detail-screen.tsx`
- **Activación**: Click en "Ver más" del widget

**Características:**
- Header con back + refresh
- 3 vistas: Archivos / Actividades / Uso Total
- Lista expandible (10 items por defecto)
- Análisis profundo de almacenamiento

## 🔌 API Endpoints

### GET `/api/coach/storage-usage`

Lee el resumen de storage del coach autenticado desde la BD.

**Ahora solo lee** de `storage_usage` para consistencia con datos pre-poblados.

**Response:**
```json
{
  "success": true,
  "storage": {
    "total": 0.032200,
    "breakdown": {
      "video": 0.031764,
      "image": 0.000402,
      "pdf": 0.000000
    }
  }
}
```

### GET `/api/coach/storage-files`

Obtiene lista detallada de archivos individuales con sus usos.

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "fileId": "video-id",
      "fileName": "nombre del archivo",
      "concept": "video",
      "sizeBytes": 34110336,
      "sizeGB": 0.031764,
      "usesCount": 1,
      "activities": [{"id": 78, "name": "Rutina de Fuerza"}]
    }
  ]
}
```

**Proceso:**
1. Obtiene IDs de videos/imágenes/PDFs
2. Consulta Bunny API para metadata de videos
3. Consulta Supabase Storage para metadata de otros
4. Agrupa usos por archivo
5. Retorna lista ordenada por tamaño

## 🛠️ Helpers y Utilidades

### `lib/bunny/storage-calculator.ts`

- `getBunnyVideoStorageSize(videoIds: string[])` - Suma tamaños de videos
- `getSupabaseStorageSize(coachId, concept)` - Suma archivos en bucket
- `getAllCoachVideosFromBunny()` - Lista todos los videos del coach

### Script de Población

`scripts/populate-storage-usage.js` - Poblar datos históricos

**Uso:**
```bash
node scripts/populate-storage-usage.js
```

Calcula storage para todos los coaches y guarda en BD.

## 📝 Ejemplo de Datos

```sql
-- Coach con 4 productos usando los mismos archivos

INSERT INTO storage_usage VALUES 
  (
    1, 
    'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f',
    'video',
    0.032000,  -- 32 MB de video
    '[90, 59, 48, 78]'  -- Usado en 4 actividades
  ),
  (
    2,
    'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f',
    'image',
    0.000402,  -- 402 KB de imágenes
    '[90, 59, 48, 78]'
  );
```

## 🔍 Consultas Útiles

### Ver storage de un coach
```sql
SELECT 
  concept,
  gb_usage,
  products,
  updated_at
FROM storage_usage
WHERE coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';
```

### Total por coach
```sql
SELECT 
  coach_id,
  SUM(gb_usage) as total_gb
FROM storage_usage
GROUP BY coach_id
ORDER BY total_gb DESC;
```

### Coaches más cerca del límite
```sql
SELECT 
  coach_id,
  SUM(gb_usage) as total_gb,
  ROUND((SUM(gb_usage) / 100.0) * 100, 2) as porcentaje
FROM storage_usage
GROUP BY coach_id
HAVING SUM(gb_usage) > 75
ORDER BY total_gb DESC;
```

## ⚠️ Consideraciones

1. **Precisión**: 6 decimales necesarios para valores pequeños (MB/KB)
2. **Performance**: Consultas a Bunny/Supabase pueden ser lentas
3. **Cache**: Considerar cachear resultados por 1 hora
4. **Deduplicación**: Videos usados en múltiples productos se cuentan una vez
5. **Límites**: Actualmente 100 GB por coach (configurable en widget)

## 🚀 Próximos Pasos

- [ ] Limite configurable por coach
- [ ] Alertas automáticas por email
- [ ] Dashboard de administrador
- [ ] Limpieza automática de archivos antiguos
- [ ] Estadísticas de uso por período



