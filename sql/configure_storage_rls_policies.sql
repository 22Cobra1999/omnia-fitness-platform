-- ============================================
-- STORAGE RLS POLICIES - Organización por Coach
-- Propósito: Seguridad y control de acceso a archivos en Storage
-- Fecha: 7 de Octubre, 2025
-- ============================================

-- IMPORTANTE: Estas políticas deben ejecutarse en Supabase Dashboard
-- en la sección Storage > Policies, NO en SQL Editor regular

-- ============================================
-- BUCKET: product-media
-- ============================================

-- 1. Eliminar políticas existentes si existen
-- (Ejecutar desde Supabase Dashboard -> Storage -> product-media -> Policies)

-- 2. Policy: Coaches pueden SUBIR archivos a su propia carpeta
-- Name: Coaches can upload to own folder
-- Allowed operation: INSERT
-- Policy definition:
CREATE POLICY "Coaches can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-media' AND
    (storage.foldername(name))[1] = 'coaches' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- 3. Policy: Coaches pueden LEER sus propios archivos
-- Name: Coaches can read own files
-- Allowed operation: SELECT
-- Policy definition:
CREATE POLICY "Coaches can read own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'product-media' AND
    (storage.foldername(name))[1] = 'coaches' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- 4. Policy: Coaches pueden ACTUALIZAR sus propios archivos
-- Name: Coaches can update own files
-- Allowed operation: UPDATE
-- Policy definition:
CREATE POLICY "Coaches can update own files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-media' AND
    (storage.foldername(name))[1] = 'coaches' AND
    (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'product-media' AND
    (storage.foldername(name))[1] = 'coaches' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- 5. Policy: Coaches pueden ELIMINAR sus propios archivos
-- Name: Coaches can delete own files
-- Allowed operation: DELETE
-- Policy definition:
CREATE POLICY "Coaches can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-media' AND
    (storage.foldername(name))[1] = 'coaches' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- 6. Policy: PÚBLICO puede VER archivos (para mostrar productos)
-- Name: Public can view product media
-- Allowed operation: SELECT
-- Policy definition:
CREATE POLICY "Public can view product media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-media');

-- ============================================
-- BUCKET: user-media
-- ============================================

-- 7. Policy: Coaches pueden SUBIR archivos a su carpeta en user-media
-- Name: Coaches can upload to own user folder
-- Allowed operation: INSERT
-- Policy definition:
CREATE POLICY "Coaches can upload to own user folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-media' AND
    (storage.foldername(name))[1] = 'coaches' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- 8. Policy: Coaches pueden LEER sus archivos en user-media
-- Name: Coaches can read own user files
-- Allowed operation: SELECT
-- Policy definition:
CREATE POLICY "Coaches can read own user files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user-media' AND
    (storage.foldername(name))[1] = 'coaches' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- 9. Policy: Coaches pueden ACTUALIZAR sus archivos en user-media
-- Name: Coaches can update own user files
-- Allowed operation: UPDATE
-- Policy definition:
CREATE POLICY "Coaches can update own user files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-media' AND
    (storage.foldername(name))[1] = 'coaches' AND
    (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-media' AND
    (storage.foldername(name))[1] = 'coaches' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- 10. Policy: Coaches pueden ELIMINAR sus archivos en user-media
-- Name: Coaches can delete own user files
-- Allowed operation: DELETE
-- Policy definition:
CREATE POLICY "Coaches can delete own user files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-media' AND
    (storage.foldername(name))[1] = 'coaches' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- ============================================
-- POLÍTICAS PARA ADMINS (OPCIONAL)
-- ============================================

-- 11. Policy: Admins pueden hacer TODO en product-media
CREATE POLICY "Admins full access product media"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'product-media' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- 12. Policy: Admins pueden hacer TODO en user-media
CREATE POLICY "Admins full access user media"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'user-media' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- INSTRUCCIONES DE IMPLEMENTACIÓN
-- ============================================

/*
PASO 1: Ir a Supabase Dashboard
PASO 2: Navegar a Storage -> Policies
PASO 3: Seleccionar bucket "product-media"
PASO 4: Click en "New Policy"
PASO 5: Copiar cada policy de arriba una por una
PASO 6: Repetir para bucket "user-media"

NOTA: Las policies de Storage NO se pueden ejecutar en SQL Editor
      Deben configurarse desde el Dashboard de Storage

VERIFICACIÓN:
- Probar que un coach puede subir a su carpeta
- Probar que un coach NO puede subir a carpeta de otro coach
- Probar que el público puede VER los archivos de product-media
- Probar que los coaches pueden gestionar sus propios archivos
*/

-- ============================================
-- ALTERNATIVA: Políticas Simplificadas
-- ============================================

-- Si las políticas de arriba son muy restrictivas, usar estas:

-- Para product-media: Acceso total autenticado, lectura pública
CREATE POLICY "Authenticated users can manage product media"
  ON storage.objects FOR ALL
  USING (bucket_id = 'product-media' AND auth.role() = 'authenticated');

CREATE POLICY "Public can read product media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-media');

-- Para user-media: Solo acceso autenticado
CREATE POLICY "Authenticated users can manage user media"
  ON storage.objects FOR ALL
  USING (bucket_id = 'user-media' AND auth.role() = 'authenticated');

-- ============================================
-- FIN DE CONFIGURACIÓN
-- ============================================





