-- Script para agregar client_id a ejecuciones_ejercicio
-- EJECUTAR EN SUPABASE SQL EDITOR

-- PASO 1: Agregar columna client_id a ejecuciones_ejercicio
ALTER TABLE ejecuciones_ejercicio 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- PASO 2: Crear índice para optimizar consultas por cliente
CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_client_id ON ejecuciones_ejercicio(client_id);

-- PASO 3: Verificar que la columna se agregó correctamente
SELECT 
    'ESTRUCTURA EJECUCIONES_EJERCICIO CON CLIENT_ID' as seccion,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ejecuciones_ejercicio'
ORDER BY ordinal_position;

-- PASO 4: Verificar datos existentes
SELECT 
    'DATOS EXISTENTES EN EJECUCIONES_EJERCICIO' as seccion,
    COUNT(*) as total_registros,
    COUNT(client_id) as con_client_id,
    COUNT(*) - COUNT(client_id) as sin_client_id
FROM ejecuciones_ejercicio;

































