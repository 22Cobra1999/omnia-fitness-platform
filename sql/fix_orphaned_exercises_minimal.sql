-- Script minimalista para arreglar ejercicios huérfanos
-- Este script usa solo las columnas que realmente existen

-- 1. Verificar si la actividad 59 ya existe
SELECT 
  'Verificando actividad 59' as status,
  COUNT(*) as count
FROM activity_enrollments 
WHERE id = 59;

-- 2. Crear la actividad faltante (id=59) con solo las columnas básicas
-- Asumiendo que tiene: id, client_id, start_date, status, created_at, updated_at
INSERT INTO activity_enrollments (
  id,
  client_id,
  start_date,
  status,
  created_at,
  updated_at
)
SELECT 
  59 as id,
  '00dedc23-0b17-4e50-b84e-b2e8100dc93c' as client_id,
  '2024-09-01'::date as start_date,  -- Fecha de inicio basada en los ejercicios
  'active' as status,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (
  SELECT 1 FROM activity_enrollments WHERE id = 59
);

-- 3. Verificar que la actividad se creó
SELECT 
  'Actividad 59 creada' as status,
  *
FROM activity_enrollments 
WHERE id = 59;

-- 4. Crear la tabla activity_calendar si no existe
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

-- 5. Crear índices
CREATE INDEX IF NOT EXISTS idx_activity_calendar_activity_id ON activity_calendar(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_calendar_calculated_date ON activity_calendar(calculated_date);
CREATE INDEX IF NOT EXISTS idx_activity_calendar_week_month ON activity_calendar(week_number, month_number);

-- 6. Función auxiliar para convertir mes a entero de forma segura
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

-- 7. Migrar TODOS los ejercicios (incluyendo los huérfanos ahora válidos)
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
INNER JOIN activity_enrollments ae ON fe.activity_id = ae.id  -- Solo datos válidos
WHERE fe.semana IS NOT NULL AND fe.día IS NOT NULL;

-- 8. Verificar la migración completa
SELECT 
  'Migración completa' as status,
  COUNT(*) as total_records
FROM activity_calendar;

-- 9. Mostrar algunos ejemplos de datos migrados
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

-- 10. Verificar que no quedan ejercicios sin migrar
SELECT 
  'Ejercicios sin migrar' as status,
  COUNT(*) as count
FROM fitness_exercises fe
LEFT JOIN activity_calendar ac ON fe.id = ac.fitness_exercise_id
WHERE ac.id IS NULL;

-- 11. Limpiar función auxiliar
DROP FUNCTION IF EXISTS safe_mes_to_int(TEXT);
