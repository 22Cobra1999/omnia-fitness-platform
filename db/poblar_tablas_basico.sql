-- Script básico para poblar las tablas con datos mínimos
-- Ejecutar después de crear las tablas

-- 1. Insertar datos básicos en la tabla periodos
INSERT INTO periodos (actividad_id, cantidad_periodos) VALUES
(101, 3),
(102, 2),
(103, 4)
ON CONFLICT (actividad_id) DO UPDATE SET 
    cantidad_periodos = EXCLUDED.cantidad_periodos;

-- 2. Insertar datos básicos en la tabla planificacion_ejercicios
INSERT INTO planificacion_ejercicios (actividad_id, numero_semana, lunes, martes, miercoles, jueves, viernes, sabado, domingo) VALUES
-- Actividad 101 - Semana 1
(101, 1, 
 '{"ejercicios": [1,2]}',
 '{"ejercicios": [3]}',
 '{"ejercicios": [4]}',
 '{"ejercicios": [5]}',
 '{"ejercicios": [1,2]}',
 '{"ejercicios": [6]}',
 '{}'
),
-- Actividad 101 - Semana 2
(101, 2,
 '{"ejercicios": [7,8]}',
 '{"ejercicios": [9]}',
 '{"ejercicios": [10]}',
 '{"ejercicios": [11]}',
 '{"ejercicios": [7,8]}',
 '{"ejercicios": [12]}',
 '{}'
),
-- Actividad 101 - Semana 3
(101, 3,
 '{"ejercicios": [13,14]}',
 '{"ejercicios": [15]}',
 '{"ejercicios": [16]}',
 '{"ejercicios": [17]}',
 '{"ejercicios": [13,14]}',
 '{"ejercicios": [18]}',
 '{}'
),
-- Actividad 102 - Semana 1
(102, 1,
 '{"ejercicios": [19,20]}',
 '{"ejercicios": [21]}',
 '{"ejercicios": [22]}',
 '{}',
 '{"ejercicios": [23,24]}',
 '{}',
 '{}'
),
-- Actividad 102 - Semana 2
(102, 2,
 '{"ejercicios": [25,26]}',
 '{"ejercicios": [27]}',
 '{"ejercicios": [28]}',
 '{}',
 '{"ejercicios": [29,30]}',
 '{}',
 '{}'
),
-- Actividad 103 - Semana 1
(103, 1,
 '{"ejercicios": [31,32,33]}',
 '{"ejercicios": [34]}',
 '{"ejercicios": [35]}',
 '{"ejercicios": [36]}',
 '{"ejercicios": [31,32,33]}',
 '{"ejercicios": [37]}',
 '{}'
)
ON CONFLICT (actividad_id, numero_semana) DO UPDATE SET
    lunes = EXCLUDED.lunes,
    martes = EXCLUDED.martes,
    miercoles = EXCLUDED.miercoles,
    jueves = EXCLUDED.jueves,
    viernes = EXCLUDED.viernes,
    sabado = EXCLUDED.sabado,
    domingo = EXCLUDED.domingo;

-- 3. Insertar datos básicos en la tabla progreso_cliente
INSERT INTO progreso_cliente (actividad_id, cliente_id, fecha, ejercicios_completados, ejercicios_pendientes, detalles_series, minutos_json, calorias_json) VALUES
-- Cliente 202 - Actividad 101
(101, 202, '2025-01-20',
 ARRAY[1,2],
 ARRAY[3,4,5],
 '{"1": [{"peso": 50, "series": 3, "repeticiones": 10, "minutos": 15, "calorias": 100}], "2": [{"peso": 30, "series": 3, "repeticiones": 12, "minutos": 12, "calorias": 80}]}',
 '{"1": 15, "2": 12}',
 '{"1": 100, "2": 80}'
),
(101, 202, '2025-01-21',
 ARRAY[3],
 ARRAY[4,5],
 '{"3": [{"peso": 40, "series": 3, "repeticiones": 8, "minutos": 18, "calorias": 120}]}',
 '{"3": 18}',
 '{"3": 120}'
),
-- Cliente 203 - Actividad 102
(102, 203, '2025-01-20',
 ARRAY[19,20],
 ARRAY[21,22],
 '{"19": [{"peso": 0, "series": 1, "repeticiones": 30, "minutos": 20, "calorias": 150}], "20": [{"peso": 0, "series": 3, "repeticiones": 10, "minutos": 15, "calorias": 120}]}',
 '{"19": 20, "20": 15}',
 '{"19": 150, "20": 120}'
),
-- Cliente 204 - Actividad 103
(103, 204, '2025-01-20',
 ARRAY[31,32],
 ARRAY[33],
 '{"31": [{"peso": 60, "series": 3, "repeticiones": 8, "minutos": 15, "calorias": 110}], "32": [{"peso": 45, "series": 3, "repeticiones": 10, "minutos": 12, "calorias": 90}]}',
 '{"31": 15, "32": 12}',
 '{"31": 110, "32": 90}'
);

-- 4. Verificar los datos insertados
SELECT 'Datos básicos insertados' as estado, 
       (SELECT COUNT(*) FROM periodos) as periodos,
       (SELECT COUNT(*) FROM planificacion_ejercicios) as planificaciones,
       (SELECT COUNT(*) FROM progreso_cliente) as progresos;

-- 5. Mostrar ejemplos de los datos
SELECT 'Periodos:' as tabla, actividad_id, cantidad_periodos FROM periodos;
SELECT 'Planificacion:' as tabla, actividad_id, numero_semana, lunes, martes FROM planificacion_ejercicios;
SELECT 'Progreso:' as tabla, actividad_id, cliente_id, fecha, ejercicios_completados FROM progreso_cliente;






















