-- =====================================================
-- CONSULTA FINAL CORREGIDA - DETALLES DEL CLIENTE
-- =====================================================
-- Esta consulta obtiene toda la información detallada de un cliente
-- CON NOMBRES CORRECTOS DE COLUMNAS VERIFICADOS

-- Reemplaza 'CLIENT_ID_AQUI' con el ID real del cliente
-- Ejemplo: '00dedc23-0b17-4e50-b84e-b2e8100dc93c'

-- =====================================================
-- 1. PERFIL DEL CLIENTE
-- =====================================================
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

-- =====================================================
-- 2. LESIONES DEL CLIENTE
-- =====================================================
SELECT 
    'INJURIES' as tipo,
    json_agg(
        json_build_object(
            'id', ui.id,
            'name', ui.name,                    -- ✅ CORREGIDO: era 'injury_name'
            'description', ui.description,
            'severity', ui.severity,
            'restrictions', ui.restrictions,    -- ✅ CORREGIDO: era 'affected_area'
            'created_at', ui.created_at,
            'updated_at', ui.updated_at
        )
    ) as datos
FROM user_injuries ui
WHERE ui.user_id = 'CLIENT_ID_AQUI' -- Cambiar por ID real

UNION ALL

-- =====================================================
-- 3. BIOMÉTRICAS DEL CLIENTE
-- =====================================================
SELECT 
    'BIOMETRICS' as tipo,
    json_agg(
        json_build_object(
            'id', ub.id,
            'name', ub.name,                    -- ✅ CORREGIDO: era 'height', 'weight', etc.
            'value', ub.value,                  -- ✅ CORREGIDO: era 'height', 'weight'
            'unit', ub.unit,                    -- ✅ CORREGIDO: era 'kg', 'cm'
            'notes', ub.notes,
            'created_at', ub.created_at,
            'updated_at', ub.updated_at
        )
    ) as datos
FROM user_biometrics ub
WHERE ub.user_id = 'CLIENT_ID_AQUI' -- Cambiar por ID real

UNION ALL

-- =====================================================
-- 4. OBJETIVOS DE EJERCICIO DEL CLIENTE
-- =====================================================
SELECT 
    'OBJECTIVES' as tipo,
    json_agg(
        json_build_object(
            'id', ueo.id,
            'exercise_title', ueo.exercise_title,  -- ✅ CORREGIDO: era 'objective_type'
            'unit', ueo.unit,
            'current_value', ueo.current_value,
            'objective', ueo.objective,            -- ✅ CORREGIDO: era 'target_value'
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

-- =====================================================
-- RESUMEN DE CORRECCIONES REALIZADAS:
-- =====================================================
-- 
-- user_injuries:
-- ❌ injury_name → ✅ name
-- ❌ affected_area → ✅ restrictions
-- ❌ date_occurred → ✅ created_at
-- ❌ recovery_status → ❌ (no existe)
-- ❌ notes → ❌ (no existe)
--
-- user_biometrics:
-- ❌ height, weight, body_fat_percentage, muscle_mass → ✅ name, value, unit
-- ❌ measurement_date → ✅ created_at
--
-- user_exercise_objectives:
-- ❌ objective_type → ✅ exercise_title
-- ❌ target_value → ✅ objective
-- ❌ target_date → ❌ (no existe)
-- ❌ priority → ❌ (no existe)
-- ❌ status → ❌ (no existe)
--
-- =====================================================
































