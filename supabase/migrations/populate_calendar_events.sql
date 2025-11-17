-- ================================================================
-- SCRIPT PARA POBLAR LA TABLA CALENDAR_EVENTS
-- ================================================================
-- Este script extrae datos de las tablas existentes y los combina
-- para crear eventos en el calendario del coach

-- ================================================================
-- PARTE 1: INSERTAR EVENTOS DE TALLERES
-- ================================================================
-- Extraer datos de taller_detalles (horarios del coach) y ejecuciones_taller (inscripciones)

INSERT INTO calendar_events (
    coach_id,
    client_id,
    activity_id,
    title,
    description,
    start_time,
    end_time,
    event_type,
    status,
    consultation_type,
    notes,
    timezone_offset,
    timezone_name,
    created_at,
    updated_at
)
SELECT 
    td.coach_id,
    et.cliente_id,
    td.actividad_id,
    CONCAT('Taller: ', td.nombre) as title,
    td.descripcion as description,
    -- Combinar fecha y hora del horario original
    CASE 
        WHEN jsonb_array_length(td.originales) > 0 THEN
            (td.originales->0->>'fecha')::date + 
            (td.originales->0->>'hora_inicio')::time
        ELSE NULL
    END as start_time,
    -- Calcular hora de fin
    CASE 
        WHEN jsonb_array_length(td.originales) > 0 THEN
            (td.originales->0->>'fecha')::date + 
            (td.originales->0->>'hora_fin')::time
        ELSE NULL
    END as end_time,
    'workshop' as event_type,
    CASE 
        WHEN et.estado = 'completado' THEN 'completed'
        WHEN et.estado = 'cancelado' THEN 'cancelled'
        ELSE 'scheduled'
    END as status,
    NULL as consultation_type,
    CONCAT('Tema: ', td.nombre, 
           CASE WHEN jsonb_array_length(td.originales) > 0 THEN 
               CONCAT(' - Horario: ', td.originales->0->>'hora_inicio', ' a ', td.originales->0->>'hora_fin')
           ELSE '' END
    ) as notes,
    -180 as timezone_offset, -- GMT-3 para Argentina
    'America/Argentina/Buenos_Aires' as timezone_name,
    NOW() as created_at,
    NOW() as updated_at
FROM taller_detalles td
INNER JOIN ejecuciones_taller et ON td.actividad_id = et.actividad_id
WHERE td.originales IS NOT NULL 
  AND jsonb_array_length(td.originales) > 0
  AND et.cliente_id IS NOT NULL
  AND (td.originales->0->>'fecha')::date >= CURRENT_DATE - INTERVAL '30 days' -- Solo últimos 30 días
  AND (td.originales->0->>'fecha')::date <= CURRENT_DATE + INTERVAL '90 days' -- Y próximos 90 días

UNION ALL

-- Insertar horarios BIS de talleres
SELECT 
    td.coach_id,
    et.cliente_id,
    td.actividad_id,
    CONCAT('Taller: ', td.nombre, ' (Bis)') as title,
    td.descripcion as description,
    -- Combinar fecha y hora del horario bis
    CASE 
        WHEN jsonb_array_length(td.secundarios) > 0 THEN
            (td.secundarios->0->>'fecha')::date + 
            (td.secundarios->0->>'hora_inicio')::time
        ELSE NULL
    END as start_time,
    -- Calcular hora de fin
    CASE 
        WHEN jsonb_array_length(td.secundarios) > 0 THEN
            (td.secundarios->0->>'fecha')::date + 
            (td.secundarios->0->>'hora_fin')::time
        ELSE NULL
    END as end_time,
    'workshop' as event_type,
    CASE 
        WHEN et.estado = 'completado' THEN 'completed'
        WHEN et.estado = 'cancelado' THEN 'cancelled'
        ELSE 'scheduled'
    END as status,
    NULL as consultation_type,
    CONCAT('Tema: ', td.nombre, ' (Horario Bis)',
           CASE WHEN jsonb_array_length(td.secundarios) > 0 THEN 
               CONCAT(' - Horario: ', td.secundarios->0->>'hora_inicio', ' a ', td.secundarios->0->>'hora_fin')
           ELSE '' END
    ) as notes,
    -180 as timezone_offset,
    'America/Argentina/Buenos_Aires' as timezone_name,
    NOW() as created_at,
    NOW() as updated_at
FROM taller_detalles td
INNER JOIN ejecuciones_taller et ON td.actividad_id = et.actividad_id
WHERE td.secundarios IS NOT NULL 
  AND jsonb_array_length(td.secundarios) > 0
  AND et.cliente_id IS NOT NULL
  AND (td.secundarios->0->>'fecha')::date >= CURRENT_DATE - INTERVAL '30 days'
  AND (td.secundarios->0->>'fecha')::date <= CURRENT_DATE + INTERVAL '90 days';

-- ================================================================
-- PARTE 2: INSERTAR EVENTOS DE CONSULTAS (CAFÉ, REUNIONES)
-- ================================================================
-- Extraer datos de activity_schedules para consultas

