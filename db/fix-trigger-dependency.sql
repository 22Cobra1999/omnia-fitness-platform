-- =====================================================
-- CORREGIR DEPENDENCIA DE TRIGGER
-- =====================================================
-- Este script corrige la dependencia del trigger problemático

-- =====================================================
-- PASO 1: ELIMINAR TRIGGER Y FUNCIÓN CON CASCADE
-- =====================================================

-- Eliminar trigger primero
DROP TRIGGER IF EXISTS trigger_generate_customizations ON activity_enrollments;

-- Eliminar función
DROP FUNCTION IF EXISTS generate_client_exercise_customizations() CASCADE;

-- =====================================================
-- PASO 2: VERIFICAR QUE SE ELIMINARON
-- =====================================================

DO $$
DECLARE
    v_trigger_exists BOOLEAN;
    v_function_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_generate_customizations'
    ) INTO v_trigger_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'generate_client_exercise_customizations'
    ) INTO v_function_exists;
    
    RAISE NOTICE 'Trigger eliminado: %', NOT v_trigger_exists;
    RAISE NOTICE 'Función eliminada: %', NOT v_function_exists;
    
    IF NOT v_trigger_exists AND NOT v_function_exists THEN
        RAISE NOTICE '✅ Trigger y función problemáticos eliminados correctamente';
    ELSE
        RAISE WARNING '⚠️  Algunos objetos no se eliminaron';
    END IF;
END $$;

-- =====================================================
-- PASO 3: PROBAR CON ENROLLMENT EXISTENTE
-- =====================================================

DO $$
DECLARE
    v_enrollment_id INTEGER;
    v_resultado JSONB;
BEGIN
    -- Usar el enrollment existente (ID 53)
    v_enrollment_id := 53;
    
    RAISE NOTICE 'Probando con enrollment existente ID: %', v_enrollment_id;
    
    -- Verificar que el enrollment existe
    IF EXISTS (SELECT 1 FROM activity_enrollments WHERE id = v_enrollment_id) THEN
        RAISE NOTICE '✅ Enrollment % existe', v_enrollment_id;
        
        -- Probar función principal
        BEGIN
            SELECT generar_periodos_para_enrollment(v_enrollment_id) INTO v_resultado;
            RAISE NOTICE 'Resultado: %', v_resultado;
            
            IF (v_resultado->>'success')::BOOLEAN THEN
                RAISE NOTICE '✅ Función funcionó correctamente';
            ELSE
                RAISE WARNING '⚠️  Función falló: %', v_resultado->>'error';
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Error al probar función: %', SQLERRM;
        END;
    ELSE
        RAISE WARNING '⚠️  Enrollment % no existe', v_enrollment_id;
    END IF;
END $$;

-- =====================================================
-- PASO 4: VERIFICAR PERÍODOS GENERADOS
-- =====================================================

-- Mostrar períodos para el enrollment 53
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
WHERE pa.enrollment_id = 53
ORDER BY pa.numero_periodo;

-- =====================================================
-- PASO 5: PROBAR GENERAR EJECUCIONES
-- =====================================================

DO $$
DECLARE
    v_periodo_id INTEGER;
    v_resultado JSONB;
BEGIN
    -- Obtener un período del enrollment 53
    SELECT id INTO v_periodo_id 
    FROM periodos_asignados 
    WHERE enrollment_id = 53 
    ORDER BY numero_periodo 
    LIMIT 1;
    
    IF v_periodo_id IS NOT NULL THEN
        RAISE NOTICE 'Probando generar ejecuciones para período ID: %', v_periodo_id;
        
        BEGIN
            SELECT generar_ejecuciones_para_periodo(v_periodo_id) INTO v_resultado;
            RAISE NOTICE 'Resultado generar ejecuciones: %', v_resultado;
            
            IF (v_resultado->>'success')::BOOLEAN THEN
                RAISE NOTICE '✅ Ejecuciones generadas correctamente';
            ELSE
                RAISE WARNING '⚠️  Error al generar ejecuciones: %', v_resultado->>'error';
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Error al generar ejecuciones: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'No hay períodos para el enrollment 53';
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
    
    IF v_periodos > 0 THEN
        RAISE NOTICE '✅ Sistema funcionando correctamente';
        RAISE NOTICE 'Puedes probar con: SELECT generar_periodos_para_enrollment(53);';
    ELSE
        RAISE WARNING '⚠️  No hay períodos generados';
    END IF;
END $$;

RAISE NOTICE 'Corrección de dependencia completada';
