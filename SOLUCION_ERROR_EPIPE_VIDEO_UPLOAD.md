# 🔧 Solución al Error EPIPE al Subir Videos

## ❌ Problema

Al intentar subir videos, se produce el siguiente error:

```
Error [StorageUnknownError]: fetch failed
  code: 'UND_ERR_SOCKET'
  Error: other side closed
```

**Causa:** Supabase Storage está cerrando la conexión porque **faltan las Storage Policies** necesarias.

---

## ✅ Solución

### Paso 1: Ejecutar SQL en Supabase

Ve a **Supabase Dashboard** → **SQL Editor** y ejecuta el siguiente script:

```sql
-- ============================================
-- RLS POLICIES PARA SUPABASE STORAGE BUCKETS
-- Propósito: Permitir que los coaches suban archivos a sus carpetas
-- Fecha: 8 de Octubre, 2025
-- ============================================

-- 1. Habilitar RLS en storage.objects si no está habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Coaches can manage their own product media" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can manage their own user media" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for product-media" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for user-media" ON storage.objects;

-- 3. Política para que los coaches puedan subir Y gestionar sus propios archivos en 'product-media'
CREATE POLICY "Coaches can manage their own product media"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'product-media'
  AND (storage.foldername(name))[1] = 'coaches'
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'product-media'
  AND (storage.foldername(name))[1] = 'coaches'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 4. Política para acceso de lectura público a 'product-media' (para mostrar productos)
CREATE POLICY "Public read access for product-media"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-media');

-- 5. VERIFICACIÓN: Listar todas las políticas de storage.objects
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';
```

### Paso 2: Verificar que el bucket existe

En **Supabase Dashboard** → **Storage**:

1. Verifica que existe el bucket `product-media`
2. Si no existe, créalo:
   - Click en **"New bucket"**
   - Nombre: `product-media`
   - Public bucket: **SÍ** ✅
   - File size limit: `50 MB` (para videos)
   - Allowed MIME types: `image/*, video/*`

### Paso 3: Probar nuevamente

1. Recarga la aplicación
2. Intenta subir un video nuevamente
3. Ahora debería funcionar correctamente

---

## 🔍 Cómo Verificar que Funcionó

### Backend (Logs del servidor)

Deberías ver en los logs:

```
✅ UPLOAD-ORGANIZED: video subido exitosamente
✅ UPLOAD-ORGANIZED: URL generada: https://...
📊 UPLOAD-ORGANIZED: Metadata actualizada: { archivos: 5, bytes: 4980766, mb: '4.75' }
```

### Frontend (Consola del navegador)

Deberías ver:

```
✅ Video subido exitosamente: https://mgrfswrsvrzwtgilssad.supabase.co/storage/v1/object/public/product-media/coaches/.../videos/...
```

---

## 📊 Estructura de Archivos Resultante

Después de configurar las políticas, los archivos se organizarán así:

```
product-media/
└── coaches/
    └── {coach_id}/
        ├── images/
        │   ├── 1759935562783_fitness.jpg
        │   └── 1759934470633_ronald.jpg
        └── videos/
            └── 1759935564701_Nike_-_Running_Isn_t_Just_Running___Spec_Ad.mp4
```

---

## ⚠️ Errores Comunes

### Error: "Policy already exists"

**Solución:** El script ya incluye `DROP POLICY IF EXISTS`, simplemente vuelve a ejecutarlo.

### Error: "Bucket not found"

**Solución:** Crea el bucket `product-media` manualmente (ver Paso 2).

### Error: "RLS not enabled"

**Solución:** El script ya incluye `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY`.

---

## 🎯 Resumen

El error **UND_ERR_SOCKET** ocurre porque:

1. ❌ Supabase Storage **no tiene políticas configuradas**
2. ❌ Cuando intentas subir un archivo, Supabase **cierra la conexión** por seguridad
3. ✅ **Solución:** Ejecutar el script SQL para crear las políticas necesarias

**Después de ejecutar el script SQL, el upload de videos funcionará correctamente.**





