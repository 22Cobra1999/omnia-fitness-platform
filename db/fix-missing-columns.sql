-- Script para agregar columnas faltantes a las tablas
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Agregar columnas faltantes a la tabla user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client',
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS coach_rating NUMERIC(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_coach_reviews INTEGER DEFAULT 0;

-- 2. Agregar columnas faltantes a la tabla coaches
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS experience_years INTEGER,
ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS instagram TEXT;

-- 3. Eliminar vistas existentes si existen y recrear activity_stats_view
DROP VIEW IF EXISTS activity_stats_view;
CREATE VIEW activity_stats_view AS
SELECT 
    a.id as activity_id,
    COALESCE(AVG(acs.difficulty_rating), 0.00) as avg_rating,
    COALESCE(COUNT(acs.id), 0) as total_reviews
FROM activities a
LEFT JOIN activity_surveys acs ON acs.activity_id = a.id
GROUP BY a.id;

-- 4. Eliminar vistas existentes si existen y recrear coach_stats_view
DROP VIEW IF EXISTS coach_stats_view;
CREATE VIEW coach_stats_view AS
SELECT 
    a.coach_id,
    COALESCE(AVG(acs.coach_method_rating), 0.00) as avg_rating,
    COALESCE(COUNT(acs.id), 0) as total_reviews
FROM activities a
LEFT JOIN activity_surveys acs ON acs.activity_id = a.id
WHERE a.coach_id IS NOT NULL
GROUP BY a.coach_id;
