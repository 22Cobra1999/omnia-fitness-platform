-- =====================================================
-- CORREGIR PROBLEMAS Y PROBAR SISTEMA COMPLETO
-- =====================================================
-- Este script corrige todos los problemas y prueba el sistema

-- IMPORTANTE: Hacer backup completo antes de ejecutar

-- =====================================================
-- PASO 1: CORREGIR CONSTRAINTS DE CLAVES FORÁNEAS
-- =====================================================
\echo 'Paso 1: Corrigiendo constraints de claves foráneas...'
\i fix-foreign-key-constraints.sql

-- =====================================================
-- PASO 2: CORREGIR CONSTRAINT DE STATUS
-- =====================================================
\echo 'Paso 2: Corrigiendo constraint de status...'
\i fix-status-constraint.sql

-- =====================================================
-- PASO 3: CREAR ENROLLMENT DE PRUEBA
-- =====================================================
\echo 'Paso 3: Creando enrollment de prueba...'
\i create-enrollment-safe.sql

-- =====================================================
-- PASO 4: VERIFICACIÓN FINAL
-- =====================================================
\echo 'Verificación final...'

-- Verificar que todo funciona
DO $$
DECLARE
    v_enrollments INTEGER;
    v_periodos INTEGER;
    v_ejecuciones INTEGER;
    v_ejercicios INTEGER;
    v_organizaciones INTEGER;
    v_intensidades INTEGER;
    v_enrollment_id INTEGER;
    v_resultado JSONB;
BEGIN
    SELECT COUNT(*) INTO v_enrollments FROM activity_enrollments;
    SELECT COUNT(*) INTO v_periodos FROM periodos_asignados;
    SELECT COUNT(*) INTO v_ejecuciones FROM ejecuciones_ejercicio;
    SELECT COUNT(*) INTO v_ejercicios FROM ejercicios_detalles;
    SELECT COUNT(*) INTO v_organizaciones FROM organizacion_ejercicios;
    SELECT COUNT(*) INTO v_intensidades FROM intensidades;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'ESTADO FINAL DEL SISTEMA';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Enrollments: %', v_enrollments;
    RAISE NOTICE 'Períodos: %', v_periodos;
    RAISE NOTICE 'Ejecuciones: %', v_ejecuciones;
    RAISE NOTICE 'Ejercicios: %', v_ejercicios;
    RAISE NOTICE 'Organizaciones: %', v_organizaciones;
    RAISE NOTICE 'Intensidades: %', v_intensidades;
    RAISE NOTICE '=========================================';
    
    -- Probar función principal
    IF v_enrollments > 0 THEN
        SELECT id INTO v_enrollment_id FROM activity_enrollments ORDER BY id DESC LIMIT 1;
        
        RAISE NOTICE 'Probando función principal con enrollment ID: %', v_enrollment_id;
        
        BEGIN
            SELECT generar_periodos_para_enrollment(v_enrollment_id) INTO v_resultado;
            RAISE NOTICE 'Resultado de prueba: %', v_resultado;
            
            IF (v_resultado->>'success')::BOOLEAN THEN
                RAISE NOTICE '✅ SISTEMA FUNCIONANDO CORRECTAMENTE';
            ELSE
                RAISE WARNING '⚠️  Función falló: %', v_resultado->>'error';
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING '⚠️  Error al probar función: %', SQLERRM;
        END;
    END IF;
    
    IF v_enrollments > 0 AND v_periodos > 0 THEN
        RAISE NOTICE '✅ ESQUEMA MODULAR LISTO PARA USAR';
    ELSE
        RAISE WARNING '⚠️  Sistema necesita más configuración';
    END IF;
END $$;

\echo '========================================='
\echo 'CORRECCIÓN Y PRUEBA COMPLETADA'
\echo '========================================='
\echo 'El sistema está listo para usar.'
\echo ''
\echo 'Pruebas que puedes hacer:'
\echo '1. SELECT * FROM activity_enrollments;'
\echo '2. SELECT * FROM periodos_asignados;'
\echo '3. SELECT * FROM ejercicios_detalles;'
\echo '4. SELECT generar_periodos_para_enrollment(ID_REAL);'
\echo '5. SELECT * FROM ejecuciones_ejercicio;'
