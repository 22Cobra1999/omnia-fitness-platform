-- ==========================================
-- CONSULTA DE EVENTOS PRÓXIMOS
-- ==========================================
SELECT ce.*, gml.meet_link 
FROM public.calendar_events ce
LEFT JOIN public.google_meet_links gml ON ce.id = gml.calendar_event_id
WHERE ce.coach_id = 'COACH_ID' 
  AND ce.start_time >= NOW()
ORDER BY ce.start_time ASC;

-- ==========================================
-- LÓGICA DEL TRIGGER (SIMPLIFICADA)
-- ==========================================
-- Este fragmento se ejecuta automáticamente tras un INSERT en activity_schedules
INSERT INTO calendar_events (
    coach_id, client_id, activity_id,
    title, start_time, end_time, event_type
) VALUES (
    NEW.coach_id, NEW.client_id, NEW.activity_id,
    'Consulta Virtual', NEW.scheduled_time, 
    NEW.scheduled_time + interval '1 hour', 'consultation'
);
