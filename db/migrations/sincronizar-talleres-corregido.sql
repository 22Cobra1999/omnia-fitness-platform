-- ================================================================
-- SCRIPT CORREGIDO PARA SINCRONIZAR TALLER_DETALLES A CALENDAR_EVENTS
-- ================================================================
-- 
-- Ejecutar directamente en Supabase SQL Editor
-- ================================================================

-- Eliminar eventos de taller existentes que puedan estar mal
DELETE FROM calendar_events 
WHERE event_type = 'workshop' 
  AND activity_id IN (SELECT actividad_id FROM taller_detalles WHERE activo = TRUE);

-- Insertar eventos desde taller_detalles con zona horaria correcta
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
    timezone_offset,
    timezone_name,
    created_at,
    updated_at
)
SELECT 
    a.coach_id,
    td.actividad_id,
    CONCAT('Taller: ', td.nombre) as title,
    COALESCE(td.descripcion, '') as description,
    -- Usar timezone de Argentina
    ((fh->>'fecha')::DATE + (fh->>'hora_inicio')::TIME) AT TIME ZONE 'America/Argentina/Buenos_Aires' as start_time,
    ((fh->>'fecha')::DATE + (fh->>'hora_fin')::TIME) AT TIME ZONE 'America/Argentina/Buenos_Aires' as end_time,
    'workshop' as event_type,
    'scheduled' as status,
    CONCAT('Cupo: ', (fh->>'cupo')::TEXT, ' personas') as notes,
    -180 as timezone_offset,
    'America/Argentina/Buenos_Aires' as timezone_name,
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
  AND a.coach_id IS NOT NULL;

-- Verificar resultados
SELECT 
    'Eventos creados' AS resultado,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE start_time::DATE = '2025-12-30') AS eventos_30_dic,
    COUNT(*) FILTER (WHERE start_time::DATE = '2025-12-31') AS eventos_31_dic
FROM calendar_events
WHERE event_type = 'workshop'
  AND start_time >= CURRENT_DATE - INTERVAL '30 days';

-- Mostrar eventos para 30-31 de diciembre
SELECT 
    id,
    title,
    start_time,
    end_time,
    notes
FROM calendar_events
WHERE event_type = 'workshop'
  AND start_time::DATE IN ('2025-12-30', '2025-12-31')
ORDER BY start_time;

