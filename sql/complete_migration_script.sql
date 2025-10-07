-- Script completo de migración: fitness_exercises -> activity_calendar
-- Este script migra todos los datos existentes y actualiza la estructura

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

-- 3. Migrar datos existentes de fitness_exercises a activity_calendar
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
  COALESCE(CAST(fe.mes AS INTEGER), 1) as month_number, -- Si no hay mes, usar 1
  fe.día as day_name,
  -- Calcular la fecha basándose en la fecha de inicio de la actividad
  CASE 
    WHEN ae.start_date IS NOT NULL AND fe.semana IS NOT NULL AND fe.día IS NOT NULL THEN
      -- Calcular la fecha real basándose en la lógica del calendario
      (
        SELECT 
          CASE 
            WHEN fe.día = 'lunes' THEN ae.start_date + INTERVAL '1 day' + INTERVAL '7 days' * ((COALESCE(CAST(fe.mes AS INTEGER), 1) - 1) * 4 + (fe.semana - 1))
            WHEN fe.día = 'martes' THEN ae.start_date + INTERVAL '2 days' + INTERVAL '7 days' * ((COALESCE(CAST(fe.mes AS INTEGER), 1) - 1) * 4 + (fe.semana - 1))
            WHEN fe.día = 'miércoles' THEN ae.start_date + INTERVAL '3 days' + INTERVAL '7 days' * ((COALESCE(CAST(fe.mes AS INTEGER), 1) - 1) * 4 + (fe.semana - 1))
            WHEN fe.día = 'jueves' THEN ae.start_date + INTERVAL '4 days' + INTERVAL '7 days' * ((COALESCE(CAST(fe.mes AS INTEGER), 1) - 1) * 4 + (fe.semana - 1))
            WHEN fe.día = 'viernes' THEN ae.start_date + INTERVAL '5 days' + INTERVAL '7 days' * ((COALESCE(CAST(fe.mes AS INTEGER), 1) - 1) * 4 + (fe.semana - 1))
            WHEN fe.día = 'sábado' THEN ae.start_date + INTERVAL '6 days' + INTERVAL '7 days' * ((COALESCE(CAST(fe.mes AS INTEGER), 1) - 1) * 4 + (fe.semana - 1))
            WHEN fe.día = 'domingo' THEN ae.start_date + INTERVAL '7 days' * ((COALESCE(CAST(fe.mes AS INTEGER), 1) - 1) * 4 + (fe.semana - 1))
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

-- 4. Verificar la migración
SELECT 
  'Datos migrados' as status,
  COUNT(*) as total_records
FROM activity_calendar;

-- 5. Mostrar algunos ejemplos de datos migrados
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

-- 6. Verificar que todos los ejercicios tienen su entrada en el calendario
SELECT 
  'Ejercicios sin calendario' as status,
  COUNT(*) as count
FROM fitness_exercises fe
LEFT JOIN activity_calendar ac ON fe.id = ac.fitness_exercise_id
WHERE ac.id IS NULL;

-- 7. Una vez verificado que la migración fue exitosa, eliminar las columnas de fecha
-- DESCOMENTAR ESTAS LÍNEAS CUANDO ESTÉS SEGURO DE QUE LA MIGRACIÓN FUE EXITOSA:

-- ALTER TABLE fitness_exercises DROP COLUMN IF EXISTS semana;
-- ALTER TABLE fitness_exercises DROP COLUMN IF EXISTS mes;
-- ALTER TABLE fitness_exercises DROP COLUMN IF EXISTS día;

-- 8. Verificar la estructura final
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'fitness_exercises' 
-- ORDER BY ordinal_position;
