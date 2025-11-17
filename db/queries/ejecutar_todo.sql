-- Script maestro para crear y poblar todas las tablas
-- Ejecutar en orden para evitar dependencias

-- 1. Crear todas las tablas
\i crear_todas_las_tablas.sql

-- 2. Poblar con datos básicos (descomenta la línea que prefieras)
\i poblar_tablas_basico.sql
-- \i poblar_tablas_completo.sql

-- 3. Verificar que todo se creó correctamente
SELECT 
    'Resumen final' as estado,
    (SELECT COUNT(*) FROM periodos) as periodos_creados,
    (SELECT COUNT(*) FROM planificacion_ejercicios) as planificaciones_creadas,
    (SELECT COUNT(*) FROM progreso_cliente) as progresos_creados,
    NOW() as fecha_creacion;

-- 4. Mostrar estructura de las tablas
SELECT 
    t.table_name as tabla,
    COUNT(c.column_name) as cantidad_columnas
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_name IN ('periodos', 'planificacion_ejercicios', 'progreso_cliente')
    AND t.table_schema = 'public'
GROUP BY t.table_name
ORDER BY t.table_name;






























