-- Script completo para poblar las tablas con datos realistas
-- Ejecutar después de crear las tablas

-- 1. Insertar datos en la tabla periodos
INSERT INTO periodos (actividad_id, cantidad_periodos) VALUES
-- Programas de fitness
(101, 4),  -- Programa de fuerza 4 semanas
(102, 6),  -- Programa de cardio 6 semanas
(103, 8),  -- Programa completo 8 semanas
(104, 3),  -- Programa de rehabilitación 3 semanas
(105, 5),  -- Programa de pérdida de peso 5 semanas
-- Programas de nutrición
(201, 4),  -- Plan nutricional básico 4 semanas
(202, 8),  -- Plan nutricional avanzado 8 semanas
(203, 6),  -- Plan de mantenimiento 6 semanas
-- Talleres
(301, 1),  -- Taller de técnica
(302, 2),  -- Taller intensivo
(303, 1)   -- Taller de nutrición
ON CONFLICT (actividad_id) DO UPDATE SET 
    cantidad_periodos = EXCLUDED.cantidad_periodos,
    fecha_actualizacion = CURRENT_TIMESTAMP;

-- 2. Insertar datos en la tabla planificacion_ejercicios
INSERT INTO planificacion_ejercicios (actividad_id, numero_semana, lunes, martes, miercoles, jueves, viernes, sabado, domingo) VALUES
-- Programa de fuerza (101) - 4 semanas
(101, 1, 
 '{"ejercicios": [1,2,3]}',  -- Lunes: Sentadilla, Press banca, Dominadas
 '{"ejercicios": [4,5]}',    -- Martes: Peso muerto, Remo
 '{"ejercicios": [6,7,8]}',  -- Miércoles: Press militar, Curl bíceps, Extensión tríceps
 '{"ejercicios": [9,10]}',   -- Jueves: Zancadas, Plancha
 '{"ejercicios": [1,2,3]}',  -- Viernes: Repetición del lunes
 '{"ejercicios": [11,12]}',  -- Sábado: Cardio ligero
 '{}'                        -- Domingo: Descanso
),
(101, 2,
 '{"ejercicios": [13,14,15]}', -- Lunes: Sentadilla con salto, Press inclinado, Dominadas asistidas
 '{"ejercicios": [16,17]}',    -- Martes: Peso muerto rumano, Remo con mancuerna
 '{"ejercicios": [18,19,20]}', -- Miércoles: Press Arnold, Martillo, Fondos
 '{"ejercicios": [21,22]}',    -- Jueves: Zancadas laterales, Plancha lateral
 '{"ejercicios": [13,14,15]}', -- Viernes: Repetición del lunes
 '{"ejercicios": [23,24]}',    -- Sábado: Cardio moderado
 '{}'                          -- Domingo: Descanso
),
(101, 3,
 '{"ejercicios": [25,26,27]}', -- Lunes: Sentadilla búlgara, Press declinado, Dominadas con peso
 '{"ejercicios": [28,29]}',    -- Martes: Peso muerto sumo, Remo T
 '{"ejercicios": [30,31,32]}', -- Miércoles: Press tras nuca, Curl concentrado, Extensión francesa
 '{"ejercicios": [33,34]}',    -- Jueves: Zancadas caminando, Plancha con elevación
 '{"ejercicios": [25,26,27]}', -- Viernes: Repetición del lunes
 '{"ejercicios": [35,36]}',    -- Sábado: Cardio intenso
 '{}'                          -- Domingo: Descanso
),
(101, 4,
 '{"ejercicios": [37,38,39]}', -- Lunes: Sentadilla overhead, Press banca inclinado, Dominadas explosivas
 '{"ejercicios": [40,41]}',    -- Martes: Peso muerto con bandas, Remo un brazo
 '{"ejercicios": [42,43,44]}', -- Miércoles: Press militar con pausa, Curl 21, Extensión con cuerda
 '{"ejercicios": [45,46]}',    -- Jueves: Zancadas con salto, Plancha con rotación
 '{"ejercicios": [37,38,39]}', -- Viernes: Repetición del lunes
 '{"ejercicios": [47,48]}',    -- Sábado: Cardio HIIT
 '{}'                          -- Domingo: Descanso
),

