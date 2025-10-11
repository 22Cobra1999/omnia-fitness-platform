-- Script para crear las nuevas tablas del sistema mejorado
-- Ejecutar en orden para evitar dependencias

-- 1. Tabla de períodos (la más simple, sin dependencias)
\i create_periods_table.sql

-- 2. Tabla de planificación de ejercicios
\i create_exercise_planning_table.sql

-- 3. Tabla de progreso del cliente
\i create_client_progress_table.sql

-- Verificar que las tablas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('periods', 'exercise_planning', 'client_progress')
ORDER BY tablename;

-- Mostrar información de las tablas creadas
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_name IN ('periods', 'exercise_planning', 'client_progress')
    AND t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;





























