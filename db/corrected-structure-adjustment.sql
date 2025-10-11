-- Script corregido para ajustar la estructura del sistema
-- EJECUTAR EN SUPABASE SQL EDITOR

-- PASO 1: Eliminar tabla periodos_asignados existente
DROP TABLE IF EXISTS periodos_asignados CASCADE;

-- PASO 2: Crear tabla con estructura correcta
CREATE TABLE periodos_asignados (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    numero_periodo INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraint para evitar duplicados
    UNIQUE(activity_id, numero_periodo)
);

-- PASO 3: Crear índices para optimizar consultas
CREATE INDEX idx_periodos_asignados_activity_id ON periodos_asignados(activity_id);
CREATE INDEX idx_periodos_asignados_numero_periodo ON periodos_asignados(activity_id, numero_periodo);
CREATE INDEX idx_periodos_asignados_fechas ON periodos_asignados(fecha_inicio, fecha_fin);

-- PASO 4: Insertar datos de ejemplo para actividad 59
INSERT INTO periodos_asignados (
    activity_id,
    numero_periodo,
    fecha_inicio,
    fecha_fin,
    created_by
) VALUES (
    59,
    1,
    '2024-01-01',
    '2024-01-31',
    'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
);

-- PASO 5: Insertar ejecuciones de ejemplo (SIN created_by)
INSERT INTO ejecuciones_ejercicio (
    periodo_id,
    ejercicio_id,
    intensidad_aplicada,
    completado,
    nota_cliente,
    nota_coach
) 
SELECT 
    pa.id as periodo_id,
    ed.id as ejercicio_id,
    'Principiante' as intensidad_aplicada,
    false as completado,
    null as nota_cliente,
    null as nota_coach
FROM periodos_asignados pa
CROSS JOIN ejercicios_detalles ed
WHERE pa.activity_id = 59 
    AND ed.activity_id = 59
    AND pa.numero_periodo = 1;

-- PASO 6: Verificar resultado
SELECT 
    'PERIODOS CREADOS' as seccion,
    id,
    activity_id,
    numero_periodo,
    fecha_inicio,
    fecha_fin
FROM periodos_asignados
WHERE activity_id = 59;

SELECT 
    'EJECUCIONES CREADAS' as seccion,
    COUNT(*) as total_ejecuciones,
    COUNT(CASE WHEN completado THEN 1 END) as completadas,
    COUNT(CASE WHEN NOT completado THEN 1 END) as pendientes
FROM ejecuciones_ejercicio ee
JOIN periodos_asignados pa ON ee.periodo_id = pa.id
WHERE pa.activity_id = 59;

-- PASO 7: Verificar estructura final
SELECT 
    'ESTRUCTURA FINAL PERIODOS_ASIGNADOS' as seccion,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'periodos_asignados'
ORDER BY ordinal_position;

SELECT 
    'ESTRUCTURA FINAL EJECUCIONES_EJERCICIO' as seccion,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ejecuciones_ejercicio'
ORDER BY ordinal_position;








































