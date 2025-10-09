# 🎬 Instrucciones para Corregir Selección de Videos

## 📋 Resumen del Problema

Tienes 2 problemas relacionados:

### 1. ❌ URLs corruptas en la base de datos
El producto `activity_id: 48` tiene una **imagen guardada como video**:

```
video_url: '.../images/1759936041896_fitness.jpg'  ← ❌ Es una IMAGEN
```

### 2. ❌ Modal seleccionaba imagen en lugar de video
Cuando seleccionabas un video existente, el modal elegía la `image_url` en lugar de `video_url`.

---

## ✅ Solución Paso a Paso

### Paso 1: Limpiar URLs Corruptas en Supabase

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Ejecuta este script:

```sql
-- Ver registros corruptos
SELECT 
  id,
  activity_id,
  CASE 
    WHEN video_url LIKE '%/images/%' THEN '❌ CORRUPTO'
    WHEN video_url LIKE '%/videos/%' THEN '✅ CORRECTO'
    ELSE 'Sin video'
  END as estado,
  video_url
FROM activity_media
WHERE video_url IS NOT NULL;

-- Limpiar URLs corruptas
UPDATE activity_media
SET video_url = NULL
WHERE video_url LIKE '%/images/%';

-- Verificar corrección
SELECT * FROM activity_media WHERE activity_id IN (48, 59, 78);
```

**Resultado esperado:**
```
✅ activity_id 48: video_url = NULL (limpiado)
✅ activity_id 59: video_url = .../videos/Nike.mp4 (correcto)
✅ activity_id 78: video_url = .../videos/Ronaldinho.mov (correcto)
```

### Paso 2: Recarga la Aplicación

1. **Recarga el navegador** (Ctrl+R o F5)
2. La aplicación ya tiene los cambios del código que corrigen el problema

---

## 🔧 Cambios de Código Aplicados

### 1. `/app/api/coach-media/route.ts` (líneas 91-145)

**Antes:** Devolvía 1 archivo por registro, priorizando imagen.

**Después:** Devuelve 2 archivos si un registro tiene imagen Y video:

```typescript
if (allMedia) {
  // Agregar imagen
  if (item.image_url) {
    formattedMediaArray.push({
      id: `${item.id}-image`,
      media_type: 'image',
      image_url: item.image_url,
      video_url: null
    })
  }
  
  // Agregar video
  if (item.video_url) {
    formattedMediaArray.push({
      id: `${item.id}-video`,
      media_type: 'video',
      image_url: null,
      video_url: item.video_url
    })
  }
}
```

### 2. `/components/media-selection-modal.tsx` (líneas 161-163)

**Antes:** Siempre priorizaba `image_url`:

```typescript
const mediaUrl = selectedItem ? (selectedItem.image_url || selectedItem.video_url) : null
```

**Después:** Usa el `mediaType` solicitado:

```typescript
const mediaUrl = selectedItem 
  ? (mediaType === 'image' ? selectedItem.image_url : selectedItem.video_url)
  : null
```

### 3. `/app/api/upload-organized/route.ts` (líneas 198-212)

**Mejorado:** Detecta errores `EPIPE/UND_ERR_SOCKET` y muestra mensaje claro sobre Storage Policies.

---

## 🎯 Flujo Completo (Después de la Corrección)

### Escenario: Crear producto nuevo usando video existente

1. **Usuario:** Click en "Nuevo Producto"
2. **Usuario:** Llena nombre, descripción, precio
3. **Usuario:** Click en "Seleccionar Video"
4. **Frontend:** Llama a `/api/coach-media?all=true`
5. **Backend:** Devuelve:
   ```javascript
   [
     { id: '59-video', media_type: 'video', video_url: '.../videos/Nike.mp4' },
     { id: '78-video', media_type: 'video', video_url: '.../videos/Ronaldinho.mov' }
   ]
   ```
6. **Frontend:** Filtra solo videos (ya están filtrados por el backend)
7. **Usuario:** Selecciona el video de Nike
8. **Modal:** Ejecuta `handleConfirm`:
   ```typescript
   mediaType = 'video'
   selectedItem.video_url = '.../videos/Nike.mp4'
   mediaUrl = selectedItem.video_url  // ✅ Usa video_url porque mediaType es 'video'
   ```
9. **Modal:** Llama a `onMediaSelected('.../videos/Nike.mp4', 'video')`
10. **Producto:** Se guarda con `video_url = '.../videos/Nike.mp4'` ✅

---

## 🔍 Cómo Verificar que Funcionó

### En la Consola del Navegador

Cuando selecciones un video, deberías ver:

```javascript
🎯 MediaSelectionModal: Confirmando selección: {
  selectedId: '59-video',
  mediaType: 'video',
  mediaUrl: 'https://.../videos/1759936073052_Nike.mp4',  // ✅ URL de video correcta
  selectedItem: {
    id: '59-video',
    image_url: null,
    video_url: 'https://.../videos/1759936073052_Nike.mp4'
  }
}

🎯 CREATE-PRODUCT-MODAL: Media seleccionada: {
  mediaUrl: 'https://.../videos/1759936073052_Nike.mp4',
  mediaType: 'video',
  isNewFile: false
}
```

### En los Logs del Backend

Al guardar el producto, deberías ver:

```javascript
🔄 Actualizando producto: {
  productId: 48,
  video_url: 'https://.../videos/1759936073052_Nike.mp4',  // ✅ Ahora es un .mp4
  // ...
}
```

### En el Modal de Vista del Producto

El video debería reproducirse sin errores:
- ✅ No verás "Error cargando video"
- ✅ El video se mostrará y podrás reproducirlo

---

## 📝 Resumen

**Problema:** URLs corruptas en BD + modal priorizaba imagen sobre video.

**Solución:** 
1. ✅ Backend ahora separa imágenes y videos en respuestas diferentes
2. ✅ Modal ahora selecciona la URL correcta según `mediaType`
3. ✅ Script SQL para limpiar datos corruptos existentes

**Archivos modificados:**
- `/app/api/coach-media/route.ts` (separar imágenes y videos)
- `/components/media-selection-modal.tsx` (usar mediaType al seleccionar)
- `/app/api/upload-organized/route.ts` (mejor detección de errores)

**Archivos creados:**
- `sql/fix_corrupted_video_urls.sql` (limpiar URLs corruptas)
- `CORRECCION_SELECCION_VIDEO_EXISTENTE.md` (esta guía)





