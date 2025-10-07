-- Script para corregir las políticas de seguridad de almacenamiento en Supabase

-- 1. Verificar si el esquema storage existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
        RAISE NOTICE 'El esquema storage no existe. Esto es inesperado en una instalación de Supabase.';
        RETURN;
    END IF;
END$$;

-- 2. Desactivar temporalmente RLS para las tablas de storage
ALTER TABLE IF EXISTS storage.buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS storage.objects DISABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas existentes que puedan estar causando conflictos
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual insert access" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual update access" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual delete access" ON storage.objects;
DROP POLICY IF EXISTS "Allow coaches to upload their files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to PDF files" ON storage.objects;
DROP POLICY IF EXISTS "Allow coaches to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow coaches to delete their own files" ON storage.objects;

DROP POLICY IF EXISTS "Allow public bucket creation" ON storage.buckets;
DROP POLICY IF EXISTS "Allow authenticated bucket creation" ON storage.buckets;
DROP POLICY IF EXISTS "Allow individual bucket access" ON storage.buckets;
DROP POLICY IF EXISTS "Allow individual bucket deletion" ON storage.buckets;

-- 4. Crear nuevas políticas más permisivas para buckets
CREATE POLICY "Allow authenticated bucket creation"
ON storage.buckets
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow individual bucket access"
ON storage.buckets
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow public bucket access"
ON storage.buckets
FOR SELECT
TO public
USING (true);

-- 5. Crear nuevas políticas más permisivas para objetos
CREATE POLICY "Allow authenticated object insertion"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow public object access"
ON storage.objects
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow individual object update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow individual object deletion"
ON storage.objects
FOR DELETE
TO authenticated
USING (true);

-- 6. Volver a activar RLS para las tablas de storage
ALTER TABLE IF EXISTS storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- 7. Verificar que el bucket coach-content existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'coach-content') THEN
        -- No podemos crear el bucket aquí porque requiere privilegios especiales
        RAISE NOTICE 'El bucket coach-content no existe. Se creará a través de la API.';
    ELSE
        RAISE NOTICE 'El bucket coach-content ya existe.';
    END IF;
END$$;
