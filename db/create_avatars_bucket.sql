-- =====================================================
-- POLICIES PARA AVATARES EN BUCKET product-media
-- =====================================================

-- NOTA: Usamos el bucket existente 'product-media' 
-- con la carpeta 'avatars/' para los avatares de usuarios

-- 1. Verificar que el bucket product-media existe
-- =====================================================
SELECT * FROM storage.buckets WHERE id = 'product-media';

-- 2. Habilitar RLS en storage.objects
-- =====================================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar policies existentes si existen
-- =====================================================
DROP POLICY IF EXISTS "Usuarios pueden ver avatares en product-media" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden subir su propio avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar su propio avatar" ON storage.objects;

-- 4. Policy: Ver avatares en product-media (público)
-- =====================================================
CREATE POLICY "Usuarios pueden ver avatares en product-media"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'product-media' 
    AND name LIKE 'avatars/%'
);

-- 5. Policy: Subir avatar (solo su propio archivo)
-- =====================================================
-- Path esperado: avatars/{user_id}.{ext}
CREATE POLICY "Usuarios pueden subir su propio avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'product-media' 
    AND name ~ ('^avatars/' || auth.uid()::text || '\.(jpg|jpeg|png|webp)$')
);

-- 6. Policy: Actualizar avatar (solo el suyo)
-- =====================================================
CREATE POLICY "Usuarios pueden actualizar su propio avatar"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'product-media' 
    AND name ~ ('^avatars/' || auth.uid()::text || '\.(jpg|jpeg|png|webp)$')
)
WITH CHECK (
    bucket_id = 'product-media' 
    AND name ~ ('^avatars/' || auth.uid()::text || '\.(jpg|jpeg|png|webp)$')
);

-- 7. Policy: Eliminar avatar (solo el suyo)
-- =====================================================
CREATE POLICY "Usuarios pueden eliminar su propio avatar"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'product-media' 
    AND name ~ ('^avatars/' || auth.uid()::text || '\.(jpg|jpeg|png|webp)$')
);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver bucket product-media
SELECT * FROM storage.buckets WHERE id = 'product-media';

-- Ver policies creadas para avatares
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%avatar%';

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================

-- Estructura de carpetas en product-media:
-- product-media/
--   └── avatars/
--       ├── {user_id_1}.jpg
--       ├── {user_id_2}.png
--       └── {user_id_3}.webp

-- Ejemplo de path:
-- avatars/00dedc23-0b17-4e50-b84e-b2e8100dc93c.jpg

-- URL pública generada:
-- https://{project}.supabase.co/storage/v1/object/public/product-media/avatars/{user_id}.{ext}

-- Ventajas:
-- ✅ Un solo archivo por usuario
-- ✅ Fácil identificación: nombre = user_id
-- ✅ Reemplazo automático con upsert: true
-- ✅ No requiere asignar permisos por usuario
-- ✅ RLS controla que solo edite el suyo

-- =====================================================
-- TESTING
-- =====================================================

-- Probar que el regex funciona para un user_id específico
-- Ejemplo: avatars/00dedc23-0b17-4e50-b84e-b2e8100dc93c.jpg

SELECT 
    'avatars/00dedc23-0b17-4e50-b84e-b2e8100dc93c.jpg' ~ ('^avatars/' || '00dedc23-0b17-4e50-b84e-b2e8100dc93c' || '\.(jpg|jpeg|png|webp)$') 
AS match_correcto;
-- Debe retornar: true

SELECT 
    'avatars/otro-usuario-id.jpg' ~ ('^avatars/' || '00dedc23-0b17-4e50-b84e-b2e8100dc93c' || '\.(jpg|jpeg|png|webp)$') 
AS match_incorrecto;
-- Debe retornar: false

-- =====================================================
-- LIMPIEZA (solo para desarrollo)
-- =====================================================

-- Para eliminar policies de avatares:
/*
DROP POLICY IF EXISTS "Usuarios pueden ver avatares en product-media" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden subir su propio avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar su propio avatar" ON storage.objects;
*/

