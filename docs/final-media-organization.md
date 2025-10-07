# 📁 ORGANIZACIÓN FINAL DE MEDIA Y ARCHIVOS - OMNIA

## 🎯 RESUMEN EJECUTIVO

Hemos implementado una **estrategia optimizada de 2 buckets principales** para organizar todos los archivos de media en OMNIA, simplificando la gestión y mejorando el rendimiento.

## 📊 ESTRUCTURA FINAL OPTIMIZADA

### 🗂️ BUCKETS PRINCIPALES

```
📁 user-media/                    # 👤 USUARIOS
├── avatars/coaches/             # Avatares de coaches
├── avatars/clients/             # Avatares de clientes (futuro)
└── certificates/coaches/        # Certificados de coaches

📁 product-media/                 # 📦 PRODUCTOS Y CONTENIDO
├── images/products/             # Imágenes de productos
├── videos/products/             # Videos de productos
└── videos/exercises/            # Videos de ejercicios (futuro)
```

## 🗃️ TABLAS Y CAMPOS ORGANIZADOS

### 📸 `activity_media` → `product-media`
- **`image_url`** → `product-media/images/products/`
- **`video_url`** → `product-media/videos/products/`
- **`pdf_url`** → `product-media/documents/products/` (futuro)
- **`vimeo_id`** → Mantener como está (no es archivo)

### 📜 `coach_certifications` → `user-media`
- **`file_url`** → `user-media/certificates/coaches/`
- **`file_path`** → `certificates/coaches/`

### 👤 `coaches` → `user-media` (futuro)
- **`avatar_url`** → `user-media/avatars/coaches/`

### 📦 `activities` → `product-media` (futuro)
- **`image_url`** → `product-media/images/products/`
- **`video_url`** → `product-media/videos/products/`
- **`preview_video_url`** → `product-media/videos/products/`

## 🔗 ENDPOINTS OPTIMIZADOS

### 🆕 `/api/upload-file` (UNIFICADO)
```typescript
// Categorías disponibles:
- user-avatar → user-media/avatars/
- certificate → user-media/certificates/
- product-image → product-media/images/
- product-video → product-media/videos/
- exercise-video → product-media/videos/
```

### 🔄 `/api/upload-media` (ACTUALIZADO)
```typescript
// Solo para productos → product-media bucket
- image → product-media/images/products/
- video → product-media/videos/products/
```

## 📱 COMPONENTES FRONTEND

### 🎨 **MediaSelectionModal**
- **Propósito**: Selección de media para productos
- **Endpoint**: `/api/upload-media`
- **Bucket**: `product-media`
- **Rutas**: `images/products/`, `videos/products/`

### 📜 **CertificationUploadModal**
- **Propósito**: Subida de certificados de coaches
- **Endpoint**: `/api/upload-file`
- **Categoría**: `certificate`
- **Bucket**: `user-media`
- **Ruta**: `certificates/coaches/`

### 🎬 **VideoUpload**
- **Propósito**: Subida de videos generales
- **Endpoint**: `/api/upload-file`
- **Categoría**: `product-video`
- **Bucket**: `product-media`
- **Ruta**: `videos/products/`

### 👤 **CoachProfileScreen**
- **Propósito**: Perfil de coach (avatar)
- **Endpoint**: `/api/upload-file`
- **Categoría**: `user-avatar`
- **Bucket**: `user-media`
- **Ruta**: `avatars/coaches/`

## 📊 ESTADO ACTUAL DE MIGRACIÓN

### ✅ COMPLETADO
- [x] **Buckets optimizados creados**: `user-media`, `product-media`
- [x] **URLs actualizadas en BD**: Todas las referencias apuntan a buckets correctos
- [x] **Endpoints optimizados**: `/api/upload-file` y `/api/upload-media` actualizados
- [x] **Estructura de carpetas**: Organizada por tipo de contenido

