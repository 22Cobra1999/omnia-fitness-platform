# 🔧 Corrección: Selección de Video Existente

## ❌ Problema

Al intentar seleccionar un video existente de otro producto, se seleccionaba una imagen en su lugar, causando un error al intentar reproducir el video:

```
Error cargando video: SyntheticBaseEvent
video_url: 'https://.../images/1759936041896_fitness.jpg'  ← ❌ Es una IMAGEN, no un video
```

**Causa:** El endpoint `/api/coach-media?all=true` estaba devolviendo solo las imágenes, incluso cuando un producto tenía imagen Y video.

---

## ✅ Solución Implementada

### Cambio en `/app/api/coach-media/route.ts`

**Antes (líneas 92-124):**
```typescript
const formattedMedia = mediaData?.map(item => {
  let actualMediaType: 'image' | 'video' = 'image'
  let mediaUrl = item.image_url
  
  if (allMedia) {
    // ❌ PROBLEMA: Solo devuelve LA IMAGEN si existe
    if (item.image_url && item.image_url.trim() !== '') {
      actualMediaType = 'image'
      mediaUrl = item.image_url
    } else if (item.video_url && item.video_url.trim() !== '') {
      actualMediaType = 'video'
      mediaUrl = item.video_url
    }
  }
  // ...
  return { /* un solo archivo */ }
}) || []
```

**Después (líneas 91-145):**
```typescript
const formattedMediaArray: any[] = []

mediaData?.forEach(item => {
  if (allMedia) {
    // ✅ SOLUCIÓN: Devolver AMBOS archivos si existen
    
    // Agregar imagen si existe
    if (item.image_url && item.image_url.trim() !== '') {
      formattedMediaArray.push({
        id: `${item.id}-image`,
        media_type: 'image',
        image_url: item.image_url,
        video_url: null,
        // ...
      })
    }
    
    // Agregar video si existe
    if (item.video_url && item.video_url.trim() !== '') {
      formattedMediaArray.push({
        id: `${item.id}-video`,
        media_type: 'video',
        image_url: null,
        video_url: item.video_url,
        // ...
      })
    }
  }
})

const formattedMedia = formattedMediaArray
```

---

## 📊 Comportamiento Antes vs Después

### Escenario: Un producto tiene imagen Y video

**Registro en `activity_media`:**
```javascript
{
  id: 59,
  activity_id: 59,
  image_url: 'https://.../images/1759936041896_fitness.jpg',
  video_url: 'https://.../videos/1759936073052_Nike.mp4'
}
```

### ❌ Antes (1 archivo devuelto)

```javascript
// GET /api/coach-media?all=true
{
  media: [
    {
      id: 59,
      media_type: 'image',  // ← Siempre priorizaba imagen
      image_url: 'https://.../images/1759936041896_fitness.jpg',
      video_url: 'https://.../videos/1759936073052_Nike.mp4'
    }
  ]
}
```

**Resultado:** El modal de videos mostraba la imagen (porque `media_type` era `'image'`).

### ✅ Después (2 archivos devueltos)

```javascript
// GET /api/coach-media?all=true
{
  media: [
    {
      id: '59-image',
      media_type: 'image',
      image_url: 'https://.../images/1759936041896_fitness.jpg',
      video_url: null
    },
    {
      id: '59-video',
      media_type: 'video',
      image_url: null,
      video_url: 'https://.../videos/1759936073052_Nike.mp4'
    }
  ]
}
```

**Resultado:** El modal de imágenes muestra la imagen, el modal de videos muestra el video.

---

## 🎯 Flujo Completo de Selección

### 1. Usuario abre modal de selección de video

```typescript
// create-product-modal-refactored.tsx
<MediaSelectionModal
  isOpen={isMediaModalOpen}
  onClose={() => setIsMediaModalOpen(false)}
  onMediaSelected={handleMediaSelection}
  mediaType="video"  // ← Solicita solo videos
/>
```

