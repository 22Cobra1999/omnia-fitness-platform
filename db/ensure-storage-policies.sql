-- Verificar y configurar políticas de almacenamiento para PDFs

-- Verificar si existe el bucket coach-content
DO $$
BEGIN
    -- Esta consulta es solo para verificación, no tiene efecto directo
    PERFORM 1 FROM storage.buckets WHERE name = 'coach-content';
    
    -- No podemos crear el bucket aquí porque requiere privilegios de superusuario
    -- La creación del bucket se hará desde la API
    
    RAISE NOTICE 'Verificación de bucket coach-content completada';
END $$;

-- Crear o reemplazar políticas para el bucket coach-content
BEGIN;
    -- Política para permitir a los usuarios subir archivos a su carpeta
    DROP POLICY IF EXISTS "Allow coaches to upload their files" ON storage.objects;
    CREATE POLICY "Allow coaches to upload their files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'coach-content' AND (storage.foldername(name))[1] = 'pdfs');

    -- Política para permitir a los usuarios ver archivos
    DROP POLICY IF EXISTS "Allow public access to PDF files" ON storage.objects;
    CREATE POLICY "Allow public access to PDF files"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'coach-content' AND (storage.foldername(name))[1] = 'pdfs');
    
    -- Política para permitir actualizaciones
    DROP POLICY IF EXISTS "Allow coaches to update their own files" ON storage.objects;
    CREATE POLICY "Allow coaches to update their own files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'coach-content' AND auth.uid()::text = (storage.foldername(name))[2]);
    
    -- Política para eliminar
    DROP POLICY IF EXISTS "Allow coaches to delete their own files" ON storage.objects;
    CREATE POLICY "Allow coaches to delete their own files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'coach-content' AND auth.uid()::text = (storage.foldername(name))[2]);
    
    RAISE NOTICE 'Políticas de almacenamiento actualizadas correctamente';
COMMIT;