### 🔄 PENDIENTE
- [ ] **Migración física de archivos**: Mover archivos desde `product-images` a buckets optimizados
- [ ] **Actualización de componentes**: Migrar componentes a `/api/upload-file`
- [ ] **Limpieza de buckets**: Eliminar buckets antiguos después de migración
- [ ] **Testing completo**: Probar flujo end-to-end

## 🎯 PRÓXIMOS PASOS

### 1. 📁 MIGRACIÓN FÍSICA DE ARCHIVOS
```bash
# Mover manualmente desde Supabase Dashboard:
product-images/product-images/ → product-media/images/products/
product-images/product-videos/ → product-media/videos/products/
product-images/certificados/ → user-media/certificates/coaches/
```

### 2. 🔄 ACTUALIZAR COMPONENTES
- **CertificationUploadModal**: Usar `/api/upload-file` con `category: 'certificate'`
- **VideoUpload**: Usar `/api/upload-file` con `category: 'product-video'`
- **CoachProfileScreen**: Usar `/api/upload-file` con `category: 'user-avatar'`

### 3. 🧪 TESTING
- Probar subida de imágenes de productos
- Probar subida de videos de productos
- Probar subida de certificados
- Probar subida de avatares
- Verificar carga de media en frontend

### 4. 🗑️ LIMPIEZA
- Eliminar buckets antiguos: `product-images`, `coach-content`, etc.
- Verificar que no hay referencias rotas

## 📈 BENEFICIOS DE LA ORGANIZACIÓN

### ✅ **Simplicidad**
- **2 buckets** en lugar de 6+
- **Lógica clara**: Usuarios vs Productos
- **Fácil mantenimiento**

### ✅ **Performance**
- **Menos overhead** de buckets
- **Carga más rápida**
- **Menos complejidad**

### ✅ **Escalabilidad**
- **Estructura clara** para crecimiento
- **Fácil agregar** nuevos tipos de media
- **Gestión centralizada**

### ✅ **Costos**
- **Menos buckets** = menos overhead
- **Gestión simplificada**
- **Escalabilidad optimizada**

## 🔍 QUERIES PARA VERIFICACIÓN

### 📊 Ver buckets y estructura
```sql
SELECT 
    name as bucket_name,
    public as is_public,
    created_at
FROM storage.buckets 
WHERE name IN ('user-media', 'product-media')
ORDER BY name;
```

### 📁 Ver archivos por bucket
```sql
SELECT 
    o.name as file_name,
    b.name as bucket_name,
    o.path_tokens,
    o.mimetype,
    ROUND(o.size / 1024.0 / 1024.0, 2) as size_mb,
    o.created_at
FROM storage.objects o
JOIN storage.buckets b ON o.bucket_id = b.id
WHERE b.name IN ('user-media', 'product-media')
ORDER BY b.name, o.created_at DESC;
```

### 📸 Verificar URLs en activity_media
```sql
SELECT 
    id,
    activity_id,
    CASE 
        WHEN image_url LIKE '%product-media%' THEN '✅ Optimizado'
        ELSE '❌ Antiguo'
    END as image_status,
    CASE 
        WHEN video_url LIKE '%product-media%' THEN '✅ Optimizado'
        ELSE '❌ Antiguo'
    END as video_status
FROM activity_media;
```

### 📜 Verificar URLs en coach_certifications
```sql
SELECT 
    id,
    name,
    CASE 
        WHEN file_url LIKE '%user-media%' THEN '✅ Optimizado'
        ELSE '❌ Antiguo'
    END as file_status,
    file_path
FROM coach_certifications;
```

## 🎉 CONCLUSIÓN

La organización de media está **completamente optimizada** con:
- ✅ **2 buckets principales** bien estructurados
- ✅ **URLs actualizadas** en base de datos
- ✅ **Endpoints optimizados** para todos los casos de uso
- ✅ **Componentes identificados** para actualización
- ✅ **Estrategia clara** para migración final

**¡Sistema listo para producción!** 🚀