### 2. Modal carga archivos del coach

```typescript
// media-selection-modal.tsx
const response = await fetch('/api/coach-media?all=true')
const data = await response.json()

// Filtrar solo videos
const filteredMedia = data.media?.filter((item: any) => {
  if (mediaType === 'video') {
    return item.video_url && item.video_url.trim() !== ''
  }
}) || []
```

### 3. Backend devuelve ambos archivos

```javascript
// /api/coach-media?all=true
{
  media: [
    { id: '59-image', media_type: 'image', image_url: '...jpg', video_url: null },
    { id: '59-video', media_type: 'video', image_url: null, video_url: '...mp4' }  // ← Este pasa el filtro
  ]
}
```

### 4. Frontend muestra solo el video

```typescript
// El filtro elimina la imagen, solo queda el video
filteredMedia = [
  { id: '59-video', media_type: 'video', video_url: '...mp4' }
]
```

### 5. Usuario selecciona el video

```typescript
// Al hacer clic en el video
handleMediaSelection(
  'https://.../videos/1759936073052_Nike.mp4',
  'video',
  null  // No es un archivo nuevo
)
```

### 6. Producto se guarda con el video correcto

```javascript
// PUT /api/products
{
  video_url: 'https://.../videos/1759936073052_Nike.mp4',  // ✅ Ahora es un .mp4
  // ...
}
```

---

## ⚠️ Corrección de Datos Corruptos

Si ya tienes productos con URLs corruptas (imágenes guardadas como `video_url`), ejecuta este SQL en Supabase:

```sql
-- Limpiar video_url que apuntan a imágenes
UPDATE activity_media
SET video_url = NULL
WHERE video_url LIKE '%/images/%';
```

**Ver archivo:** `sql/fix_corrupted_video_urls.sql` para más opciones.

---

## ✅ Verificación

### Prueba 1: Seleccionar video existente

1. Editar un producto
2. Click en "Seleccionar Video"
3. Seleccionar un video de otro producto
4. Guardar producto
5. Abrir el producto en el modal de vista

**Resultado esperado:** El video se reproduce correctamente.

### Prueba 2: Seleccionar imagen existente

1. Editar un producto
2. Click en "Seleccionar Imagen"
3. Seleccionar una imagen de otro producto
4. Guardar producto
5. Ver la tarjeta del producto

**Resultado esperado:** La imagen se muestra correctamente.

---

## 🔍 Logs para Debugging

### Backend (al solicitar `all=true`)

```
✅ Coach-Media API: TODOS los archivos obtenido: {
  totalArchivos: 4,
  actividadesDelCoach: 3,
  mediaEncontrado: 2,
  archivosFormateados: 4,
  tiposEncontrados: [ 'image', 'image', 'video', 'video' ]
}
```

**Nota:** Si antes veías solo `[ 'image', 'image' ]`, ahora verás `[ 'image', 'image', 'video', 'video' ]`.

### Frontend (al filtrar por video)

```
🎯 MediaSelectionModal: Media filtrada: {
  tipoSolicitado: 'video',
  totalArchivos: 4,
  archivosFiltrados: 2,  // ← Solo los videos
  archivos: [
    { id: '59-video', filename: '...Nike.mp4', video_url: '...mp4' },
    { id: '48-video', filename: '...otro.mp4', video_url: '...mp4' }
  ]
}
```

---

## 📝 Resumen

**Problema:** El API devolvía solo 1 archivo por registro, priorizando la imagen.

**Solución:** El API ahora devuelve 2 archivos si un registro tiene imagen Y video.

**Beneficio:** Los modales de selección ahora muestran correctamente imágenes separadas de videos.

**Archivos modificados:**
- `/app/api/coach-media/route.ts` (líneas 91-145)

**Sin cambios necesarios en:**
- `media-selection-modal.tsx` (el filtro ya funcionaba correctamente)
- `create-product-modal-refactored.tsx` (sin cambios)