-- Programa de cardio (102) - 6 semanas
(102, 1,
 '{"ejercicios": [49,50]}',    -- Lunes: Caminata rápida, Burpees
 '{"ejercicios": [51,52]}',    -- Martes: Jumping jacks, Mountain climbers
 '{"ejercicios": [53,54]}',    -- Miércoles: Correr en el lugar, Jump squats
 '{"ejercicios": [55,56]}',    -- Jueves: High knees, Butt kicks
 '{"ejercicios": [57,58]}',    -- Viernes: Jumping lunges, Plank jacks
 '{"ejercicios": [59]}',       -- Sábado: Cardio suave
 '{}'                          -- Domingo: Descanso
),
(102, 2,
 '{"ejercicios": [60,61]}',    -- Lunes: Burpees con salto, Jumping jacks con brazos
 '{"ejercicios": [62,63]}',    -- Martes: Mountain climbers rápidos, Jump squats con salto
 '{"ejercicios": [64,65]}',    -- Miércoles: High knees con brazos, Butt kicks con salto
 '{"ejercicios": [66,67]}',    -- Jueves: Jumping lunges alternados, Plank jacks con salto
 '{"ejercicios": [68,69]}',    -- Viernes: Burpees con push-up, Jumping jacks con salto
 '{"ejercicios": [70]}',       -- Sábado: Cardio moderado
 '{}'                          -- Domingo: Descanso
),

-- Programa completo (103) - 8 semanas
(103, 1,
 '{"ejercicios": [71,72,73]}', -- Lunes: Sentadilla, Press banca, Caminata rápida
 '{"ejercicios": [74,75,76]}', -- Martes: Peso muerto, Remo, Jumping jacks
 '{"ejercicios": [77,78,79]}', -- Miércoles: Press militar, Curl bíceps, Mountain climbers
 '{"ejercicios": [80,81,82]}', -- Jueves: Zancadas, Plancha, Burpees
 '{"ejercicios": [83,84,85]}', -- Viernes: Dominadas, Extensión tríceps, Cardio
 '{"ejercicios": [86]}',       -- Sábado: Actividad recreativa
 '{}'                          -- Domingo: Descanso
),

-- Programa de rehabilitación (104) - 3 semanas
(104, 1,
 '{"ejercicios": [87,88]}',    -- Lunes: Movilidad articular, Estiramientos suaves
 '{"ejercicios": [89,90]}',    -- Martes: Ejercicios isométricos, Respiración
 '{"ejercicios": [91,92]}',    -- Miércoles: Movilidad articular, Estiramientos suaves
 '{"ejercicios": [93,94]}',    -- Jueves: Ejercicios isométricos, Respiración
 '{"ejercicios": [95,96]}',    -- Viernes: Movilidad articular, Estiramientos suaves
 '{}',                         -- Sábado: Descanso
 '{}'                          -- Domingo: Descanso
),

-- Programa de pérdida de peso (105) - 5 semanas
(105, 1,
 '{"ejercicios": [97,98,99]}', -- Lunes: Cardio HIIT, Sentadillas, Plancha
 '{"ejercicios": [100,101]}',  -- Martes: Burpees, Mountain climbers
 '{"ejercicios": [102,103]}',  -- Miércoles: Jump squats, Jumping jacks
 '{"ejercicios": [104,105]}',  -- Jueves: High knees, Butt kicks
 '{"ejercicios": [106,107]}',  -- Viernes: Jumping lunges, Plank jacks
 '{"ejercicios": [108]}',      -- Sábado: Cardio moderado
 '{}'                          -- Domingo: Descanso
)
ON CONFLICT (actividad_id, numero_semana) DO UPDATE SET
    lunes = EXCLUDED.lunes,
    martes = EXCLUDED.martes,
    miercoles = EXCLUDED.miercoles,
    jueves = EXCLUDED.jueves,
    viernes = EXCLUDED.viernes,
    sabado = EXCLUDED.sabado,
    domingo = EXCLUDED.domingo,
    fecha_actualizacion = CURRENT_TIMESTAMP;