INSERT INTO calendar_events (
    coach_id,
    client_id,
    activity_id,
    title,
    description,
    start_time,
    end_time,
    event_type,
    status,
    consultation_type,
    notes,
    timezone_offset,
    timezone_name,
    created_at,
    updated_at
)
SELECT 
    as_schedule.coach_id,
    as_schedule.client_id,
    as_schedule.activity_id,
    CASE 
        WHEN as_schedule.session_type = 'videocall' THEN 'Consulta Virtual'
        WHEN as_schedule.session_type = 'workshop' THEN 'Taller'
        WHEN as_schedule.session_type = 'program_session' THEN 'Sesión de Programa'
        ELSE 'Consulta'
    END as title,
    CONCAT('Duración: ', as_schedule.duration_minutes, ' minutos') as description,
    (as_schedule.scheduled_date + as_schedule.scheduled_time) as start_time,
    (as_schedule.scheduled_date + as_schedule.scheduled_time + 
     (as_schedule.duration_minutes || ' minutes')::interval) as end_time,
    'consultation' as event_type,
    CASE 
        WHEN as_schedule.status = 'completed' THEN 'completed'
        WHEN as_schedule.status = 'cancelled' THEN 'cancelled'
        WHEN as_schedule.status = 'rescheduled' THEN 'rescheduled'
        ELSE 'scheduled'
    END as status,
    CASE 
        WHEN as_schedule.session_type = 'videocall' THEN 'videocall'
        ELSE 'message'
    END as consultation_type,
    COALESCE(as_schedule.notes, '') as notes,
    -180 as timezone_offset,
    'America/Argentina/Buenos_Aires' as timezone_name,
    as_schedule.created_at,
    as_schedule.updated_at
FROM activity_schedules as_schedule
WHERE as_schedule.scheduled_date >= CURRENT_DATE - INTERVAL '30 days'
  AND as_schedule.scheduled_date <= CURRENT_DATE + INTERVAL '90 days'
  AND as_schedule.coach_id IS NOT NULL;

-- ================================================================
-- PARTE 3: INSERTAR EVENTOS DE PROGRAMAS
-- ================================================================
-- Extraer datos de activity_schedules para sesiones de programas

INSERT INTO calendar_events (
    coach_id,
    client_id,
    activity_id,
    title,
    description,
    start_time,
    end_time,
    event_type,
    status,
    consultation_type,
    notes,
    timezone_offset,
    timezone_name,
    created_at,
    updated_at
)
SELECT 
    as_schedule.coach_id,
    as_schedule.client_id,
    as_schedule.activity_id,
    CONCAT('Programa: ', a.title) as title,
    CONCAT('Sesión de programa - Duración: ', as_schedule.duration_minutes, ' minutos') as description,
    (as_schedule.scheduled_date + as_schedule.scheduled_time) as start_time,
    (as_schedule.scheduled_date + as_schedule.scheduled_time + 
     (as_schedule.duration_minutes || ' minutes')::interval) as end_time,
    'workout' as event_type,
    CASE 
        WHEN as_schedule.status = 'completed' THEN 'completed'
        WHEN as_schedule.status = 'cancelled' THEN 'cancelled'
        WHEN as_schedule.status = 'rescheduled' THEN 'rescheduled'
        ELSE 'scheduled'
    END as status,
    CASE 
        WHEN as_schedule.session_type = 'videocall' THEN 'videocall'
        ELSE NULL
    END as consultation_type,
    COALESCE(as_schedule.notes, '') as notes,
    -180 as timezone_offset,
    'America/Argentina/Buenos_Aires' as timezone_name,
    as_schedule.created_at,
    as_schedule.updated_at
FROM activity_schedules as_schedule
INNER JOIN activities a ON as_schedule.activity_id = a.id
WHERE as_schedule.session_type = 'program_session'
  AND as_schedule.scheduled_date >= CURRENT_DATE - INTERVAL '30 days'
  AND as_schedule.scheduled_date <= CURRENT_DATE + INTERVAL '90 days'
  AND as_schedule.coach_id IS NOT NULL;

-- ================================================================
-- PARTE 4: LIMPIAR EVENTOS DUPLICADOS
-- ================================================================
-- Eliminar eventos duplicados basados en coach_id, client_id, activity_id, start_time

WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY coach_id, client_id, activity_id, start_time 
            ORDER BY created_at DESC
        ) as rn
    FROM calendar_events
)
DELETE FROM calendar_events 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- ================================================================
-- PARTE 5: CREAR ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ================================================================

-- Índice compuesto para búsquedas por coach y fecha
CREATE INDEX IF NOT EXISTS idx_calendar_events_coach_date_range 
ON calendar_events(coach_id, start_time) 
WHERE start_time >= CURRENT_DATE - INTERVAL '30 days';

-- Índice para búsquedas por cliente
CREATE INDEX IF NOT EXISTS idx_calendar_events_client_date 
ON calendar_events(client_id, start_time);

-- Índice para búsquedas por tipo de evento
CREATE INDEX IF NOT EXISTS idx_calendar_events_type_status 
ON calendar_events(event_type, status);

-- ================================================================
-- PARTE 6: COMENTARIOS PARA DOCUMENTACIÓN
-- ================================================================

COMMENT ON TABLE calendar_events IS 'Tabla que combina todos los eventos del calendario del coach: talleres, consultas y programas';

COMMENT ON COLUMN calendar_events.event_type IS 'Tipo de evento: workshop (talleres), consultation (consultas), workout (programas), meeting (reuniones)';

COMMENT ON COLUMN calendar_events.consultation_type IS 'Tipo de consulta: videocall (videollamada), message (mensaje), NULL (para talleres y programas)';

-- ================================================================
-- VERIFICACIÓN FINAL
-- ================================================================

-- Mostrar resumen de eventos insertados
SELECT 
    event_type,
    consultation_type,
    status,
    COUNT(*) as total_events,
    COUNT(DISTINCT coach_id) as coaches_affected,
    COUNT(DISTINCT client_id) as clients_affected
FROM calendar_events 
GROUP BY event_type, consultation_type, status
ORDER BY event_type, consultation_type, status;
































