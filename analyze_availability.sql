-- Query Avanzada de Disponibilidad del Coach
-- Reemplaza 'COACH_ID_HERE' con el ID del coach que quieras analizar.
-- Rango: Dec 2025 - Feb 2026.

WITH RECURSIVE 
    -- 1. Generar días del rango deseado
    dates AS (
        SELECT generate_series('2025-12-01'::date, '2026-02-28'::date, '1 day'::interval)::date AS day_date
    ),
    
    -- 2. Obtener reglas de disponibilidad aplicables para cada día
    -- Prioridad: Regla específica (Year/Month) > Regla general (Always)
    daily_rules AS (
        SELECT 
            d.day_date,
            r.start_time,
            r.end_time,
            r.scope,
            ROW_NUMBER() OVER (
                PARTITION BY d.day_date 
                ORDER BY 
                    CASE WHEN r.year IS NOT NULL THEN 1 ELSE 2 END, -- Prioridad a reglas específicas de mes/año
                    r.id -- Desempate
            ) as priority_rank
        FROM dates d
        LEFT JOIN coach_availability_rules r ON r.coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f' -- FILTRO DE COACH
        AND (
            -- Coincidencia por día de la semana (0=Dom, 1=Lun...)
            r.weekday = EXTRACT(DOW FROM d.day_date)
            AND (
                (r.scope = 'always') OR
                (r.scope = 'month' AND r.year = EXTRACT(YEAR FROM d.day_date) AND r.month = EXTRACT(MONTH FROM d.day_date))
            )
        )
    ),
    
    -- 3. Filtrar solo la regla de mayor prioridad por día (si existe)
    active_daily_rules AS (
        SELECT * FROM daily_rules WHERE priority_rank = 1
    ),

    -- 4. Generar Slots de 30 minutos para cada día con disponibilidad
    base_slots AS (
        SELECT 
            adr.day_date,
            (adr.day_date + t.time_slot)::timestamp as slot_start,
            (adr.day_date + t.time_slot + interval '30 minutes')::timestamp as slot_end
        FROM active_daily_rules adr
        CROSS JOIN LATERAL generate_series(
            adr.start_time::time, 
            (adr.end_time::time - interval '30 minutes'), 
            interval '30 minutes'
        ) AS t(time_slot)
        WHERE adr.start_time IS NOT NULL
    ),

    -- 5. Identificar slots ocupados por eventos
    occupied_slots AS (
        SELECT 
            bs.slot_start,
            bs.slot_end,
            ce.event_type || ': ' || COALESCE(ce.title, 'Evento') as activity_name
        FROM base_slots bs
        JOIN calendar_events ce ON ce.coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
        AND ce.status != 'cancelled'
        AND (
            -- Superposición de rangos
            (ce.start_time < bs.slot_end AND (ce.end_time IS NULL OR ce.end_time > bs.slot_start))
        )
    ),
    
    -- 6. Agrupar ocupaciones por día para mostrar en una lista
    daily_occupations AS (
        SELECT 
            date_trunc('day', slot_start)::date as day_date,
            string_agg(DISTINCT 
                to_char(slot_start, 'HH24:MI') || '-' || to_char(slot_end, 'HH24:MI') || ' (' || activity_name || ')', 
                ', '
            ) as occupations_list
        FROM occupied_slots
        GROUP BY 1
    ),

    -- 7. Calcular Slots Netos Disponibles (slots base que NO están en occupied_slots)
    net_available_slots AS (
        SELECT 
            bs.day_date,
            bs.slot_start,
            bs.slot_end
        FROM base_slots bs
        WHERE NOT EXISTS (
            SELECT 1 FROM occupied_slots os WHERE os.slot_start = bs.slot_start
        )
    ),

    -- 8. Agrupar slots netos contiguos (Gaps and Islands problem simplificado)
    -- Paso A: Identificar cambios de grupo (cuando el slot anterior no es contiguo)
    net_ranges_grouped AS (
        SELECT 
            day_date,
            slot_start,
            slot_end,
            CASE 
                WHEN slot_start = LAG(slot_end) OVER (PARTITION BY day_date ORDER BY slot_start) 
                THEN 0 ELSE 1 
            END as is_new_group
        FROM net_available_slots
    ),
    -- Paso B: Asignar ID de grupo acumulativo
    net_ranges_with_id AS (
        SELECT 
            *,
            SUM(is_new_group) OVER (PARTITION BY day_date ORDER BY slot_start) as group_id
        FROM net_ranges_grouped
    ),
    -- Paso C: Agrupar por ID para obtener rangos inicio-fin
    daily_net_availability AS (
        SELECT 
            day_date,
            string_agg(
                to_char(MIN(slot_start), 'HH24:MI') || '-' || to_char(MAX(slot_end), 'HH24:MI'),
                ', ' ORDER BY MIN(slot_start)
            ) as net_availability_ranges
        FROM net_ranges_with_id
        GROUP BY day_date
    )

-- 9. Resultado Final
SELECT 
    d.day_date as "Fecha",
    TO_CHAR(d.day_date, 'Day') as "Día",
    
    -- Rango Base (Regla)
    COALESCE(
        to_char(adr.start_time, 'HH24:MI') || ' - ' || to_char(adr.end_time, 'HH24:MI'),
        'Sin disponibilidad'
    ) as "Rango Disponibilidad Base (Regla)",
    
    -- Ocupaciones
    COALESCE(oc.occupations_list, '---') as "Rangos Ocupados (Actividades)",
    
    -- Disponibilidad Neta
    COALESCE(na.net_availability_ranges, CASE WHEN adr.start_time IS NOT NULL THEN 'COMPLETO (0 libres)' ELSE '---' END) as "Horarios Disponibles Netos"

FROM dates d
LEFT JOIN active_daily_rules adr ON adr.day_date = d.day_date
LEFT JOIN daily_occupations oc ON oc.day_date = d.day_date
LEFT JOIN daily_net_availability na ON na.day_date = d.day_date
ORDER BY d.day_date;