-- 3. Insertar datos en la tabla progreso_cliente
INSERT INTO progreso_cliente (actividad_id, cliente_id, fecha, ejercicios_completados, ejercicios_pendientes, detalles_series, minutos_json, calorias_json) VALUES
-- Cliente 202 - Programa de fuerza semana 1
(101, 202, '2025-01-20',  -- Lunes
 ARRAY[1,2,3],  -- Completó sentadilla, press banca, dominadas
 ARRAY[4,5],    -- Pendientes: peso muerto, remo
 '{"1": [{"peso": 80, "series": 3, "repeticiones": 8, "minutos": 15, "calorias": 120}, {"peso": 85, "series": 3, "repeticiones": 6, "minutos": 12, "calorias": 100}], "2": [{"peso": 60, "series": 3, "repeticiones": 10, "minutos": 10, "calorias": 80}], "3": [{"peso": 0, "series": 3, "repeticiones": 5, "minutos": 8, "calorias": 60}]}',
 '{"1": 27, "2": 10, "3": 8}',
 '{"1": 220, "2": 80, "3": 60}'
),
(101, 202, '2025-01-21',  -- Martes
 ARRAY[4,5],    -- Completó peso muerto, remo
 ARRAY[6,7,8],  -- Pendientes: press militar, curl bíceps, extensión tríceps
 '{"4": [{"peso": 100, "series": 3, "repeticiones": 6, "minutos": 18, "calorias": 150}], "5": [{"peso": 50, "series": 3, "repeticiones": 12, "minutos": 15, "calorias": 120}]}',
 '{"4": 18, "5": 15}',
 '{"4": 150, "5": 120}'
),
(101, 202, '2025-01-22',  -- Miércoles
 ARRAY[6,7,8],  -- Completó press militar, curl bíceps, extensión tríceps
 ARRAY[9,10],   -- Pendientes: zancadas, plancha
 '{"6": [{"peso": 40, "series": 3, "repeticiones": 8, "minutos": 12, "calorias": 90}], "7": [{"peso": 15, "series": 3, "repeticiones": 15, "minutos": 10, "calorias": 70}], "8": [{"peso": 20, "series": 3, "repeticiones": 12, "minutos": 8, "calorias": 60}]}',
 '{"6": 12, "7": 10, "8": 8}',
 '{"6": 90, "7": 70, "8": 60}'
),

-- Cliente 203 - Programa de cardio semana 1
(102, 203, '2025-01-20',
 ARRAY[49,50],  -- Completó caminata rápida, burpees
 ARRAY[51,52],  -- Pendientes: jumping jacks, mountain climbers
 '{"49": [{"peso": 0, "series": 1, "repeticiones": 30, "minutos": 20, "calorias": 150}], "50": [{"peso": 0, "series": 3, "repeticiones": 10, "minutos": 15, "calorias": 120}]}',
 '{"49": 20, "50": 15}',
 '{"49": 150, "50": 120}'
),
(102, 203, '2025-01-21',
 ARRAY[51,52],  -- Completó jumping jacks, mountain climbers
 ARRAY[53,54],  -- Pendientes: correr en el lugar, jump squats
 '{"51": [{"peso": 0, "series": 3, "repeticiones": 20, "minutos": 10, "calorias": 80}], "52": [{"peso": 0, "series": 3, "repeticiones": 15, "minutos": 12, "calorias": 100}]}',
 '{"51": 10, "52": 12}',
 '{"51": 80, "52": 100}'
),

-- Cliente 204 - Programa completo semana 1
(103, 204, '2025-01-20',
 ARRAY[71,72],  -- Completó sentadilla, press banca
 ARRAY[73],     -- Pendiente: caminata rápida
 '{"71": [{"peso": 70, "series": 3, "repeticiones": 10, "minutos": 15, "calorias": 110}], "72": [{"peso": 55, "series": 3, "repeticiones": 8, "minutos": 12, "calorias": 90}]}',
 '{"71": 15, "72": 12}',
 '{"71": 110, "72": 90}'
),
(103, 204, '2025-01-21',
 ARRAY[74,75],  -- Completó peso muerto, remo
 ARRAY[76],     -- Pendiente: jumping jacks
 '{"74": [{"peso": 90, "series": 3, "repeticiones": 6, "minutos": 18, "calorias": 140}], "75": [{"peso": 45, "series": 3, "repeticiones": 10, "minutos": 15, "calorias": 110}]}',
 '{"74": 18, "75": 15}',
 '{"74": 140, "75": 110}'
),

