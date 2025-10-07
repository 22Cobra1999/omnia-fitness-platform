-- Script de migración: fitness_exercises -> activity_calendar
-- Este script migra los datos existentes de fitness_exercises a la nueva tabla activity_calendar

-- 1. Insertar datos existentes de fitness_exercises en activity_calendar
INSERT INTO activity_calendar (
  activity_id,
  fitness_exercise_id,
  week_number,
  month_number,
  day_name,
  calculated_date,
  is_replicated,
  source_week,
  created_at
)
SELECT 
  fe.activity_id,
  fe.id as fitness_exercise_id,
  fe.semana as week_number,
  fe.mes as month_number,
  fe.día as day_name,
  -- Calcular la fecha basándose en la fecha de inicio de la actividad
  CASE 
    WHEN ae.start_date IS NOT NULL AND fe.semana IS NOT NULL AND fe.mes IS NOT NULL AND fe.día IS NOT NULL THEN
      -- Calcular la fecha real basándose en la lógica del calendario
      (
        SELECT 
          CASE 
            WHEN fe.día = 'lunes' THEN ae.start_date + INTERVAL '1 day' + INTERVAL '7 days' * ((fe.mes - 1) * 4 + (fe.semana - 1))
            WHEN fe.día = 'martes' THEN ae.start_date + INTERVAL '2 days' + INTERVAL '7 days' * ((fe.mes - 1) * 4 + (fe.semana - 1))
            WHEN fe.día = 'miércoles' THEN ae.start_date + INTERVAL '3 days' + INTERVAL '7 days' * ((fe.mes - 1) * 4 + (fe.semana - 1))
            WHEN fe.día = 'jueves' THEN ae.start_date + INTERVAL '4 days' + INTERVAL '7 days' * ((fe.mes - 1) * 4 + (fe.semana - 1))
            WHEN fe.día = 'viernes' THEN ae.start_date + INTERVAL '5 days' + INTERVAL '7 days' * ((fe.mes - 1) * 4 + (fe.semana - 1))
            WHEN fe.día = 'sábado' THEN ae.start_date + INTERVAL '6 days' + INTERVAL '7 days' * ((fe.mes - 1) * 4 + (fe.semana - 1))
            WHEN fe.día = 'domingo' THEN ae.start_date + INTERVAL '7 days' * ((fe.mes - 1) * 4 + (fe.semana - 1))
            ELSE ae.start_date
          END
      )
    ELSE NULL
  END as calculated_date,
  false as is_replicated,
  NULL as source_week,
  NOW() as created_at
FROM fitness_exercises fe
LEFT JOIN activity_enrollments ae ON fe.activity_id = ae.id
WHERE fe.semana IS NOT NULL AND fe.mes IS NOT NULL AND fe.día IS NOT NULL;

-- 2. Verificar que la migración fue exitosa
SELECT 
  'Datos migrados' as status,
  COUNT(*) as total_records
FROM activity_calendar;

-- 3. Mostrar algunos ejemplos de datos migrados
SELECT 
  ac.id,
  ac.activity_id,
  ac.fitness_exercise_id,
  ac.week_number,
  ac.month_number,
  ac.day_name,
  ac.calculated_date,
  fe.nombre_actividad
FROM activity_calendar ac
LEFT JOIN fitness_exercises fe ON ac.fitness_exercise_id = fe.id
ORDER BY ac.calculated_date
LIMIT 10;
