-- =====================================================
-- INSTALACIÓN Y POBLACIÓN COMPLETA DEL ESQUEMA MODULAR
-- =====================================================
-- Este script instala y puebla completamente el esquema modular

-- IMPORTANTE: Hacer backup completo antes de ejecutar

-- =====================================================
-- PASO 1: CORREGIR CONSTRAINT DE STATUS
-- =====================================================
\echo 'Paso 1: Corrigiendo constraint de status...'
\i fix-status-constraint.sql

-- =====================================================
-- PASO 2: INSTALAR ESQUEMA MODULAR
-- =====================================================
\echo 'Paso 2: Instalando esquema modular...'
\i install-modular-schema-final.sql

-- =====================================================
-- PASO 3: POBLAR ESQUEMA CON DATOS
-- =====================================================
\echo 'Paso 3: Poblando esquema con datos...'
\i populate-modular-schema.sql

-- =====================================================
-- PASO 4: VERIFICACIÓN FINAL
-- =====================================================
\echo 'Verificación final...'

-- Verificar que las tablas tienen datos
DO $$
DECLARE
    v_ejercicios INTEGER;
    v_organizaciones INTEGER;
    v_periodos INTEGER;
    v_ejecuciones INTEGER;
    v_intensidades INTEGER;
    v_funciones INTEGER;
    v_triggers INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_ejercicios FROM ejercicios_detalles;
    SELECT COUNT(*) INTO v_organizaciones FROM organizacion_ejercicios;
    SELECT COUNT(*) INTO v_periodos FROM periodos_asignados;
    SELECT COUNT(*) INTO v_ejecuciones FROM ejecuciones_ejercicio;
    SELECT COUNT(*) INTO v_intensidades FROM intensidades;
    
    SELECT COUNT(*) INTO v_funciones 
    FROM information_schema.routines 
    WHERE routine_name LIKE '%periodo%' OR routine_name LIKE '%ejecucion%';
    
    SELECT COUNT(*) INTO v_triggers 
    FROM information_schema.triggers 
    WHERE trigger_name LIKE '%periodo%' OR trigger_name LIKE '%ejecucion%';
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'INSTALACIÓN COMPLETA FINALIZADA';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Ejercicios: %', v_ejercicios;
    RAISE NOTICE 'Organizaciones: %', v_organizaciones;
    RAISE NOTICE 'Períodos: %', v_periodos;
    RAISE NOTICE 'Ejecuciones: %', v_ejecuciones;
    RAISE NOTICE 'Intensidades: %', v_intensidades;
    RAISE NOTICE 'Funciones: %', v_funciones;
    RAISE NOTICE 'Triggers: %', v_triggers;
    RAISE NOTICE '=========================================';
    
    IF v_ejercicios > 0 AND v_funciones > 0 THEN
        RAISE NOTICE '✅ ESQUEMA MODULAR INSTALADO Y POBLADO EXITOSAMENTE';
        RAISE NOTICE 'Puedes comenzar a usar el nuevo sistema';
    ELSE
        RAISE WARNING '⚠️  Algo salió mal. Verifica los logs anteriores';
    END IF;
END $$;

\echo '========================================='
\echo 'INSTALACIÓN COMPLETA FINALIZADA'
\echo '========================================='
\echo 'El esquema modular está listo para usar.'
\echo ''
\echo 'Pruebas que puedes hacer:'
\echo '1. SELECT * FROM ejercicios_detalles;'
\echo '2. SELECT * FROM organizacion_ejercicios;'
\echo '3. SELECT * FROM periodos_asignados;'
\echo '4. SELECT generar_periodos_para_enrollment(1);'
\echo '5. SELECT * FROM ejercicios_del_dia_completo LIMIT 5;'
