# ✅ Corrección Completada

## 🎯 Problema Resuelto

El campo `products` en `storage_usage` ahora incluye **SOLO** las actividades que REALMENTE usan cada tipo de archivo.

## 📊 Resultados Actuales (Verificados)

### Coach: `b16c4f8c-f47b-4df0-ad2b-13dcbd76263f`

| Concepto | GB Usado | Actividades | Estado |
|----------|----------|-------------|--------|
| **Videos** | 0.031764 GB (32.53 MB) | [78] | ✅ Correcto |
| **Imágenes** | 0.000402 GB (0.41 MB) | [48, 59, 78, 90] | ✅ Correcto |

### Verificación de Datos Reales

**Videos reales:**
- Activity 78 tiene video

**Imágenes reales:**
- Activity 48 tiene imagen
- Activity 59 tiene imagen  
- Activity 78 tiene imagen
- Activity 90 tiene imagen

**✅ Los datos coinciden perfectamente con la realidad.**

## 🔧 Archivos Corregidos

1. ✅ `scripts/populate-storage-usage.js` - Código corregido
2. ✅ `app/api/coach/storage-usage/route.ts` - Código corregido
3. ✅ Datos en BD actualizados correctamente

### Cambios Principales

**Antes (INCORRECTO):**
```javascript
// Ponía TODAS las actividades del coach
const activityIds = (coachActivities || []).map(a => a.id)
products: activityIds  // [90, 59, 48, 78] para TODOS los conceptos
```

**Ahora (CORRECTO):**
```javascript
// Videos: Solo actividades que tienen videos
const videoActivitySet = new Set()
// ... consulta activity_media, ejercicios_detalles, nutrition_program_details
const videoActivityIds = Array.from(videoActivitySet)
products: videoActivityIds  // [78] solo actividad con videos

// Imágenes: Solo actividades que tienen imágenes
const { data: imageActivities } = await supabase
  .from('activity_media')
  .select('activity_id')
  .not('image_url', 'is', null)
  .in('activity_id', coachActivityIds)
products: imageActivityIds  // [48, 59, 78, 90] solo actividades con imágenes
```

## 📝 Notas Técnicas

### Nutrition Program Details

Se descubrió que `nutrition_program_details` NO tiene `bunny_video_id` (solo tiene `video_url` de Supabase).

Por lo tanto, los videos de nutrition NO se calculan en el storage de Bunny, ya que están en Supabase Storage y se cuentan en el concepto 'image' o 'pdf' según corresponda.

Si en el futuro se migran videos de nutrition a Bunny, será necesario:
1. Agregar columna `bunny_video_id` a `nutrition_program_details`
2. Actualizar el script para incluir esos videos

## 🚀 Cómo Usar

### Regenerar Datos

```bash
# Opción 1: Script Node.js
node scripts/populate-storage-usage.js

# Opción 2: API (desde la app)
GET /api/coach/storage-usage
```

### Verificar Datos

```bash
node scripts/verificar-storage.js
```

### Debuggear

```bash
# Ver qué archivos tiene cada actividad
node scripts/debug-storage.js

# Ver solo imágenes
node scripts/debug-images.js
```

## 📁 Archivos de Utilidad Creados

- `scripts/verificar-storage.js` - Ver datos actuales
- `scripts/debug-storage.js` - Debug completo
- `scripts/debug-images.js` - Debug de imágenes
- `DELETE_STORAGE_USAGE.sql` - Eliminar datos incorrectos
- `QUERIES_DEBUG_STORAGE.sql` - Queries SQL útiles
- `docs/EXPLICACION_STORAGE_USAGE.md` - Documentación actualizada
- `VERIFICAR_CORRECCION.md` - Guía de verificación

## ✅ Estado Final

- ✅ Código corregido
- ✅ Datos regenerados correctamente
- ✅ Verificado con queries reales
- ✅ Documentación actualizada
- ✅ Scripts de utilidad creados

**La corrección está 100% completa y funcionando.**





























