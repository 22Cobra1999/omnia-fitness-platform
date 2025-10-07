-- =====================================================
-- VERIFICAR Y CREAR ENROLLMENTS PARA PROBAR EL SISTEMA
-- =====================================================
-- Este script verifica qué enrollments existen y crea uno si es necesario

-- =====================================================
-- PASO 1: VERIFICAR DATOS EXISTENTES
-- =====================================================

DO $$
DECLARE
    v_activities_count INTEGER;
    v_users_count INTEGER;
    v_enrollments_count INTEGER;
    v_enrollment_id INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_activities_count FROM activities;
    SELECT COUNT(*) INTO v_users_count FROM auth.users;
    SELECT COUNT(*) INTO v_enrollments_count FROM activity_enrollments;
    
    RAISE NOTICE '=== DATOS EXISTENTES ===';
    RAISE NOTICE 'Activities: %', v_activities_count;
    RAISE NOTICE 'Users: %', v_users_count;
    RAISE NOTICE 'Enrollments: %', v_enrollments_count;
    RAISE NOTICE '========================';
    
    -- Si no hay enrollments, crear uno
    IF v_enrollments_count = 0 AND v_activities_count > 0 AND v_users_count > 0 THEN
        RAISE NOTICE 'No hay enrollments. Creando uno de ejemplo...';
        
        INSERT INTO activity_enrollments (activity_id, client_id, status, start_date)
        SELECT 
            a.id,
            u.id,
            'pendiente',
            CURRENT_DATE
        FROM activities a
        CROSS JOIN auth.users u
        LIMIT 1
        RETURNING id INTO v_enrollment_id;
        
        RAISE NOTICE 'Enrollment creado con ID: %', v_enrollment_id;
    ELSE
        -- Mostrar enrollments existentes
        RAISE NOTICE 'Enrollments existentes:';
        FOR v_enrollment_id IN 
            SELECT id FROM activity_enrollments ORDER BY id
        LOOP
            RAISE NOTICE '  - Enrollment ID: %', v_enrollment_id;
        END LOOP;
    END IF;
END $$;

-- =====================================================
-- PASO 2: MOSTRAR INFORMACIÓN DE ENROLLMENTS
-- =====================================================

-- Mostrar todos los enrollments con información detallada
SELECT 
    ae.id as enrollment_id,
    ae.activity_id,
    ae.client_id,
    ae.status,
    ae.start_date,
    ae.expiration_date,
    a.title as activity_title,
    u.email as client_email
FROM activity_enrollments ae
LEFT JOIN activities a ON a.id = ae.activity_id
LEFT JOIN auth.users u ON u.id = ae.client_id
ORDER BY ae.id;

-- =====================================================
-- PASO 3: PROBAR FUNCIÓN CON ENROLLMENT EXISTENTE
-- =====================================================

DO $$
DECLARE
    v_enrollment_id INTEGER;
    v_resultado JSONB;
BEGIN
    -- Obtener el primer enrollment disponible
    SELECT id INTO v_enrollment_id 
    FROM activity_enrollments 
    ORDER BY id 
    LIMIT 1;
    
    IF v_enrollment_id IS NOT NULL THEN
        RAISE NOTICE 'Probando función con enrollment ID: %', v_enrollment_id;
        
        -- Probar la función
        SELECT generar_periodos_para_enrollment(v_enrollment_id) INTO v_resultado;
        
        RAISE NOTICE 'Resultado: %', v_resultado;
        
        -- Verificar si se crearon períodos
        IF (v_resultado->>'success')::BOOLEAN THEN
            RAISE NOTICE '✅ Función funcionó correctamente';
        ELSE
            RAISE NOTICE '⚠️  Función falló: %', v_resultado->>'error';
        END IF;
    ELSE
        RAISE NOTICE 'No hay enrollments para probar';
    END IF;
END $$;

-- =====================================================
-- PASO 4: VERIFICAR PERÍODOS CREADOS
-- =====================================================

-- Mostrar períodos creados
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
LEFT JOIN activities a ON a.id = ae.activity_id
ORDER BY pa.enrollment_id, pa.numero_periodo;

-- =====================================================
-- PASO 5: CREAR ENROLLMENT DE PRUEBA SI ES NECESARIO
-- =====================================================

DO $$
DECLARE
    v_enrollment_id INTEGER;
    v_resultado JSONB;
BEGIN
    -- Si no hay períodos, crear un enrollment de prueba
    IF NOT EXISTS (SELECT 1 FROM periodos_asignados) THEN
        RAISE NOTICE 'No hay períodos. Creando enrollment de prueba...';
        
        -- Crear enrollment de prueba
        INSERT INTO activity_enrollments (activity_id, client_id, status, start_date)
        SELECT 
            a.id,
            u.id,
            'pendiente',
            CURRENT_DATE
        FROM activities a
        CROSS JOIN auth.users u
        LIMIT 1
        RETURNING id INTO v_enrollment_id;
        
        RAISE NOTICE 'Enrollment de prueba creado con ID: %', v_enrollment_id;
        
        -- Probar generar períodos
        SELECT generar_periodos_para_enrollment(v_enrollment_id) INTO v_resultado;
        
        RAISE NOTICE 'Períodos generados: %', v_resultado;
    END IF;
END $$;

-- =====================================================
-- PASO 6: VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
    v_enrollments INTEGER;
    v_periodos INTEGER;
    v_ejercicios INTEGER;
    v_organizaciones INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_enrollments FROM activity_enrollments;
    SELECT COUNT(*) INTO v_periodos FROM periodos_asignados;
    SELECT COUNT(*) INTO v_ejercicios FROM ejercicios_detalles;
    SELECT COUNT(*) INTO v_organizaciones FROM organizacion_ejercicios;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'ESTADO FINAL DEL SISTEMA';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Enrollments: %', v_enrollments;
    RAISE NOTICE 'Períodos: %', v_periodos;
    RAISE NOTICE 'Ejercicios: %', v_ejercicios;
    RAISE NOTICE 'Organizaciones: %', v_organizaciones;
    RAISE NOTICE '=========================================';
    
    IF v_enrollments > 0 AND v_periodos > 0 THEN
        RAISE NOTICE '✅ Sistema listo para usar';
    ELSE
        RAISE WARNING '⚠️  Sistema necesita más configuración';
    END IF;
END $$;

RAISE NOTICE 'Verificación de enrollments completada';
