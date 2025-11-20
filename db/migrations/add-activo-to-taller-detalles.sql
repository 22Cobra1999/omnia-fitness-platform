-- ================================================
-- AGREGAR COLUMNA 'activo' A taller_detalles
-- ================================================
-- Esta columna indica si el taller está activo para nuevas ventas
-- Todos los temas de un taller deben tener el mismo valor de 'activo'
-- Cuando la última fecha del último tema ya pasó, se marca automáticamente como false

-- PASO 1: Agregar columna 'activo' a taller_detalles
-- ================================================
DO $$ 
BEGIN
    -- Agregar columna 'activo' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'taller_detalles' 
        AND column_name = 'activo'
    ) THEN
        ALTER TABLE taller_detalles 
        ADD COLUMN activo BOOLEAN DEFAULT TRUE NOT NULL;
        
        COMMENT ON COLUMN taller_detalles.activo IS 
        'Indica si el taller está activo para nuevas ventas. Todos los temas de un taller deben tener el mismo valor. Se actualiza automáticamente cuando la última fecha ya pasó.';
        
        RAISE NOTICE '✅ Columna activo agregada a taller_detalles';
    ELSE
        RAISE NOTICE 'ℹ️ Columna activo ya existe en taller_detalles';
    END IF;
END $$;

-- PASO 2: Crear índice para optimizar consultas
-- ================================================
CREATE INDEX IF NOT EXISTS idx_taller_detalles_activo 
ON taller_detalles(activo);

CREATE INDEX IF NOT EXISTS idx_taller_detalles_actividad_activo 
ON taller_detalles(actividad_id, activo);

-- PASO 3: Crear función para actualizar el estado 'activo' de todos los temas de un taller
-- ================================================
CREATE OR REPLACE FUNCTION update_taller_activo_status(
    p_actividad_id INTEGER,
    p_activo BOOLEAN
) RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    -- Actualizar todos los temas del taller con el mismo valor de 'activo'
    UPDATE taller_detalles
    SET activo = p_activo,
        updated_at = NOW()
    WHERE actividad_id = p_actividad_id;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_taller_activo_status IS 
'Actualiza el estado activo de todos los temas de un taller. Todos los temas deben tener el mismo valor.';

-- PASO 4: Inicializar valores de 'activo' basándose en fechas existentes
-- ================================================
-- Para talleres existentes, verificar si tienen fechas futuras
DO $$
DECLARE
    v_taller RECORD;
    v_all_dates DATE[];
    v_last_date DATE;
    v_activo BOOLEAN;
    v_now DATE := CURRENT_DATE;
BEGIN
    -- Para cada actividad de tipo 'workshop'
    FOR v_taller IN 
        SELECT DISTINCT actividad_id 
        FROM taller_detalles
    LOOP
        -- Extraer todas las fechas de todos los temas del taller
        SELECT ARRAY_AGG(DISTINCT fecha::DATE)
        INTO v_all_dates
        FROM taller_detalles,
        LATERAL jsonb_array_elements(originales->'fechas_horarios') AS horario,
        LATERAL (SELECT (horario->>'fecha')::DATE AS fecha) AS fecha_extract
        WHERE actividad_id = v_taller.actividad_id
        AND horario->>'fecha' IS NOT NULL;
        
        -- Si hay fechas, obtener la última
        IF v_all_dates IS NOT NULL AND array_length(v_all_dates, 1) > 0 THEN
            SELECT MAX(fecha) INTO v_last_date
            FROM unnest(v_all_dates) AS fecha;
            
            -- Si la última fecha es mayor o igual a hoy, está activo
            v_activo := v_last_date >= v_now;
        ELSE
            -- Si no hay fechas, marcar como inactivo
            v_activo := FALSE;
        END IF;
        
        -- Actualizar todos los temas del taller
        PERFORM update_taller_activo_status(v_taller.actividad_id, v_activo);
        
        RAISE NOTICE 'Taller %: última fecha = %, activo = %', 
            v_taller.actividad_id, 
            COALESCE(v_last_date::TEXT, 'sin fechas'), 
            v_activo;
    END LOOP;
END $$;

-- PASO 5: Verificar estructura final
-- ================================================
SELECT 
    'ESTRUCTURA taller_detalles (columna activo)' AS seccion,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'taller_detalles'
AND column_name = 'activo';























