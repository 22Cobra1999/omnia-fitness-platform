-- =====================================================
-- CONSULTA PARA VERIFICAR ESTRUCTURA DE TABLAS DE USUARIO
-- =====================================================
-- Este script verifica las columnas y estructura de las tablas relacionadas con el usuario

-- 1. Verificar estructura de user_injuries
SELECT 
    'user_injuries' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_injuries' 
ORDER BY ordinal_position;

-- 2. Verificar estructura de user_biometrics
SELECT 
    'user_biometrics' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_biometrics' 
ORDER BY ordinal_position;

-- 3. Verificar estructura de user_exercise_objectives
SELECT 
    'user_exercise_objectives' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_exercise_objectives' 
ORDER BY ordinal_position;

-- 4. Consulta completa para obtener datos de un cliente específico
-- (Reemplaza 'CLIENT_ID_AQUI' con el ID real del cliente)
WITH client_data AS (
    SELECT 
        up.id as client_id,
        up.full_name,
        up.email,
        up.avatar_url
    FROM user_profiles up
    WHERE up.id = 'CLIENT_ID_AQUI' -- Cambiar por ID real
)
SELECT 
    'CLIENT_INFO' as tipo,
    cd.client_id,
    cd.full_name,
    cd.email,
    cd.avatar_url
FROM client_data cd

UNION ALL

-- Lesiones del cliente
SELECT 
    'INJURIES' as tipo,
    ui.id,
    ui.injury_name,
    ui.description,
    ui.severity,
    ui.affected_area,
    ui.date_occurred,
    ui.recovery_status,
    ui.notes
FROM user_injuries ui
JOIN client_data cd ON ui.user_id = cd.client_id

UNION ALL

-- Biométricas del cliente
SELECT 
    'BIOMETRICS' as tipo,
    ub.id,
    ub.height,
    ub.weight,
    ub.body_fat_percentage,
    ub.muscle_mass,
    ub.measurement_date,
    ub.notes
FROM user_biometrics ub
JOIN client_data cd ON ub.user_id = cd.client_id

UNION ALL

-- Objetivos de ejercicio del cliente
SELECT 
    'EXERCISE_OBJECTIVES' as tipo,
    ueo.id,
    ueo.objective_type,
    ueo.description,
    ueo.target_value,
    ueo.current_value,
    ueo.target_date,
    ueo.priority,
    ueo.status
FROM user_exercise_objectives ueo
JOIN client_data cd ON ueo.user_id = cd.client_id;


























