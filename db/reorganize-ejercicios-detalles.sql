-- Script para reorganizar el sistema de ejercicios
-- Eliminar organizacion_ejercicios y agregar columnas a ejercicios_detalles

-- PASO 1: Agregar columnas necesarias a ejercicios_detalles
DO $$
BEGIN
    -- Agregar columna semana si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ejercicios_detalles' AND column_name='semana') THEN
        ALTER TABLE ejercicios_detalles ADD COLUMN semana INTEGER;
        RAISE NOTICE 'Columna semana agregada a ejercicios_detalles.';
    ELSE
        RAISE NOTICE 'Columna semana ya existe en ejercicios_detalles.';
    END IF;

    -- Agregar columna dia si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ejercicios_detalles' AND column_name='dia') THEN
        ALTER TABLE ejercicios_detalles ADD COLUMN dia INTEGER;
        RAISE NOTICE 'Columna dia agregada a ejercicios_detalles.';
    ELSE
        RAISE NOTICE 'Columna dia ya existe en ejercicios_detalles.';
    END IF;

    -- Agregar columna periodo si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ejercicios_detalles' AND column_name='periodo') THEN
        ALTER TABLE ejercicios_detalles ADD COLUMN periodo INTEGER DEFAULT 1;
        RAISE NOTICE 'Columna periodo agregada a ejercicios_detalles.';
    ELSE
        RAISE NOTICE 'Columna periodo ya existe en ejercicios_detalles.';
    END IF;

    -- Agregar columna bloque si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ejercicios_detalles' AND column_name='bloque') THEN
        ALTER TABLE ejercicios_detalles ADD COLUMN bloque INTEGER DEFAULT 1;
        RAISE NOTICE 'Columna bloque agregada a ejercicios_detalles.';
    ELSE
        RAISE NOTICE 'Columna bloque ya existe en ejercicios_detalles.';
    END IF;

    -- Agregar columna orden si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ejercicios_detalles' AND column_name='orden') THEN
        ALTER TABLE ejercicios_detalles ADD COLUMN orden INTEGER;
        RAISE NOTICE 'Columna orden agregada a ejercicios_detalles.';
    ELSE
        RAISE NOTICE 'Columna orden ya existe en ejercicios_detalles.';
    END IF;
END $$;

-- PASO 2: Migrar datos de organizacion_ejercicios a ejercicios_detalles
DO $$
BEGIN
    -- Actualizar ejercicios_detalles con datos de organizacion_ejercicios
    UPDATE ejercicios_detalles 
    SET 
        semana = oe.semana,
        dia = oe.dia,
        periodo = 1, -- Por defecto, periodo 1
        bloque = COALESCE(oe.bloque, 1),
        orden = COALESCE(oe.orden, (oe.semana - 1) * 7 + oe.dia)
    FROM organizacion_ejercicios oe
    WHERE ejercicios_detalles.id = oe.ejercicio_id;
    
    RAISE NOTICE 'Datos migrados de organizacion_ejercicios a ejercicios_detalles.';
END $$;

-- PASO 3: Agregar constraints y validaciones
DO $$
BEGIN
    -- Constraint para semana válida
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_semana_ejercicios') THEN
        ALTER TABLE ejercicios_detalles ADD CONSTRAINT valid_semana_ejercicios 
        CHECK (semana IS NULL OR semana >= 1);
        RAISE NOTICE 'Constraint valid_semana_ejercicios agregado.';
    END IF;

    -- Constraint para dia válido
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_dia_ejercicios') THEN
        ALTER TABLE ejercicios_detalles ADD CONSTRAINT valid_dia_ejercicios 
        CHECK (dia IS NULL OR (dia >= 1 AND dia <= 7));
        RAISE NOTICE 'Constraint valid_dia_ejercicios agregado.';
    END IF;

    -- Constraint para periodo válido
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_periodo_ejercicios') THEN
        ALTER TABLE ejercicios_detalles ADD CONSTRAINT valid_periodo_ejercicios 
        CHECK (periodo IS NULL OR periodo >= 1);
        RAISE NOTICE 'Constraint valid_periodo_ejercicios agregado.';
    END IF;

    -- Constraint para bloque válido
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_bloque_ejercicios') THEN
        ALTER TABLE ejercicios_detalles ADD CONSTRAINT valid_bloque_ejercicios 
        CHECK (bloque IS NULL OR bloque >= 1);
        RAISE NOTICE 'Constraint valid_bloque_ejercicios agregado.';
    END IF;
END $$;

-- PASO 4: Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_activity_semana ON ejercicios_detalles(activity_id, semana);
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_activity_dia ON ejercicios_detalles(activity_id, dia);
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_activity_periodo ON ejercicios_detalles(activity_id, periodo);
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_activity_orden ON ejercicios_detalles(activity_id, orden);
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_activity_semana_dia ON ejercicios_detalles(activity_id, semana, dia);

-- PASO 5: Verificar estructura actualizada
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'ejercicios_detalles' 
    AND column_name IN ('semana', 'dia', 'periodo', 'bloque', 'orden')
ORDER BY 
    ordinal_position;

-- PASO 6: Verificar datos migrados
SELECT 
    activity_id,
    COUNT(*) as total_ejercicios,
    MIN(semana) as semana_min,
    MAX(semana) as semana_max,
    COUNT(DISTINCT semana) as semanas_unicas,
    COUNT(DISTINCT dia) as dias_unicos,
    COUNT(DISTINCT periodo) as periodos_unicos
FROM ejercicios_detalles 
WHERE activity_id = 59
GROUP BY activity_id;

-- PASO 7: Mostrar ejemplo de datos
SELECT 
    id,
    activity_id,
    nombre_ejercicio,
    semana,
    dia,
    periodo,
    bloque,
    orden,
    intensidad,
    calorias
FROM ejercicios_detalles 
WHERE activity_id = 59
ORDER BY semana, dia, orden
LIMIT 10;

































