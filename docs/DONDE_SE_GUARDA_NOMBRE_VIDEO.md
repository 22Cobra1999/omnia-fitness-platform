# 📹 Dónde se Guarda el Nombre del Video Editado

## 🔍 Estado Actual por Fuente

### 1. **activity_media** (Videos de Portada/Actividad)
**Tabla:** `activity_media`

**Columnas disponibles:**
- ✅ `video_url` - URL del video
- ✅ `bunny_video_id` - ID del video en Bunny
- ✅ `bunny_library_id` - ID de la librería de Bunny
- ✅ `video_thumbnail_url` - URL del thumbnail
- ⚠️ **`video_file_name`** - Existe en la tabla PERO **NO se está guardando** en el endpoint `/api/bunny/upload-video`

**Problema actual:**
```typescript
// app/api/bunny/upload-video/route.ts línea 143-148
.update({
  video_url: videoMeta.streamUrl,
  bunny_video_id: videoMeta.videoId,
  bunny_library_id: videoMeta.libraryId,
  video_thumbnail_url: videoMeta.thumbnailUrl ?? null,
  // ❌ FALTA: video_file_name
})
```

---

### 2. **ejercicios_detalles** (Videos de Ejercicios)
**Tabla:** `ejercicios_detalles`

**Columnas disponibles:**
- ✅ `video_url` - URL del video
- ✅ `bunny_video_id` - ID del video en Bunny
- ✅ `bunny_library_id` - ID de la librería de Bunny
- ✅ `video_thumbnail_url` - URL del thumbnail
- ✅ **`video_file_name`** - **SÍ se está guardando correctamente** ✅

**Código actual (correcto):**
```typescript
// app/api/bunny/upload-video/route.ts línea 121-122
if (effectiveFileName) {
  updatePayload.video_file_name = effectiveFileName
}
```

---

### 3. **nutrition_program_details** (Videos de Nutrición)
**Tabla:** `nutrition_program_details`

**Columnas disponibles:**
- ✅ `video_url` - URL del video (TEXT)
- ❌ **NO tiene** `bunny_video_id`
- ❌ **NO tiene** `bunny_library_id`
- ❌ **NO tiene** `video_thumbnail_url`
- ❌ **NO tiene** `video_file_name`

**Problema:** Esta tabla NO está preparada para videos de Bunny Stream.

---

## ✅ Solución Propuesta

### Opción 1: Agregar `video_file_name` a `activity_media` (RECOMENDADO)

Modificar `/app/api/bunny/upload-video/route.ts` para guardar el nombre:

```typescript
// Cuando se actualiza activity_media
const updatePayload: Record<string, unknown> = {
  video_url: videoMeta.streamUrl,
  bunny_video_id: videoMeta.videoId,
  bunny_library_id: videoMeta.libraryId,
  video_thumbnail_url: videoMeta.thumbnailUrl ?? null,
}

// ✅ AGREGAR ESTO:
if (videoMeta.fileName) {
  updatePayload.video_file_name = videoMeta.fileName
}
```

### Opción 2: Agregar columnas Bunny a `nutrition_program_details`

Si necesitas usar videos de Bunny en nutrición, agregar migración:

```sql
ALTER TABLE nutrition_program_details 
ADD COLUMN IF NOT EXISTS bunny_video_id TEXT,
ADD COLUMN IF NOT EXISTS bunny_library_id INTEGER,
ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS video_file_name TEXT;
```

---

## 📝 Resumen de Acción Requerida

1. **activity_media**: ✅ Agregar `video_file_name` al update (código faltante)
2. **ejercicios_detalles**: ✅ Ya funciona correctamente
3. **nutrition_program_details**: ⚠️ Decidir si necesitas videos de Bunny aquí (agregar columnas si es necesario)

---

## 🎯 Cuando se Edita/Recorta un Video

Cuando se recorta un video, deberías:

1. **Generar nuevo nombre** con sufijo (ej: `video-original-trimmed.mp4`)
2. **Guardar el nuevo nombre** en la tabla correspondiente según el origen:
   - Si viene de `activity_media` → guardar en `activity_media.video_file_name`
   - Si viene de `ejercicios_detalles` → guardar en `ejercicios_detalles.video_file_name`
   - Si viene de `nutrition_program_details` → necesitarías agregar la columna primero

3. **Actualizar el `bunny_video_id`** si se crea un nuevo video en Bunny
4. **Mantener referencia** al video original si es necesario

