-- =====================================================
-- CONSULTA COMPLETA DE DETALLES DEL CLIENTE (CORREGIDA)
-- =====================================================
-- Esta consulta obtiene toda la información detallada de un cliente
-- Incluye: perfil, lesiones, biométricas, objetivos de ejercicio
-- CON NOMBRES CORRECTOS DE COLUMNAS

-- Reemplaza 'CLIENT_ID_AQUI' con el ID real del cliente
WITH client_profile AS (
    SELECT 
        id,
        full_name,
        email,
        avatar_url,
        created_at
    FROM user_profiles 
    WHERE id = 'CLIENT_ID_AQUI' -- Cambiar por ID real
),
client_injuries AS (
    SELECT 
        id,
        name,
        description,
        severity,
        restrictions,
        created_at,
        updated_at
    FROM user_injuries 
    WHERE user_id = 'CLIENT_ID_AQUI' -- Cambiar por ID real
),
client_biometrics AS (
    SELECT 
        id,
        name,
        value,
        unit,
        notes,
        created_at,
        updated_at
    FROM user_biometrics 
    WHERE user_id = 'CLIENT_ID_AQUI' -- Cambiar por ID real
    ORDER BY created_at DESC
),
client_objectives AS (
    SELECT 
        id,
        exercise_title,
        unit,
        current_value,
        objective,
        created_at,
        updated_at
    FROM user_exercise_objectives 
    WHERE user_id = 'CLIENT_ID_AQUI' -- Cambiar por ID real
    ORDER BY created_at DESC
)
SELECT 
    'PROFILE' as data_type,
    json_build_object(
        'id', cp.id,
        'full_name', cp.full_name,
        'email', cp.email,
        'avatar_url', cp.avatar_url,
        'created_at', cp.created_at
    ) as data
FROM client_profile cp

UNION ALL

SELECT 
    'INJURIES' as data_type,
    json_agg(
        json_build_object(
            'id', ci.id,
            'name', ci.name,
            'description', ci.description,
            'severity', ci.severity,
            'restrictions', ci.restrictions,
            'created_at', ci.created_at,
            'updated_at', ci.updated_at
        )
    ) as data
FROM client_injuries ci

UNION ALL

SELECT 
    'BIOMETRICS' as data_type,
    json_agg(
        json_build_object(
            'id', cb.id,
            'name', cb.name,
            'value', cb.value,
            'unit', cb.unit,
            'notes', cb.notes,
            'created_at', cb.created_at,
            'updated_at', cb.updated_at
        )
    ) as data
FROM client_biometrics cb

UNION ALL

SELECT 
    'OBJECTIVES' as data_type,
    json_agg(
        json_build_object(
            'id', co.id,
            'exercise_title', co.exercise_title,
            'unit', co.unit,
            'current_value', co.current_value,
            'objective', co.objective,
            'created_at', co.created_at,
            'updated_at', co.updated_at
        )
    ) as data
FROM client_objectives co;



























