-- Script completo para ajustar la estructura del sistema
-- EJECUTAR EN SUPABASE SQL EDITOR

-- PASO 1: Eliminar tabla periodos_asignados existente
DROP TABLE IF EXISTS periodos_asignados CASCADE;

-- PASO 2: Crear tabla periodos_asignados con estructura correcta
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

-- PASO 3: Agregar columna client_id a ejecuciones_ejercicio
ALTER TABLE ejecuciones_ejercicio 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- PASO 4: Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_periodos_asignados_activity_id ON periodos_asignados(activity_id);
CREATE INDEX IF NOT EXISTS idx_periodos_asignados_numero_periodo ON periodos_asignados(activity_id, numero_periodo);
CREATE INDEX IF NOT EXISTS idx_periodos_asignados_fechas ON periodos_asignados(fecha_inicio, fecha_fin);

CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_client_id ON ejecuciones_ejercicio(client_id);
CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_periodo_id ON ejecuciones_ejercicio(periodo_id);
CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_ejercicio_id ON ejecuciones_ejercicio(ejercicio_id);

-- PASO 5: Insertar datos de ejemplo para actividad 59
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

-- PASO 6: Insertar ejecuciones de ejemplo CON client_id
INSERT INTO ejecuciones_ejercicio (
    periodo_id,
    ejercicio_id,
    client_id,
    intensidad_aplicada,
    completado,
    nota_cliente,
    nota_coach
) 
SELECT 
    pa.id as periodo_id,
    ed.id as ejercicio_id,
    'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f' as client_id, -- Usar el mismo ID como ejemplo
    'Principiante' as intensidad_aplicada,
    false as completado,
    null as nota_cliente,
    null as nota_coach
FROM periodos_asignados pa
CROSS JOIN ejercicios_detalles ed
WHERE pa.activity_id = 59 
    AND ed.activity_id = 59
    AND pa.numero_periodo = 1;

-- PASO 7: Verificar resultado
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
    COUNT(CASE WHEN NOT completado THEN 1 END) as pendientes,
    COUNT(DISTINCT client_id) as clientes_unicos
FROM ejecuciones_ejercicio ee
JOIN periodos_asignados pa ON ee.periodo_id = pa.id
WHERE pa.activity_id = 59;

-- PASO 8: Verificar estructura final
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

-- PASO 9: Mostrar datos de ejemplo
SELECT 
    'DATOS EJEMPLO EJECUCIONES' as seccion,
    ee.id,
    ee.periodo_id,
    ee.ejercicio_id,
    ee.client_id,
    ee.intensidad_aplicada,
    ee.completado,
    ed.nombre_ejercicio,
    pa.numero_periodo
FROM ejecuciones_ejercicio ee
JOIN ejercicios_detalles ed ON ee.ejercicio_id = ed.id
JOIN periodos_asignados pa ON ee.periodo_id = pa.id
WHERE pa.activity_id = 59
LIMIT 5;


































