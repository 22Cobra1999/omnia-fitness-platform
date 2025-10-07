-- Script para ajustar las tablas según la nueva estructura definida
-- Basado en la estructura requerida por el usuario

-- PASO 1: Ajustar tabla periodos_asignados
-- La estructura debe ser: ID de fila, ID de actividad, número de periodo, fecha de inicio, fecha de fin

-- Primero, verificar si la tabla existe y su estructura actual
DO $$
BEGIN
    -- Si la tabla no tiene las columnas correctas, la recreamos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'periodos_asignados' 
        AND column_name = 'activity_id'
    ) THEN
        -- Eliminar tabla existente si no tiene la estructura correcta
        DROP TABLE IF EXISTS periodos_asignados CASCADE;
        
        -- Crear tabla con la estructura correcta
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
        
        RAISE NOTICE 'Tabla periodos_asignados creada con estructura correcta.';
    ELSE
        RAISE NOTICE 'Tabla periodos_asignados ya tiene la estructura correcta.';
    END IF;
END $$;

-- PASO 2: Ajustar tabla ejecuciones_ejercicio
-- La estructura debe ser: ID de fila, ID de periodo, ID de ejercicio, intensidad aplicada, completado, nota cliente, nota coach

DO $$
BEGIN
    -- Si la tabla no tiene las columnas correctas, la recreamos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ejecuciones_ejercicio' 
        AND column_name = 'periodo_id'
    ) THEN
        -- Eliminar tabla existente si no tiene la estructura correcta
        DROP TABLE IF EXISTS ejecuciones_ejercicio CASCADE;
        
        -- Crear tabla con la estructura correcta
        CREATE TABLE ejecuciones_ejercicio (
            id SERIAL PRIMARY KEY,
            periodo_id INTEGER NOT NULL REFERENCES periodos_asignados(id) ON DELETE CASCADE,
            ejercicio_id INTEGER NOT NULL REFERENCES ejercicios_detalles(id) ON DELETE CASCADE,
            intensidad_aplicada TEXT NOT NULL DEFAULT 'Principiante',
            completado BOOLEAN DEFAULT false,
            nota_cliente TEXT,
            nota_coach TEXT,
            fecha_ejecucion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id),
            
            -- Constraint para evitar duplicados
            UNIQUE(periodo_id, ejercicio_id, intensidad_aplicada)
        );
        
        RAISE NOTICE 'Tabla ejecuciones_ejercicio creada con estructura correcta.';
    ELSE
        RAISE NOTICE 'Tabla ejecuciones_ejercicio ya tiene la estructura correcta.';
    END IF;
END $$;

-- PASO 3: Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_periodos_asignados_activity_id ON periodos_asignados(activity_id);
CREATE INDEX IF NOT EXISTS idx_periodos_asignados_numero_periodo ON periodos_asignados(activity_id, numero_periodo);
CREATE INDEX IF NOT EXISTS idx_periodos_asignados_fechas ON periodos_asignados(fecha_inicio, fecha_fin);

CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_periodo_id ON ejecuciones_ejercicio(periodo_id);
CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_ejercicio_id ON ejecuciones_ejercicio(ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_completado ON ejecuciones_ejercicio(completado);
CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_intensidad ON ejecuciones_ejercicio(intensidad_aplicada);

-- PASO 4: Verificar estructura final
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

-- PASO 5: Crear datos de ejemplo para probar
-- Insertar un período de ejemplo para la actividad 59
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
) ON CONFLICT (activity_id, numero_periodo) DO NOTHING;

-- Insertar ejecuciones de ejemplo
INSERT INTO ejecuciones_ejercicio (
    periodo_id,
    ejercicio_id,
    intensidad_aplicada,
    completado,
    nota_cliente,
    nota_coach,
    created_by
) 
SELECT 
    pa.id as periodo_id,
    ed.id as ejercicio_id,
    'Principiante' as intensidad_aplicada,
    false as completado,
    null as nota_cliente,
    null as nota_coach,
    'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f' as created_by
FROM periodos_asignados pa
CROSS JOIN ejercicios_detalles ed
WHERE pa.activity_id = 59 
    AND ed.activity_id = 59
    AND pa.numero_periodo = 1
ON CONFLICT (periodo_id, ejercicio_id, intensidad_aplicada) DO NOTHING;

-- PASO 6: Verificar datos insertados
SELECT 
    'DATOS PERIODOS_ASIGNADOS' as seccion,
    id,
    activity_id,
    numero_periodo,
    fecha_inicio,
    fecha_fin
FROM periodos_asignados
WHERE activity_id = 59;

SELECT 
    'DATOS EJECUCIONES_EJERCICIO' as seccion,
    COUNT(*) as total_ejecuciones,
    COUNT(CASE WHEN completado THEN 1 END) as completadas,
    COUNT(CASE WHEN NOT completado THEN 1 END) as pendientes
FROM ejecuciones_ejercicio ee
JOIN periodos_asignados pa ON ee.periodo_id = pa.id
WHERE pa.activity_id = 59;



































