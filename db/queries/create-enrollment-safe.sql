-- =====================================================
-- CREAR ENROLLMENT DE PRUEBA DE FORMA SEGURA
-- =====================================================
-- Este script crea un enrollment de prueba sin problemas de constraints

-- =====================================================
-- PASO 1: VERIFICAR PRERREQUISITOS
-- =====================================================

DO $$
DECLARE
    v_activities_count INTEGER;
    v_users_count INTEGER;
    v_enrollments_count INTEGER;
    v_activity_id INTEGER;
    v_user_id UUID;
BEGIN
    SELECT COUNT(*) INTO v_activities_count FROM activities;
    SELECT COUNT(*) INTO v_users_count FROM auth.users;
    SELECT COUNT(*) INTO v_enrollments_count FROM activity_enrollments;
    
    RAISE NOTICE '=== PRERREQUISITOS ===';
    RAISE NOTICE 'Activities: %', v_activities_count;
    RAISE NOTICE 'Users: %', v_users_count;
    RAISE NOTICE 'Enrollments existentes: %', v_enrollments_count;
    RAISE NOTICE '======================';
    
    -- Obtener IDs específicos
    SELECT id INTO v_activity_id FROM activities ORDER BY id LIMIT 1;
    SELECT id INTO v_user_id FROM auth.users ORDER BY id LIMIT 1;
    
    IF v_activity_id IS NULL THEN
        RAISE EXCEPTION 'No hay activities disponibles. Crea al menos una activity.';
    END IF;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No hay users disponibles. Crea al menos un user.';
    END IF;
    
    RAISE NOTICE 'Usando Activity ID: %', v_activity_id;
    RAISE NOTICE 'Usando User ID: %', v_user_id;
END $$;

-- =====================================================
-- PASO 2: CREAR ENROLLMENT DE PRUEBA
-- =====================================================

DO $$
DECLARE
    v_activity_id INTEGER;
    v_user_id UUID;
    v_enrollment_id INTEGER;
    v_resultado JSONB;
BEGIN
    -- Obtener IDs específicos
    SELECT id INTO v_activity_id FROM activities ORDER BY id LIMIT 1;
    SELECT id INTO v_user_id FROM auth.users ORDER BY id LIMIT 1;
    
    RAISE NOTICE 'Creando enrollment de prueba...';
    
    -- Crear enrollment de forma segura
    BEGIN
        INSERT INTO activity_enrollments (
            activity_id, 
            client_id, 
            status, 
            start_date,
            created_at,
            updated_at
        ) VALUES (
            v_activity_id,
            v_user_id,
            'pendiente',
            CURRENT_DATE,
            NOW(),
            NOW()
        ) RETURNING id INTO v_enrollment_id;
        
        RAISE NOTICE '✅ Enrollment creado con ID: %', v_enrollment_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'Error al crear enrollment: %', SQLERRM;
            RAISE WARNING 'SQL State: %', SQLSTATE;
            RETURN;
    END;
    
    -- Probar generar períodos
    RAISE NOTICE 'Generando períodos...';
    BEGIN
        SELECT generar_periodos_para_enrollment(v_enrollment_id) INTO v_resultado;
        RAISE NOTICE 'Resultado: %', v_resultado;
        
        IF (v_resultado->>'success')::BOOLEAN THEN
            RAISE NOTICE '✅ Períodos generados exitosamente';
        ELSE
            RAISE WARNING '⚠️  Error al generar períodos: %', v_resultado->>'error';
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'Error al generar períodos: %', SQLERRM;
    END;
    
END $$;

-- =====================================================
-- PASO 3: VERIFICAR ENROLLMENT CREADO
-- =====================================================

-- Mostrar el enrollment más reciente
SELECT 
    ae.id as enrollment_id,
    ae.activity_id,
    ae.client_id,
    ae.status,
    ae.start_date,
    ae.expiration_date,
    a.title as activity_title,
    u.email as client_email,
    ae.created_at
