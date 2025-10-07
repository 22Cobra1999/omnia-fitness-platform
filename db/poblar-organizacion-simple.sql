-- Script para poblar organizacion_ejercicios con datos de ejemplo
-- Usa ejercicios_detalles existentes o crea algunos básicos

-- 1. Verificar ejercicios_detalles existentes
SELECT 'EJERCICIOS EXISTENTES' as info, COUNT(*) as total FROM ejercicios_detalles;

-- 2. Si no hay ejercicios, crear algunos básicos
INSERT INTO ejercicios_detalles (nombre_ejercicio, descripcion, tipo, equipo, body_parts, created_by)
SELECT * FROM (VALUES
  ('Flexiones', 'Ejercicio básico de fuerza para pecho y brazos', 'fuerza', 'Ninguno', 'Pecho, Tríceps, Hombros', 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'),
  ('Sentadillas', 'Ejercicio fundamental para piernas y glúteos', 'fuerza', 'Ninguno', 'Piernas, Glúteos', 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'),
  ('Plancha', 'Ejercicio isométrico para core', 'funcional', 'Ninguno', 'Core, Abdominales', 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'),
  ('Burpees', 'Ejercicio de alta intensidad completo', 'hiit', 'Ninguno', 'Cuerpo completo', 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'),
  ('Mountain Climbers', 'Ejercicio cardiovascular dinámico', 'cardio', 'Ninguno', 'Core, Piernas', 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f')
) AS t(nombre_ejercicio, descripcion, tipo, equipo, body_parts, created_by)
WHERE NOT EXISTS (SELECT 1 FROM ejercicios_detalles LIMIT 1);

-- 3. Limpiar datos existentes de organizacion_ejercicios
DELETE FROM organizacion_ejercicios WHERE activity_id IN (48, 59);

-- 4. Crear ejercicios para yoga (ID 48) - 3 semanas, 7 días
INSERT INTO organizacion_ejercicios (activity_id, semana, dia, ejercicio_id, bloque, orden)
SELECT 
  48 as activity_id,
  s.semana,
  d.dia,
  (SELECT id FROM ejercicios_detalles ORDER BY RANDOM() LIMIT 1) as ejercicio_id,
  1 as bloque,
  (s.semana - 1) * 7 + d.dia as orden
FROM generate_series(1, 3) as s(semana)
CROSS JOIN generate_series(1, 7) as d(dia);

-- 5. Crear ejercicios para programa de fuerza (ID 59) - 8 semanas, 7 días
INSERT INTO organizacion_ejercicios (activity_id, semana, dia, ejercicio_id, bloque, orden)
SELECT 
  59 as activity_id,
  s.semana,
  d.dia,
  (SELECT id FROM ejercicios_detalles ORDER BY RANDOM() LIMIT 1) as ejercicio_id,
  1 as bloque,
  (s.semana - 1) * 7 + d.dia as orden
FROM generate_series(1, 8) as s(semana)
CROSS JOIN generate_series(1, 7) as d(dia);

-- 6. Verificar resultado
SELECT 
  'RESULTADO FINAL' as seccion,
  activity_id,
  COUNT(*) as total_ejercicios,
  MIN(semana) as semana_min,
  MAX(semana) as semana_max,
  COUNT(DISTINCT semana) as semanas_unicas
FROM organizacion_ejercicios
WHERE activity_id IN (48, 59)
GROUP BY activity_id
ORDER BY activity_id;

































