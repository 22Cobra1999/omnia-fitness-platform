-- ============================================
-- TABLA: coach_storage_metadata
-- Propósito: Tracking de inicialización y uso de storage por coach
-- Fecha: 7 de Octubre, 2025
-- ============================================

-- 1. Crear tabla
CREATE TABLE IF NOT EXISTS coach_storage_metadata (
  coach_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  storage_initialized BOOLEAN DEFAULT false,
  initialization_date TIMESTAMPTZ,
  folder_structure JSONB,
  total_files_count INTEGER DEFAULT 0,
  total_storage_bytes BIGINT DEFAULT 0,
  last_upload_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Comentarios en columnas
COMMENT ON TABLE coach_storage_metadata IS 'Metadata de inicialización y uso de storage por coach';
COMMENT ON COLUMN coach_storage_metadata.coach_id IS 'ID del coach (referencia a user_profiles)';
COMMENT ON COLUMN coach_storage_metadata.storage_initialized IS 'Indica si el coach ya tiene su estructura de carpetas creada';
COMMENT ON COLUMN coach_storage_metadata.initialization_date IS 'Fecha de primera inicialización';
COMMENT ON COLUMN coach_storage_metadata.folder_structure IS 'Estructura de carpetas en JSON';
COMMENT ON COLUMN coach_storage_metadata.total_files_count IS 'Cantidad total de archivos subidos';
COMMENT ON COLUMN coach_storage_metadata.total_storage_bytes IS 'Espacio total usado en bytes';
COMMENT ON COLUMN coach_storage_metadata.last_upload_date IS 'Fecha del último archivo subido';

-- 3. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_coach_storage_initialized ON coach_storage_metadata(storage_initialized);
CREATE INDEX IF NOT EXISTS idx_coach_storage_updated ON coach_storage_metadata(updated_at);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE coach_storage_metadata ENABLE ROW LEVEL SECURITY;

-- 5. Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Coaches can view own storage metadata" ON coach_storage_metadata;
DROP POLICY IF EXISTS "Coaches can update own storage metadata" ON coach_storage_metadata;
DROP POLICY IF EXISTS "Coaches can insert own storage metadata" ON coach_storage_metadata;

-- 6. Políticas de seguridad

-- Policy: Coaches pueden VER su propia metadata
CREATE POLICY "Coaches can view own storage metadata"
  ON coach_storage_metadata
  FOR SELECT
  USING (auth.uid() = coach_id);

-- Policy: Coaches pueden INSERTAR su propia metadata
CREATE POLICY "Coaches can insert own storage metadata"
  ON coach_storage_metadata
  FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

-- Policy: Coaches pueden ACTUALIZAR su propia metadata
CREATE POLICY "Coaches can update own storage metadata"
  ON coach_storage_metadata
  FOR UPDATE
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Policy: Admins pueden ver TODA la metadata
CREATE POLICY "Admins can view all storage metadata"
  ON coach_storage_metadata
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- 7. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_coach_storage_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_coach_storage_metadata_updated_at ON coach_storage_metadata;

CREATE TRIGGER trigger_update_coach_storage_metadata_updated_at
  BEFORE UPDATE ON coach_storage_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_storage_metadata_updated_at();

-- 8. Verificación
SELECT 
  'coach_storage_metadata' as tabla,
  COUNT(*) as registros_existentes
FROM coach_storage_metadata;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- ✅ Tabla creada con todas las columnas
-- ✅ RLS habilitado
-- ✅ Políticas configuradas
-- ✅ Índices creados
-- ✅ Trigger para updated_at
-- ============================================





