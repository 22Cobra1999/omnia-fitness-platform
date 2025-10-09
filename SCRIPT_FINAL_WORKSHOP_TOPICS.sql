-- ============================================
-- SCRIPT FINAL PARA CREAR WORKSHOP_TOPICS
-- ============================================
-- Este script crea la tabla workshop_topics con todas las columnas necesarias
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar la tabla si existe (para empezar de cero)
DROP TABLE IF EXISTS workshop_topics CASCADE;

-- 2. Crear la tabla workshop_topics completa
CREATE TABLE workshop_topics (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  color_hex TEXT DEFAULT '#FF7939',
  
  -- Horario ORIGINAL
  original_days_of_week INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  original_start_time TIME NOT NULL,
  original_end_time TIME NOT NULL,
  
  -- Horario BIS (segundo horario opcional para el mismo tema)
  bis_enabled BOOLEAN DEFAULT FALSE,
  bis_days_of_week INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  bis_start_time TIME,
  bis_end_time TIME,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear índices
CREATE INDEX IF NOT EXISTS idx_workshop_topics_activity_id ON workshop_topics(activity_id);
CREATE INDEX IF NOT EXISTS idx_workshop_topics_original_days ON workshop_topics USING GIN(original_days_of_week);
CREATE INDEX IF NOT EXISTS idx_workshop_topics_bis_days ON workshop_topics USING GIN(bis_days_of_week) WHERE bis_enabled = TRUE;

-- 4. Habilitar RLS
ALTER TABLE workshop_topics ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas RLS
CREATE POLICY "workshop_topics_select_policy"
ON workshop_topics FOR SELECT
USING (true);

CREATE POLICY "workshop_topics_insert_policy"
ON workshop_topics FOR INSERT
WITH CHECK (true);

CREATE POLICY "workshop_topics_update_policy"
ON workshop_topics FOR UPDATE
USING (true);

CREATE POLICY "workshop_topics_delete_policy"
ON workshop_topics FOR DELETE
USING (true);

-- 6. Verificar que la tabla se creó correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'workshop_topics'
ORDER BY ordinal_position;