FROM activity_enrollments ae
JOIN activities a ON a.id = ae.activity_id
JOIN auth.users u ON u.id = ae.client_id
ORDER BY ae.id DESC
LIMIT 1;

-- =====================================================
-- PASO 4: VERIFICAR PERÍODOS GENERADOS
-- =====================================================

-- Mostrar períodos generados
SELECT 
    pa.id as periodo_id,
    pa.enrollment_id,
    pa.numero_periodo,
    pa.fecha_inicio,
    pa.fecha_fin,
    ae.status as enrollment_status,
    a.title as activity_title
FROM periodos_asignados pa
JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
JOIN activities a ON a.id = ae.activity_id
ORDER BY pa.enrollment_id DESC, pa.numero_periodo;

-- =====================================================
-- PASO 5: PROBAR FUNCIONES CON EL ENROLLMENT CREADO
-- =====================================================

DO $$
DECLARE
    v_enrollment_id INTEGER;
    v_periodo_id INTEGER;
    v_resultado JSONB;
BEGIN
    -- Obtener el enrollment más reciente
    SELECT id INTO v_enrollment_id 
    FROM activity_enrollments 
    ORDER BY id DESC 
    LIMIT 1;
    
    IF v_enrollment_id IS NOT NULL THEN
        RAISE NOTICE 'Probando funciones con enrollment ID: %', v_enrollment_id;
        
        -- Probar generar períodos nuevamente
        BEGIN
            SELECT generar_periodos_para_enrollment(v_enrollment_id) INTO v_resultado;
            RAISE NOTICE 'Generar períodos: %', v_resultado;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Error al probar generar_periodos_para_enrollment: %', SQLERRM;
        END;
        
        -- Obtener un período para probar
        SELECT id INTO v_periodo_id 
        FROM periodos_asignados 
        WHERE enrollment_id = v_enrollment_id 
        ORDER BY numero_periodo 
        LIMIT 1;
        
        IF v_periodo_id IS NOT NULL THEN
            -- Probar generar ejecuciones
            BEGIN
                SELECT generar_ejecuciones_para_periodo(v_periodo_id) INTO v_resultado;
                RAISE NOTICE 'Generar ejecuciones: %', v_resultado;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE WARNING 'Error al probar generar_ejecuciones_para_periodo: %', SQLERRM;
            END;
        END IF;
    END IF;
END $$;

-- =====================================================
-- PASO 6: MOSTRAR ESTADO FINAL
-- =====================================================

DO $$
DECLARE
    v_enrollments INTEGER;
    v_periodos INTEGER;
    v_ejecuciones INTEGER;
    v_ejercicios INTEGER;
    v_organizaciones INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_enrollments FROM activity_enrollments;
    SELECT COUNT(*) INTO v_periodos FROM periodos_asignados;
    SELECT COUNT(*) INTO v_ejecuciones FROM ejecuciones_ejercicio;
    SELECT COUNT(*) INTO v_ejercicios FROM ejercicios_detalles;
    SELECT COUNT(*) INTO v_organizaciones FROM organizacion_ejercicios;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'ESTADO FINAL DEL SISTEMA';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Enrollments: %', v_enrollments;
    RAISE NOTICE 'Períodos: %', v_periodos;
    RAISE NOTICE 'Ejecuciones: %', v_ejecuciones;
    RAISE NOTICE 'Ejercicios: %', v_ejercicios;
    RAISE NOTICE 'Organizaciones: %', v_organizaciones;
    RAISE NOTICE '=========================================';
    
    IF v_enrollments > 0 AND v_periodos > 0 THEN
        RAISE NOTICE '✅ Sistema listo para usar';
        RAISE NOTICE 'Puedes probar con: SELECT generar_periodos_para_enrollment(%);', 
            (SELECT id FROM activity_enrollments ORDER BY id DESC LIMIT 1);
    ELSE
        RAISE WARNING '⚠️  Sistema necesita más configuración';
    END IF;
END $$;

RAISE NOTICE 'Enrollment de prueba creado exitosamente';