-- Cliente 205 - Programa de rehabilitación semana 1
(104, 205, '2025-01-20',
 ARRAY[87,88],  -- Completó movilidad articular, estiramientos suaves
 ARRAY[89,90],  -- Pendientes: ejercicios isométricos, respiración
 '{"87": [{"peso": 0, "series": 1, "repeticiones": 1, "minutos": 15, "calorias": 30}], "88": [{"peso": 0, "series": 1, "repeticiones": 1, "minutos": 20, "calorias": 25}]}',
 '{"87": 15, "88": 20}',
 '{"87": 30, "88": 25}'
),

-- Cliente 206 - Programa de pérdida de peso semana 1
(105, 206, '2025-01-20',
 ARRAY[97,98],  -- Completó cardio HIIT, sentadillas
 ARRAY[99],     -- Pendiente: plancha
 '{"97": [{"peso": 0, "series": 1, "repeticiones": 1, "minutos": 25, "calorias": 200}], "98": [{"peso": 0, "series": 3, "repeticiones": 15, "minutos": 10, "calorias": 80}]}',
 '{"97": 25, "98": 10}',
 '{"97": 200, "98": 80}'
),
(105, 206, '2025-01-21',
 ARRAY[100,101], -- Completó burpees, mountain climbers
 ARRAY[102,103], -- Pendientes: jump squats, jumping jacks
 '{"100": [{"peso": 0, "series": 3, "repeticiones": 8, "minutos": 15, "calorias": 120}], "101": [{"peso": 0, "series": 3, "repeticiones": 20, "minutos": 12, "calorias": 100}]}',
 '{"100": 15, "101": 12}',
 '{"100": 120, "101": 100}'
);

-- 4. Verificar los datos insertados
SELECT 'Datos insertados exitosamente' as estado, 
       (SELECT COUNT(*) FROM periodos) as cantidad_periodos,
       (SELECT COUNT(*) FROM planificacion_ejercicios) as cantidad_planificaciones,
       (SELECT COUNT(*) FROM progreso_cliente) as cantidad_progresos;

-- 5. Mostrar estadísticas de los datos insertados
SELECT 
    'Periodos' as tabla,
    COUNT(*) as total_registros,
    MIN(cantidad_periodos) as minimo_periodos,
    MAX(cantidad_periodos) as maximo_periodos,
    AVG(cantidad_periodos)::numeric(4,2) as promedio_periodos
FROM periodos
UNION ALL
SELECT 
    'Planificacion Ejercicios' as tabla,
    COUNT(*) as total_registros,
    MIN(numero_semana) as minimo_semana,
    MAX(numero_semana) as maximo_semana,
    AVG(numero_semana)::numeric(4,2) as promedio_semana
FROM planificacion_ejercicios
UNION ALL
SELECT 
    'Progreso Cliente' as tabla,
    COUNT(*) as total_registros,
    MIN(EXTRACT(DAY FROM fecha)) as minimo_dia,
    MAX(EXTRACT(DAY FROM fecha)) as maximo_dia,
    AVG(EXTRACT(DAY FROM fecha))::numeric(4,2) as promedio_dia
FROM progreso_cliente;

-- 6. Mostrar algunos ejemplos de los datos insertados
SELECT 'Ejemplos de Periodos:' as tipo_dato;
SELECT actividad_id, cantidad_periodos FROM periodos ORDER BY actividad_id LIMIT 5;

SELECT 'Ejemplos de Planificacion:' as tipo_dato;
SELECT actividad_id, numero_semana, lunes, martes FROM planificacion_ejercicios ORDER BY actividad_id, numero_semana LIMIT 5;

SELECT 'Ejemplos de Progreso:' as tipo_dato;
SELECT actividad_id, cliente_id, fecha, ejercicios_completados FROM progreso_cliente ORDER BY fecha DESC LIMIT 5;






















