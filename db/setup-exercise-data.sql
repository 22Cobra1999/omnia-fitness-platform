-- Script para configurar datos de ejercicios para la actividad 59
-- Este script crea ejercicios de ejemplo y los organiza para pruebas

-- 1. Verificar si existen ejercicios para la actividad 59
SELECT 
    'EJERCICIOS EXISTENTES PARA ACTIVIDAD 59' as seccion,
    COUNT(*) as total_ejercicios
FROM ejercicios_detalles 
WHERE activity_id = 59;

-- 2. Si no hay ejercicios, crear algunos de ejemplo
INSERT INTO ejercicios_detalles (
    activity_id,
    nombre_ejercicio,
    tipo,
    descripcion,
    equipo,
    body_parts,
    replicar
) VALUES 
(59, 'Sentadillas', 'fuerza', 'Ejercicio básico de fuerza para piernas', 'Peso corporal', 'cuádriceps;glúteos', true),
(59, 'Flexiones', 'fuerza', 'Ejercicio de fuerza para tren superior', 'Peso corporal', 'pectorales;tríceps;hombros', true),
(59, 'Plancha', 'fuerza', 'Ejercicio isométrico para core', 'Peso corporal', 'core;abdominales', true),
(59, 'Burpees', 'cardio', 'Ejercicio de cardio y fuerza combinados', 'Peso corporal', 'todo el cuerpo', true),
(59, 'Jumping Jacks', 'cardio', 'Ejercicio de cardio simple', 'Peso corporal', 'todo el cuerpo', true),
(59, 'Estocadas', 'fuerza', 'Ejercicio unilateral para piernas', 'Peso corporal', 'cuádriceps;glúteos;isquiotibiales', true),
(59, 'Mountain Climbers', 'cardio', 'Ejercicio de cardio dinámico', 'Peso corporal', 'core;hombros;piernas', true),
(59, 'Push-ups', 'fuerza', 'Variación de flexiones', 'Peso corporal', 'pectorales;tríceps;hombros', true),
(59, 'Squat Jumps', 'cardio', 'Sentadillas con salto', 'Peso corporal', 'cuádriceps;glúteos', true),
(59, 'Plank Hold', 'fuerza', 'Plancha estática', 'Peso corporal', 'core;abdominales', true)
ON CONFLICT DO NOTHING;

-- 3. Verificar ejercicios creados
SELECT 
    'EJERCICIOS CREADOS' as seccion,
    id,
    nombre_ejercicio,
    tipo,
    equipo
FROM ejercicios_detalles 
WHERE activity_id = 59
ORDER BY id;

-- 4. Crear organización de ejercicios (si no existe)
INSERT INTO organizacion_ejercicios (
    activity_id,
    ejercicio_id,
    bloque,
    dia,
    semana,
    numero_periodo
)
SELECT 
    59 as activity_id,
    ed.id as ejercicio_id,
    'Mañana' as bloque,
    CASE 
        WHEN ed.id % 7 = 1 THEN 1  -- Lunes
        WHEN ed.id % 7 = 2 THEN 2  -- Martes
        WHEN ed.id % 7 = 3 THEN 3  -- Miércoles
        WHEN ed.id % 7 = 4 THEN 4  -- Jueves
        WHEN ed.id % 7 = 5 THEN 5  -- Viernes
        WHEN ed.id % 7 = 6 THEN 6  -- Sábado
        ELSE 7  -- Domingo
    END as dia,
    CASE 
        WHEN ed.id <= 7 THEN 1
        WHEN ed.id <= 14 THEN 2
        WHEN ed.id <= 21 THEN 3
        WHEN ed.id <= 28 THEN 4
        WHEN ed.id <= 35 THEN 5
        WHEN ed.id <= 42 THEN 6
        WHEN ed.id <= 49 THEN 7
        ELSE 8
    END as semana,
    CASE 
        WHEN ed.id <= 7 THEN 1
        WHEN ed.id <= 14 THEN 2
        WHEN ed.id <= 21 THEN 3
        WHEN ed.id <= 28 THEN 4
        WHEN ed.id <= 35 THEN 5
        WHEN ed.id <= 42 THEN 6
        WHEN ed.id <= 49 THEN 7
        ELSE 8
    END as numero_periodo
FROM ejercicios_detalles ed
WHERE ed.activity_id = 59
ON CONFLICT (activity_id, ejercicio_id, dia, semana, numero_periodo, bloque) DO NOTHING;

-- 5. Verificar organización creada
SELECT 
    'ORGANIZACIÓN DE EJERCICIOS' as seccion,
    semana,
    dia,
    COUNT(*) as ejercicios_por_dia
FROM organizacion_ejercicios 
WHERE activity_id = 59
GROUP BY semana, dia
ORDER BY semana, dia;

-- 6. Verificar estructura de periodos_asignados
SELECT 
    'ESTRUCTURA PERIODOS_ASIGNADOS' as seccion,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'periodos_asignados' 
ORDER BY ordinal_position;

-- 7. Verificar estructura de ejecuciones_ejercicio
SELECT 
    'ESTRUCTURA EJECUCIONES_EJERCICIO' as seccion,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ejecuciones_ejercicio' 
ORDER BY ordinal_position;






































