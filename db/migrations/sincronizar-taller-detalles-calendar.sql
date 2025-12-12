-- ================================================================
-- SCRIPT PARA SINCRONIZAR TALLER_DETALLES A CALENDAR_EVENTS
-- ================================================================
-- 
-- Este script convierte los temas de talleres (taller_detalles) 
-- con sus fechas (originales->fechas_horarios) a eventos en calendar_events
-- ================================================================

-- Insertar eventos desde taller_detalles
INSERT INTO calendar_events (
    coach_id,
    activity_id,
    title,
    description,
    start_time,
    end_time,
    event_type,
    status,
    notes,
    created_at,
    updated_at
)
SELECT 
    a.coach_id,
    td.actividad_id,
    CONCAT('Taller: ', td.nombre) as title,
    COALESCE(td.descripcion, '') as description,
    (
        (fh->>'fecha')::DATE + 
        (fh->>'hora_inicio')::TIME
    )::TIMESTAMPTZ as start_time,
    (
        (fh->>'fecha')::DATE + 
        (fh->>'hora_fin')::TIME
    )::TIMESTAMPTZ as end_time,
    'workshop' as event_type,
    'scheduled' as status,
    CONCAT('Cupo: ', (fh->>'cupo')::TEXT, ' personas') as notes,
    NOW() as created_at,
    NOW() as updated_at
FROM taller_detalles td
INNER JOIN activities a ON td.actividad_id = a.id
CROSS JOIN jsonb_array_elements(td.originales->'fechas_horarios') as fh
WHERE td.activo = TRUE
  AND td.originales IS NOT NULL
  AND td.originales->'fechas_horarios' IS NOT NULL
  AND jsonb_array_length(td.originales->'fechas_horarios') > 0
  AND (fh->>'fecha')::DATE >= CURRENT_DATE - INTERVAL '30 days'
  AND (fh->>'fecha')::DATE <= CURRENT_DATE + INTERVAL '90 days'
  AND a.coach_id IS NOT NULL
  AND NOT EXISTS (
      -- Evitar duplicados
      SELECT 1 FROM calendar_events ce
      WHERE ce.coach_id = a.coach_id
        AND ce.activity_id = td.actividad_id
        AND ce.start_time = (
            (fh->>'fecha')::DATE + 
            (fh->>'hora_inicio')::TIME
        )::TIMESTAMPTZ
        AND ce.event_type = 'workshop'
  );

-- Verificar resultados
DO $$
DECLARE
    total_eventos INTEGER;
    eventos_30_31 INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_eventos
    FROM calendar_events
    WHERE event_type = 'workshop'
      AND start_time >= CURRENT_DATE - INTERVAL '30 days'
      AND start_time <= CURRENT_DATE + INTERVAL '90 days';
    
    SELECT COUNT(*) INTO eventos_30_31
    FROM calendar_events
    WHERE event_type = 'workshop'
      AND start_time::DATE >= '2025-12-30'
      AND start_time::DATE <= '2025-12-31';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SINCRONIZACIÓN COMPLETADA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total eventos de taller creados: %', total_eventos;
    RAISE NOTICE 'Eventos para 30-31 de diciembre: %', eventos_30_31;
    RAISE NOTICE '========================================';
END $$;

-- Mostrar eventos creados para 30-31 de diciembre
SELECT 
    id,
    title,
    start_time,
    end_time,
    notes,
    activity_id
FROM calendar_events
WHERE event_type = 'workshop'
  AND start_time::DATE >= '2025-12-30'
  AND start_time::DATE <= '2025-12-31'
ORDER BY start_time;

