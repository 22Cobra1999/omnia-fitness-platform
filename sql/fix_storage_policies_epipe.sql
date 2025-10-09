-- ============================================
-- SOLUCIÓN AL ERROR EPIPE/UND_ERR_SOCKET
-- Propósito: Configurar Storage Policies para permitir upload de videos
-- Fecha: 8 de Octubre, 2025
-- EJECUTAR EN: Supabase Dashboard → SQL Editor
-- ============================================

-- Paso 1: Habilitar RLS en storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Paso 2: Eliminar políticas existentes (si existen)
DROP POLICY IF EXISTS "Coaches can manage their own product media" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can manage their own user media" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for product-media" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for user-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload to their coach folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view their coach folder" ON storage.objects;

-- Paso 3: Crear política para que coaches puedan SUBIR archivos a SUS carpetas
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

-- Paso 4: Crear política para acceso público de LECTURA
CREATE POLICY "Public read access for product-media"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-media');

-- Paso 5: Verificar que las políticas se crearon correctamente
SELECT 
  policyname, 
  cmd as "Operación",
  roles as "Roles",
  CASE 
    WHEN qual IS NOT NULL THEN 'USING definido'
    ELSE 'Sin USING'
  END as "USING",
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK definido'
    ELSE 'Sin WITH CHECK'
  END as "WITH CHECK"
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- ============================================
-- RESULTADO ESPERADO:
-- 
-- Deberías ver 2 políticas:
-- 1. "Coaches can manage their own product media" (ALL, authenticated)
-- 2. "Public read access for product-media" (SELECT, anon/authenticated)
-- ============================================

-- ============================================
-- NOTA IMPORTANTE:
-- 
-- Si ves el error: "Bucket not found"
-- Ve a: Supabase Dashboard → Storage → Create New Bucket
-- Nombre: product-media
-- Public: YES
-- File size limit: 50 MB
-- Allowed MIME types: image/*, video/*
-- ============================================





