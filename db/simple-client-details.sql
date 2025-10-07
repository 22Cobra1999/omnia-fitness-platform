-- =====================================================
-- CONSULTA SIMPLE DE DETALLES DEL CLIENTE
-- =====================================================
-- Consulta directa con nombres correctos de columnas
-- Reemplaza 'CLIENT_ID_AQUI' con el ID real del cliente

-- 1. PERFIL DEL CLIENTE
SELECT 
    'PROFILE' as tipo,
    json_build_object(
        'id', up.id,
        'full_name', up.full_name,
        'email', up.email,
        'avatar_url', up.avatar_url,
        'created_at', up.created_at
    ) as datos
FROM user_profiles up
WHERE up.id = 'CLIENT_ID_AQUI' -- Cambiar por ID real

UNION ALL

-- 2. LESIONES DEL CLIENTE
SELECT 
    'INJURIES' as tipo,
    json_agg(
        json_build_object(
            'id', ui.id,
            'name', ui.name,
            'description', ui.description,
            'severity', ui.severity,
            'restrictions', ui.restrictions,
            'created_at', ui.created_at,
            'updated_at', ui.updated_at
        )
    ) as datos
FROM user_injuries ui
WHERE ui.user_id = 'CLIENT_ID_AQUI' -- Cambiar por ID real

UNION ALL

-- 3. BIOMÉTRICAS DEL CLIENTE
SELECT 
    'BIOMETRICS' as tipo,
    json_agg(
        json_build_object(
            'id', ub.id,
            'name', ub.name,
            'value', ub.value,
            'unit', ub.unit,
            'notes', ub.notes,
            'created_at', ub.created_at,
            'updated_at', ub.updated_at
        )
    ) as datos
FROM user_biometrics ub
WHERE ub.user_id = 'CLIENT_ID_AQUI' -- Cambiar por ID real

UNION ALL

-- 4. OBJETIVOS DE EJERCICIO DEL CLIENTE
SELECT 
    'OBJECTIVES' as tipo,
    json_agg(
        json_build_object(
            'id', ueo.id,
            'exercise_title', ueo.exercise_title,
            'unit', ueo.unit,
            'current_value', ueo.current_value,
            'objective', ueo.objective,
            'progress_percentage', CASE 
                WHEN ueo.objective > 0 THEN ROUND((ueo.current_value::DECIMAL / ueo.objective) * 100, 2)
                ELSE 0 
            END,
            'created_at', ueo.created_at,
            'updated_at', ueo.updated_at
        )
    ) as datos
FROM user_exercise_objectives ueo
WHERE ueo.user_id = 'CLIENT_ID_AQUI' -- Cambiar por ID real;



























