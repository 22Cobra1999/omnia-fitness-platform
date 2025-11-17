# 📊 Explicación de la Tabla `storage_usage`

## ¿Qué es cada fila en `storage_usage`?

Esta tabla registra el espacio de almacenamiento que usa cada coach, dividido por tipo de contenido.

## 🔍 Desglose de Campos

### Ejemplo de Datos

```sql
INSERT INTO "public"."storage_usage" 
  ("id", "coach_id", "concept", "gb_usage", "products", "created_at", "updated_at") 
VALUES 
  ('1', 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f', 'image', '0.000000', '[48]', '2025-10-31 15:55:40.732961+00', '2025-10-31 16:02:53.800037+00'), 
  ('2', 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f', 'video', '0.032000', '[59, 90]', '2025-10-31 15:56:13.336175+00', '2025-10-31 16:02:53.607412+00');
```

**Nota importante:** Los valores en `products` ahora solo incluyen actividades que REALMENTE usan ese tipo de archivo (no todas las del coach).

### Traducción a Palabras

#### **Fila 1 - Imágenes**
- **`id: 1`** → Identificador único de esta fila
- **`coach_id: 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'`** → ID del coach que subió estos archivos
- **`concept: 'image'`** → Tipo de archivo: imágenes (fotos, banners, thumbnails)
- **`gb_usage: '0.000000'`** → Espacio usado: **0 GB** (practicamente nada)
- **`products: '[48]'`** → Array de IDs de actividades: **SOLO actividad #48** tiene imágenes
- **`created_at: '2025-10-31 15:55:40'`** → Primera vez que se registró este cálculo
- **`updated_at: '2025-10-31 16:02:53'`** → Última actualización (hace unos minutos)

#### **Fila 2 - Videos**
- **`id: 2`** → Identificador único de esta fila
- **`coach_id: 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'`** → **Mismo coach** que la fila anterior
- **`concept: 'video'`** → Tipo de archivo: **videos** (clases, ejercicios, etc.)
- **`gb_usage: '0.032000'`** → Espacio usado: **0.032 GB** = **32 MB** de videos
- **`products: '[59, 90]'`** → Array de IDs: **SOLO actividades #59 y #90** tienen videos
- **`created_at: '2025-10-31 15:56:13'`** → Primera vez que se registró
- **`updated_at: '2025-10-31 16:02:53'`** → Última actualización (al mismo tiempo que imágenes)

---

## 📍 ¿Dónde están los archivos reales?

### **Videos** → Están en Bunny.net

Los videos NO están en Supabase, están en **Bunny Stream** (servicio externo de streaming).

Para ver los videos, necesitas consultar las tablas:
- `activity_media`
- `ejercicios_detalles`  
- `nutrition_program_details`

Cada una tiene:
- `video_url` → URL para reproducir el video
- `bunny_video_id` → ID único del video en Bunny
- `activity_id` → A qué actividad pertenece

#### 🔍 Query para ver los videos de una actividad:

```sql
-- Ver videos de una actividad específica (ejemplo: actividad #90)
SELECT 
  am.id,
  am.activity_id,
  am.video_url,
  am.bunny_video_id,
  am.video_thumbnail_url,
  a.title as actividad_nombre
FROM activity_media am
LEFT JOIN activities a ON am.activity_id = a.id
WHERE am.activity_id = 90
  AND am.video_url IS NOT NULL;
```

#### 🔗 Cómo acceder al video:

1. **Por URL directa** (campo `video_url`):
   ```
   https://iframe.mediadelivery.net/embed/{bunny_video_id}
   ```

2. **Por HLS streaming** (para reproductores):
   ```
   https://vz-{library_id}.b-cdn.net/{bunny_video_id}/playlist.m3u8
   ```

3. **Thumbnail** (imagen de portada):
   ```
   https://vz-{library_id}.b-cdn.net/{bunny_video_id}/thumbnail.jpg
   ```

### **Imágenes** → Están en Supabase Storage

Las imágenes SÍ están en Supabase Storage, dentro del bucket `product-media`.

#### 📂 Ubicación de las imágenes:

```
Bucket: product-media
Ruta: coaches/{coach_id}/images/{nombre_archivo}
```

**Ejemplo:**
```
Bucket: product-media
Ruta: coaches/b16c4f8c-f47b-4df0-ad2b-13dcbd76263f/images/foto-ejercicio-1.jpg
```

#### 🔍 Query para ver las imágenes de una actividad:

```sql
-- Ver imágenes de una actividad
SELECT 
  am.id,
  am.activity_id,
  am.image_url,
  a.title as actividad_nombre
FROM activity_media am
LEFT JOIN activities a ON am.activity_id = a.id
WHERE am.activity_id = 90
  AND am.image_url IS NOT NULL;
```

### **PDFs** → También en Supabase Storage

Los PDFs también están en el mismo bucket, en la carpeta `pdfs`.

#### 📂 Ubicación de los PDFs:

```
Bucket: product-media
Ruta: coaches/{coach_id}/pdfs/{nombre_archivo.pdf}
```

---

## 🔄 ¿Cómo se calcula `storage_usage`?

El sistema hace esto automáticamente:

### 1. Para Videos:
1. Consulta `activity_media`, `ejercicios_detalles`, `nutrition_program_details`
2. Obtiene todos los `bunny_video_id` del coach
3. Llama a la API de Bunny: `GET /library/{libraryId}/videos/{videoId}`
4. Suma el campo `storageSize` (en bytes)
5. Convierte a GB: `total_bytes / (1024^3)`

### 2. Para Imágenes:
1. Lista archivos en Supabase Storage: `product-media/coaches/{coach_id}/images/`
2. Suma el tamaño de cada archivo (campo `metadata.size` en bytes)
3. Convierte a GB

### 3. Para PDFs:
1. Igual que imágenes, pero de la carpeta `pdfs/`

### 4. Guarda el resultado:
```sql
INSERT INTO storage_usage (coach_id, concept, gb_usage, products)
VALUES 
  ('b16c4f8c-f47b-4df0-ad2b-13dcbd76263f', 'video', 0.032000, '[90,59,48,78]'),
  ('b16c4f8c-f47b-4df0-ad2b-13dcbd76263f', 'image', 0.000000, '[90,59,48,78]');
```

---

## 📊 Consultas SQL Útiles

### Ver resumen de un coach

```sql
SELECT 
  concept,
  gb_usage,
  ROUND(gb_usage * 1024, 2) as mb_usage,
  products,
  updated_at
FROM storage_usage
WHERE coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
ORDER BY gb_usage DESC;
```

**Resultado:**
```
concept | gb_usage | mb_usage | products      | updated_at
--------|----------|----------|---------------|------------
video   | 0.032000 | 32.77    | [90,59,48,78] | 2025-10-31
image   | 0.000000 | 0.00     | [90,59,48,78] | 2025-10-31
```

### Ver detalles de los videos de un coach

```sql
-- Videos de activity_media
SELECT 
  am.activity_id,
  a.title as actividad_nombre,
  am.video_url,
  am.bunny_video_id,
  am.video_thumbnail_url
FROM activity_media am
INNER JOIN activities a ON am.activity_id = a.id
WHERE a.coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
  AND am.video_url IS NOT NULL;
```

### Ver información de Bunny de un video

Si necesitas el tamaño exacto del video en bytes:

```bash
# Llama a la API de Bunny (requiere API key)
curl -X GET "https://video.bunnycdn.com/library/{LIBRARY_ID}/videos/{VIDEO_ID}" \
  -H "AccessKey: {BUNNY_API_KEY}"
```

**Response ejemplo:**
```json
{
  "guid": "abc123-video-id",
  "title": "Mi Video",
  "storageSize": 34406400,  // ← Tamaño en BYTES
  "length": 120,            // ← Duración en SEGUNDOS
  "status": 4               // ← 4 = publicado/completo
}
```

---

## 🎯 Resumen de tu ejemplo:

**Coach:** `b16c4f8c-f47b-4df0-ad2b-13dcbd76263f`

| Tipo | Espacio | Actividades | ¿Dónde está? |
|------|---------|-------------|--------------|
| **Videos** | 0.032 GB (32 MB) | #59, #90 | **Bunny.net** (Stream) |
| **Imágenes** | 0 GB | #48 | **Supabase Storage** |

**Para ver los videos** → Consulta `activity_media` donde `activity_id IN (59, 90)`

---

## 📝 Notas Importantes

1. **`storage_usage` es una TABLA DE RESUMEN**, no contiene los archivos reales
2. **Los videos están en Bunny.net** (servicio externo de streaming)
3. **Las imágenes están en Supabase Storage** (en el bucket `product-media`)
4. **El campo `products`** es un array JSON con los IDs de actividades
5. **`gb_usage`** tiene 6 decimales para mostrar MB y KB con precisión
6. **Se actualiza automáticamente** cuando subes/eliminas archivos
