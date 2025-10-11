-- Script con datos de ejemplo para las nuevas tablas en español

-- Insertar datos de ejemplo en la tabla periodos
INSERT INTO periodos (actividad_id, cantidad_periodos) VALUES
(101, 3),
(102, 2),
(103, 4)
ON CONFLICT (actividad_id) DO UPDATE SET 
    cantidad_periodos = EXCLUDED.cantidad_periodos,
    fecha_actualizacion = CURRENT_TIMESTAMP;

-- Insertar datos de ejemplo en la tabla planificacion_ejercicios
INSERT INTO planificacion_ejercicios (actividad_id, numero_semana, lunes, martes, miercoles, jueves, viernes, sabado, domingo) VALUES
-- Semana 1
(101, 1, 
 '{"ejercicios": [5,6]}',
 '{"ejercicios": [7]}',
 '{"ejercicios": [8]}',
 '{"ejercicios": [9]}',
 '{"ejercicios": [10,11]}',
 '{"ejercicios": [12]}',
 '{}'
),
-- Semana 2
(101, 2,
 '{"ejercicios": [5,6]}',
 '{"ejercicios": [7]}',
 '{"ejercicios": [8]}',
 '{"ejercicios": [9]}',
 '{"ejercicios": [10,11]}',
 '{"ejercicios": [12]}',
 '{}'
),
-- Semana 3
(101, 3,
 '{"ejercicios": [5,6]}',
 '{"ejercicios": [7]}',
 '{"ejercicios": [8]}',
 '{"ejercicios": [9]}',
 '{"ejercicios": [10,11]}',
 '{"ejercicios": [12]}',
 '{}'
),
-- Actividad 102 - Semana 1
(102, 1,
 '{"ejercicios": [1,2]}',
 '{"ejercicios": [3]}',
 '{"ejercicios": [4]}',
 '{}',
 '{"ejercicios": [5,6]}',
 '{}',
 '{}'
),
-- Actividad 102 - Semana 2
(102, 2,
 '{"ejercicios": [1,2]}',
 '{"ejercicios": [3]}',
 '{"ejercicios": [4]}',
 '{}',
 '{"ejercicios": [5,6]}',
 '{}',
 '{}'
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

-- Insertar datos de ejemplo en la tabla progreso_cliente
INSERT INTO progreso_cliente (actividad_id, cliente_id, fecha, ejercicios_completados, ejercicios_pendientes, detalles_series, minutos_json, calorias_json) VALUES
(101, 202, '2025-01-25',
 ARRAY[5,6],
 ARRAY[1,2,3,4],
 '{"5": [{"peso": 80, "series": 4, "repeticiones": 8, "minutos": 12, "calorias": 90}, {"peso": 85, "series": 3, "repeticiones": 6, "minutos": 10, "calorias": 70}, {"peso": 90, "series": 2, "repeticiones": 4, "minutos": 8, "calorias": 60}], "6": [{"peso": 30, "series": 3, "repeticiones": 15, "minutos": 15, "calorias": 100}]}',
 '{"5": 30, "6": 15}',
 '{"5": 220, "6": 100}'
),
(101, 203, '2025-01-25',
 ARRAY[7,8],
 ARRAY[9,10,11,12],
 '{"7": [{"peso": 50, "series": 3, "repeticiones": 12, "minutos": 20, "calorias": 150}], "8": [{"peso": 25, "series": 4, "repeticiones": 15, "minutos": 18, "calorias": 120}]}',
 '{"7": 20, "8": 18}',
 '{"7": 150, "8": 120}'
),
(102, 202, '2025-01-26',
 ARRAY[1,2,3],
 ARRAY[4,5,6],
 '{"1": [{"peso": 40, "series": 3, "repeticiones": 10, "minutos": 15, "calorias": 100}], "2": [{"peso": 35, "series": 3, "repeticiones": 12, "minutos": 12, "calorias": 80}], "3": [{"peso": 30, "series": 2, "repeticiones": 15, "minutos": 10, "calorias": 60}]}',
 '{"1": 15, "2": 12, "3": 10}',
 '{"1": 100, "2": 80, "3": 60}'
);

-- Verificar los datos insertados
SELECT 'periodos' as tabla, COUNT(*) as registros FROM periodos
UNION ALL
SELECT 'planificacion_ejercicios' as tabla, COUNT(*) as registros FROM planificacion_ejercicios
UNION ALL
SELECT 'progreso_cliente' as tabla, COUNT(*) as registros FROM progreso_cliente;

-- Mostrar algunos ejemplos de los datos
SELECT 'Periodos' as tabla, actividad_id, cantidad_periodos FROM periodos LIMIT 3;
SELECT 'Planificacion Ejercicios' as tabla, actividad_id, numero_semana, lunes, martes FROM planificacion_ejercicios LIMIT 3;
SELECT 'Progreso Cliente' as tabla, actividad_id, cliente_id, fecha, ejercicios_completados FROM progreso_cliente LIMIT 3;





























