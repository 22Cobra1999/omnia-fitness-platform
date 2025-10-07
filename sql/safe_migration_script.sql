-- Script de migración seguro: fitness_exercises -> activity_calendar
-- Este script maneja mejor los tipos de datos y es más seguro

-- 1. Crear la tabla activity_calendar si no existe
CREATE TABLE IF NOT EXISTS activity_calendar (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER REFERENCES activity_enrollments(id) ON DELETE CASCADE,
  fitness_exercise_id INTEGER REFERENCES fitness_exercises(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  month_number INTEGER NOT NULL,
  day_name VARCHAR(10) NOT NULL,
  calculated_date DATE,
  is_replicated BOOLEAN DEFAULT FALSE,
  source_week INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_activity_calendar_activity_id ON activity_calendar(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_calendar_calculated_date ON activity_calendar(calculated_date);
CREATE INDEX IF NOT EXISTS idx_activity_calendar_week_month ON activity_calendar(week_number, month_number);

-- 3. Función auxiliar para convertir mes a entero de forma segura
CREATE OR REPLACE FUNCTION safe_mes_to_int(mes_value TEXT) 
RETURNS INTEGER AS $$
BEGIN
  IF mes_value IS NULL OR mes_value = '' THEN
    RETURN 1;
  END IF;
  
  BEGIN
    RETURN CAST(mes_value AS INTEGER);
  EXCEPTION
    WHEN OTHERS THEN
      RETURN 1;
  END;
END;
$$ LANGUAGE plpgsql;

-- 4. Migrar datos existentes de fitness_exercises a activity_calendar
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
  safe_mes_to_int(fe.mes) as month_number,
  fe.día as day_name,
  -- Calcular la fecha basándose en la fecha de inicio de la actividad
  CASE 
    WHEN ae.start_date IS NOT NULL AND fe.semana IS NOT NULL AND fe.día IS NOT NULL THEN
      -- Calcular la fecha real basándose en la lógica del calendario
      (
        SELECT 
          CASE 
            WHEN fe.día = 'lunes' THEN ae.start_date + INTERVAL '1 day' + INTERVAL '7 days' * ((safe_mes_to_int(fe.mes) - 1) * 4 + (fe.semana - 1))
            WHEN fe.día = 'martes' THEN ae.start_date + INTERVAL '2 days' + INTERVAL '7 days' * ((safe_mes_to_int(fe.mes) - 1) * 4 + (fe.semana - 1))
            WHEN fe.día = 'miércoles' THEN ae.start_date + INTERVAL '3 days' + INTERVAL '7 days' * ((safe_mes_to_int(fe.mes) - 1) * 4 + (fe.semana - 1))
            WHEN fe.día = 'jueves' THEN ae.start_date + INTERVAL '4 days' + INTERVAL '7 days' * ((safe_mes_to_int(fe.mes) - 1) * 4 + (fe.semana - 1))
            WHEN fe.día = 'viernes' THEN ae.start_date + INTERVAL '5 days' + INTERVAL '7 days' * ((safe_mes_to_int(fe.mes) - 1) * 4 + (fe.semana - 1))
            WHEN fe.día = 'sábado' THEN ae.start_date + INTERVAL '6 days' + INTERVAL '7 days' * ((safe_mes_to_int(fe.mes) - 1) * 4 + (fe.semana - 1))
            WHEN fe.día = 'domingo' THEN ae.start_date + INTERVAL '7 days' * ((safe_mes_to_int(fe.mes) - 1) * 4 + (fe.semana - 1))
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
WHERE fe.semana IS NOT NULL AND fe.día IS NOT NULL;

-- 5. Verificar la migración
SELECT 
  'Datos migrados' as status,
  COUNT(*) as total_records
FROM activity_calendar;

-- 6. Mostrar algunos ejemplos de datos migrados
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

-- 7. Verificar que todos los ejercicios tienen su entrada en el calendario
SELECT 
  'Ejercicios sin calendario' as status,
  COUNT(*) as count
FROM fitness_exercises fe
LEFT JOIN activity_calendar ac ON fe.id = ac.fitness_exercise_id
WHERE ac.id IS NULL;

-- 8. Limpiar función auxiliar
DROP FUNCTION IF EXISTS safe_mes_to_int(TEXT);
