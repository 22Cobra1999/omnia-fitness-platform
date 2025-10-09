-- Script maestro para crear todas las nuevas tablas del sistema mejorado en español
-- Ejecutar en orden para evitar dependencias

-- 1. Tabla de períodos (la más simple, sin dependencias)
\i crear_tabla_periodos.sql

-- 2. Tabla de planificación de ejercicios
\i crear_tabla_planificacion_ejercicios.sql

-- 3. Tabla de progreso del cliente
\i crear_tabla_progreso_cliente.sql

-- Verificar que las tablas se crearon correctamente
SELECT 
    schemaname as esquema,
    tablename as nombre_tabla,
    tableowner as propietario
FROM pg_tables 
WHERE tablename IN ('periodos', 'planificacion_ejercicios', 'progreso_cliente')
ORDER BY tablename;

-- Mostrar información de las tablas creadas
SELECT 
    t.table_name as nombre_tabla,
    c.column_name as nombre_columna,
    c.data_type as tipo_dato,
    c.is_nullable as permite_nulo,
    c.column_default as valor_por_defecto
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_name IN ('periodos', 'planificacion_ejercicios', 'progreso_cliente')
    AND t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- Mostrar resumen de tablas creadas
SELECT 
    'Tablas creadas exitosamente' as estado,
    COUNT(*) as total_tablas
FROM pg_tables 
WHERE tablename IN ('periodos', 'planificacion_ejercicios', 'progreso_cliente');




























