-- Migration to add computed statistics columns to activities table
-- and populate them with correct values based on planificacion_ejercicios

-- 1. Add columns if they don't exist
DO $$
BEGIN
    -- semanas_totales
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'semanas_totales') THEN
        ALTER TABLE activities ADD COLUMN semanas_totales INTEGER DEFAULT 0;
    END IF;

    -- sesiones_dias_totales
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'sesiones_dias_totales') THEN
        ALTER TABLE activities ADD COLUMN sesiones_dias_totales INTEGER DEFAULT 0;
    END IF;

    -- items_totales
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'items_totales') THEN
        ALTER TABLE activities ADD COLUMN items_totales INTEGER DEFAULT 0;
    END IF;

    -- items_unicos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'items_unicos') THEN
        ALTER TABLE activities ADD COLUMN items_unicos INTEGER DEFAULT 0;
    END IF;

    -- periodos_configurados
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'periodos_configurados') THEN
        ALTER TABLE activities ADD COLUMN periodos_configurados INTEGER DEFAULT 1;
    END IF;
END $$;

-- 2. Populate columns using the logic provided
WITH unique_exercises AS (
    -- Desglosar todos los ejercicios planificados para contar IDs únicos
    SELECT 
        actividad_id,
        COUNT(DISTINCT (elem->>'id')) as cantidad_unicos
    FROM planificacion_ejercicios,
    LATERAL (
        SELECT jsonb_array_elements(COALESCE(lunes->'ejercicios', '[]'::jsonb)) as elem UNION ALL
        SELECT jsonb_array_elements(COALESCE(martes->'ejercicios', '[]'::jsonb)) UNION ALL
        SELECT jsonb_array_elements(COALESCE(miercoles->'ejercicios', '[]'::jsonb)) UNION ALL
        SELECT jsonb_array_elements(COALESCE(jueves->'ejercicios', '[]'::jsonb)) UNION ALL
        SELECT jsonb_array_elements(COALESCE(viernes->'ejercicios', '[]'::jsonb)) UNION ALL
        SELECT jsonb_array_elements(COALESCE(sabado->'ejercicios', '[]'::jsonb)) UNION ALL
        SELECT jsonb_array_elements(COALESCE(domingo->'ejercicios', '[]'::jsonb))
    ) as exploded
    WHERE jsonb_typeof(elem) = 'object' AND elem->>'id' IS NOT NULL
    GROUP BY actividad_id
),
weekly_metrics AS (
    -- Calcular métricas base (lo que está dibujado en la grilla)
    SELECT 
        actividad_id,
        -- Semanas: Cantidad de semanas distintas configuradas
        COUNT(DISTINCT numero_semana) as semanas_base,
        
        -- Sesiones: Suma de días que tienen al menos 1 ejercicio
        SUM(
            (CASE WHEN jsonb_array_length(COALESCE(lunes->'ejercicios', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
            (CASE WHEN jsonb_array_length(COALESCE(martes->'ejercicios', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
            (CASE WHEN jsonb_array_length(COALESCE(miercoles->'ejercicios', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
            (CASE WHEN jsonb_array_length(COALESCE(jueves->'ejercicios', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
            (CASE WHEN jsonb_array_length(COALESCE(viernes->'ejercicios', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
            (CASE WHEN jsonb_array_length(COALESCE(sabado->'ejercicios', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
            (CASE WHEN jsonb_array_length(COALESCE(domingo->'ejercicios', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END)
        ) as sesiones_base,
        
        -- Ejercicios Totales: Suma de la cantidad de items
        SUM(
            jsonb_array_length(COALESCE(lunes->'ejercicios', '[]'::jsonb)) +
            jsonb_array_length(COALESCE(martes->'ejercicios', '[]'::jsonb)) +
            jsonb_array_length(COALESCE(miercoles->'ejercicios', '[]'::jsonb)) +
            jsonb_array_length(COALESCE(jueves->'ejercicios', '[]'::jsonb)) +
            jsonb_array_length(COALESCE(viernes->'ejercicios', '[]'::jsonb)) +
            jsonb_array_length(COALESCE(sabado->'ejercicios', '[]'::jsonb)) +
            jsonb_array_length(COALESCE(domingo->'ejercicios', '[]'::jsonb))
        ) as items_totales_base
    FROM planificacion_ejercicios
    GROUP BY actividad_id
),
calculated_stats AS (
    SELECT 
        a.id as act_id,
        COALESCE(per.cantidad_periodos, 1) as cfg_periodos,
        COALESCE(wm.semanas_base, 0) * COALESCE(per.cantidad_periodos, 1) as calc_semanas,
        COALESCE(wm.sesiones_base, 0) * COALESCE(per.cantidad_periodos, 1) as calc_sesiones,
        COALESCE(wm.items_totales_base, 0) * COALESCE(per.cantidad_periodos, 1) as calc_items,
        COALESCE(ue.cantidad_unicos, 0) as calc_unicos
    FROM activities a
    LEFT JOIN weekly_metrics wm ON wm.actividad_id = a.id
    LEFT JOIN unique_exercises ue ON ue.actividad_id = a.id
    LEFT JOIN periodos per ON per.actividad_id = a.id
)
UPDATE activities
SET 
    semanas_totales = s.calc_semanas,
    sesiones_dias_totales = s.calc_sesiones,
    items_totales = s.calc_items,
    items_unicos = s.calc_unicos,
    periodos_configurados = s.cfg_periodos
FROM calculated_stats s
WHERE activities.id = s.act_id;
