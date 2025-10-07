-- =====================================================
-- INSTALACIÓN COMPLETA DEL ESQUEMA MODULAR OMNIA
-- =====================================================
-- Este script instala completamente el nuevo esquema modular
-- Ejecuta todo en el orden correcto para evitar errores

-- IMPORTANTE: 
-- 1. Hacer backup completo de la base de datos antes de ejecutar
-- 2. Ejecutar como superusuario o con permisos de DDL

-- =====================================================
-- PASO 1: VERIFICAR Y CORREGIR TABLAS DE USUARIOS
-- =====================================================
\echo 'Paso 1: Verificando tablas de usuarios...'
\i check-and-fix-user-tables.sql

-- =====================================================
-- PASO 2: CONFIGURAR TABLAS BASE
-- =====================================================
\echo 'Paso 2: Configurando tablas base...'
\i setup-base-tables.sql

-- =====================================================
-- PASO 3: CREAR ESQUEMA MODULAR
-- =====================================================
\echo 'Paso 3: Creando esquema modular...'
\i create-modular-exercise-schema.sql

-- =====================================================
-- PASO 4: CREAR FUNCIONES AUXILIARES
-- =====================================================
\echo 'Paso 4: Creando funciones auxiliares...'
\i create-modular-functions.sql

-- =====================================================
-- PASO 5: CREAR TRIGGERS DE AUTOMATIZACIÓN
-- =====================================================
\echo 'Paso 5: Creando triggers de automatización...'
\i create-modular-triggers.sql

-- =====================================================
-- PASO 6: MIGRAR DATOS EXISTENTES
-- =====================================================
\echo 'Paso 6: Migrando datos existentes...'
\i fix-migration-errors.sql

-- =====================================================
-- PASO 7: CONFIGURAR RELACIONES FINALES
-- =====================================================
\echo 'Paso 7: Configurando relaciones finales...'
\i configure-modular-schema-relationships.sql

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
\echo 'Verificación final del esquema...'

-- Verificar que todas las tablas fueron creadas
DO $$
DECLARE
    v_tablas_creadas INTEGER;
    v_ejercicios INTEGER;
    v_organizaciones INTEGER;
    v_periodos INTEGER;
    v_ejecuciones INTEGER;
    v_intensidades INTEGER;
BEGIN
    -- Contar tablas del esquema modular
    SELECT COUNT(*) INTO v_tablas_creadas
    FROM information_schema.tables
    WHERE table_name IN (
        'ejercicios_detalles', 
        'organizacion_ejercicios', 
        'periodos_asignados', 
        'ejecuciones_ejercicio', 
        'intensidades'
    );
    
    -- Contar registros en cada tabla
    SELECT COUNT(*) INTO v_ejercicios FROM ejercicios_detalles;
    SELECT COUNT(*) INTO v_organizaciones FROM organizacion_ejercicios;
    SELECT COUNT(*) INTO v_periodos FROM periodos_asignados;
    SELECT COUNT(*) INTO v_ejecuciones FROM ejecuciones_ejercicio;
    SELECT COUNT(*) INTO v_intensidades FROM intensidades;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'INSTALACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Tablas del esquema modular creadas: %', v_tablas_creadas;
    RAISE NOTICE 'Ejercicios migrados: %', v_ejercicios;
    RAISE NOTICE 'Organizaciones migradas: %', v_organizaciones;
    RAISE NOTICE 'Períodos generados: %', v_periodos;
    RAISE NOTICE 'Ejecuciones migradas: %', v_ejecuciones;
    RAISE NOTICE 'Intensidades migradas: %', v_intensidades;
    RAISE NOTICE '=========================================';
    
    IF v_tablas_creadas = 5 THEN
        RAISE NOTICE '✅ ESQUEMA MODULAR INSTALADO CORRECTAMENTE';
    ELSE
        RAISE WARNING '⚠️  Algunas tablas no se crearon correctamente';
    END IF;
END $$;

-- Ejecutar verificación de integridad si la función existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'verificar_esquema_modular') THEN
        PERFORM verificar_esquema_modular();
    END IF;
END $$;

\echo '========================================='
\echo 'INSTALACIÓN DEL ESQUEMA MODULAR COMPLETADA'
\echo '========================================='
\echo 'El nuevo esquema modular está listo para usar.'
\echo 'Puedes comenzar a usar las nuevas funciones y tablas.'
\echo ''
\echo 'Funciones principales disponibles:'
\echo '- generar_periodos_para_enrollment(enrollment_id)'
\echo '- obtener_ejercicios_del_dia(client_id, fecha)'
\echo '- calcular_progreso_cliente(client_id, activity_id)'
\echo '- marcar_ejercicio_completado(ejecucion_id, ...)'
\echo ''
\echo 'Vistas útiles:'
\echo '- ejercicios_del_dia_completo'
\echo '- progreso_cliente_resumen'
\echo '- estadisticas_coach'
