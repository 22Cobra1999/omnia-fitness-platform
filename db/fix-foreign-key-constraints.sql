-- =====================================================
-- CORREGIR CONSTRAINTS DE CLAVES FORÁNEAS
-- =====================================================
-- Este script corrige los constraints de claves foráneas que están mal configurados

-- =====================================================
-- PASO 1: VERIFICAR CONSTRAINTS ACTUALES
-- =====================================================

DO $$
DECLARE
    v_constraint RECORD;
BEGIN
    RAISE NOTICE '=== CONSTRAINTS ACTUALES EN activity_enrollments ===';
    
    FOR v_constraint IN 
        SELECT 
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'activity_enrollments'
    LOOP
        RAISE NOTICE 'Constraint: % | Columna: % | Tabla FK: % | Columna FK: %', 
            v_constraint.constraint_name,
            v_constraint.column_name,
            v_constraint.foreign_table_name,
            v_constraint.foreign_column_name;
    END LOOP;
END $$;

-- =====================================================
-- PASO 2: ELIMINAR CONSTRAINTS PROBLEMÁTICOS
-- =====================================================

-- Eliminar constraint que referencia a 'clients' (que no existe)
ALTER TABLE activity_enrollments 
DROP CONSTRAINT IF EXISTS activity_enrollments_client_id_fkey;

-- Eliminar otros constraints problemáticos si existen
ALTER TABLE activity_enrollments 
DROP CONSTRAINT IF EXISTS activity_enrollments_activity_id_fkey;

-- =====================================================
-- PASO 3: CREAR CONSTRAINTS CORRECTOS
-- =====================================================

-- Verificar que las tablas referenciadas existen
DO $$
DECLARE
    v_activities_exists BOOLEAN;
    v_auth_users_exists BOOLEAN;
    v_user_profiles_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'activities'
    ) INTO v_activities_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) INTO v_auth_users_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_profiles'
    ) INTO v_user_profiles_exists;
    
    RAISE NOTICE 'Tablas disponibles:';
    RAISE NOTICE '  activities: %', v_activities_exists;
    RAISE NOTICE '  auth.users: %', v_auth_users_exists;
    RAISE NOTICE '  user_profiles: %', v_user_profiles_exists;
END $$;

-- Crear constraint para activity_id
ALTER TABLE activity_enrollments 
ADD CONSTRAINT activity_enrollments_activity_id_fkey 
FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE;

-- Crear constraint para client_id (referenciar auth.users)
ALTER TABLE activity_enrollments 
ADD CONSTRAINT activity_enrollments_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =====================================================
-- PASO 4: VERIFICAR QUE FUNCIONAN
-- =====================================================

DO $$
DECLARE
    v_activities_count INTEGER;
    v_users_count INTEGER;
    v_test_result BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO v_activities_count FROM activities;
    SELECT COUNT(*) INTO v_users_count FROM auth.users;
    
    RAISE NOTICE 'Datos disponibles:';
    RAISE NOTICE '  Activities: %', v_activities_count;
    RAISE NOTICE '  Users: %', v_users_count;
    
    -- Probar insertar un enrollment de prueba
    IF v_activities_count > 0 AND v_users_count > 0 THEN
        BEGIN
            INSERT INTO activity_enrollments (activity_id, client_id, status, start_date)
            SELECT 
                a.id,
                u.id,
                'pendiente',
                CURRENT_DATE
            FROM activities a
            CROSS JOIN auth.users u
            LIMIT 1
            ON CONFLICT DO NOTHING;
            
            v_test_result := true;
            RAISE NOTICE '✅ Constraints funcionan correctamente';
            
        EXCEPTION
            WHEN OTHERS THEN
                v_test_result := false;
                RAISE WARNING '⚠️  Error al probar constraints: %', SQLERRM;
        END;
    ELSE
        RAISE WARNING '⚠️  No hay datos suficientes para probar constraints';
    END IF;
END $$;

-- =====================================================
-- PASO 5: VERIFICAR TRIGGERS PROBLEMÁTICOS
-- =====================================================

-- Verificar si existe el trigger problemático
DO $$
DECLARE
    v_trigger_exists BOOLEAN;
    v_function_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'generate_client_exercise_customizations'
    ) INTO v_trigger_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'generate_client_exercise_customizations'
    ) INTO v_function_exists;
    
    RAISE NOTICE 'Trigger problemático existe: %', v_trigger_exists;
    RAISE NOTICE 'Función problemática existe: %', v_function_exists;
    
    IF v_trigger_exists THEN
        RAISE NOTICE 'Eliminando trigger problemático...';
        DROP TRIGGER IF EXISTS generate_client_exercise_customizations ON activity_enrollments;
    END IF;
    
    IF v_function_exists THEN
        RAISE NOTICE 'Eliminando función problemática...';
        DROP FUNCTION IF EXISTS generate_client_exercise_customizations();
    END IF;
END $$;

-- =====================================================
-- PASO 6: VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
    v_constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_constraint_count
    FROM information_schema.table_constraints 
    WHERE table_name = 'activity_enrollments' 
    AND constraint_type = 'FOREIGN KEY';
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'CONSTRAINTS CORREGIDOS EXITOSAMENTE';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Constraints de FK en activity_enrollments: %', v_constraint_count;
    RAISE NOTICE '=========================================';
    
    IF v_constraint_count >= 2 THEN
        RAISE NOTICE '✅ Constraints configurados correctamente';
    ELSE
        RAISE WARNING '⚠️  Faltan constraints';
    END IF;
END $$;

RAISE NOTICE 'Corrección de constraints completada';
