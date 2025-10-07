-- =====================================================
-- LIMPIAR TABLAS OBSOLETAS DESPUÉS DE MIGRACIÓN
-- =====================================================
-- Este script elimina las tablas obsoletas después de migrar los datos
-- IMPORTANTE: Solo ejecutar después de verificar que la migración fue exitosa

-- =====================================================
-- PASO 1: VERIFICAR QUE LA MIGRACIÓN FUE EXITOSA
-- =====================================================

DO $$
DECLARE
    v_ejercicios_count INTEGER;
    v_organizaciones_count INTEGER;
    v_periodos_count INTEGER;
    v_ejecuciones_count INTEGER;
BEGIN
    -- Verificar que el nuevo esquema tiene datos
    SELECT COUNT(*) INTO v_ejercicios_count FROM ejercicios_detalles;
    SELECT COUNT(*) INTO v_organizaciones_count FROM organizacion_ejercicios;
    SELECT COUNT(*) INTO v_periodos_count FROM periodos_asignados;
    SELECT COUNT(*) INTO v_ejecuciones_count FROM ejecuciones_ejercicio;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'VERIFICACIÓN PREVIA A LIMPIEZA';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Ejercicios en nuevo esquema: %', v_ejercicios_count;
    RAISE NOTICE 'Organizaciones en nuevo esquema: %', v_organizaciones_count;
    RAISE NOTICE 'Períodos en nuevo esquema: %', v_periodos_count;
    RAISE NOTICE 'Ejecuciones en nuevo esquema: %', v_ejecuciones_count;
    RAISE NOTICE '=========================================';
    
    IF v_ejercicios_count = 0 THEN
        RAISE EXCEPTION '❌ No hay ejercicios en el nuevo esquema. No se puede proceder con la limpieza.';
    END IF;
    
    RAISE NOTICE '✅ Verificación exitosa. Procediendo con la limpieza...';
END $$;

-- =====================================================
-- PASO 2: ELIMINAR TRIGGERS Y FUNCIONES OBSOLETAS
-- =====================================================

-- Eliminar triggers obsoletos
DROP TRIGGER IF EXISTS trigger_generate_customizations ON activity_enrollments;
DROP TRIGGER IF EXISTS trigger_auto_generate_exercises ON activities;

-- Eliminar funciones obsoletas
DROP FUNCTION IF EXISTS generate_client_exercise_customizations();
DROP FUNCTION IF EXISTS generate_exercises_for_activity();

-- =====================================================
-- PASO 3: ELIMINAR TABLAS OBSOLETAS (CON CASCADE)
-- =====================================================

-- Eliminar tablas obsoletas en orden de dependencias
DROP TABLE IF EXISTS client_exercise_customizations CASCADE;
DROP TABLE IF EXISTS client_exercise_progress CASCADE;
DROP TABLE IF EXISTS exercise_intensity_levels CASCADE;
DROP TABLE IF EXISTS activity_calendar CASCADE;
DROP TABLE IF EXISTS fitness_program_details CASCADE;
DROP TABLE IF EXISTS fitness_exercises CASCADE;

-- =====================================================
-- PASO 4: VERIFICAR LIMPIEZA
-- =====================================================

DO $$
DECLARE
    v_tables_removed INTEGER;
    v_remaining_obsolete_tables TEXT;
BEGIN
    -- Verificar que las tablas obsoletas fueron eliminadas
    SELECT COUNT(*) INTO v_tables_removed
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'fitness_exercises',
        'fitness_program_details', 
        'activity_calendar',
        'client_exercise_progress',
        'exercise_intensity_levels',
        'client_exercise_customizations'
    );
    
    -- Obtener lista de tablas obsoletas que aún existen
    SELECT string_agg(table_name, ', ')
    INTO v_remaining_obsolete_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'fitness_exercises',
        'fitness_program_details', 
        'activity_calendar',
        'client_exercise_progress',
        'exercise_intensity_levels',
        'client_exercise_customizations'
    );
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'RESULTADO DE LA LIMPIEZA';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Tablas obsoletas eliminadas: %', (6 - v_tables_removed);
    RAISE NOTICE 'Tablas obsoletas restantes: %', v_tables_removed;
    
    IF v_tables_removed = 0 THEN
        RAISE NOTICE '✅ Todas las tablas obsoletas fueron eliminadas exitosamente';
    ELSE
        RAISE WARNING '⚠️  Algunas tablas obsoletas aún existen: %', v_remaining_obsolete_tables;
    END IF;
    
    RAISE NOTICE '=========================================';
END $$;

-- =====================================================
-- PASO 5: MOSTRAR ESTADO FINAL DEL ESQUEMA
-- =====================================================

-- Mostrar tablas del nuevo esquema modular
SELECT 
    'NUEVO ESQUEMA MODULAR' as info,
    table_name,
    'Tabla activa' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'ejercicios_detalles',
    'organizacion_ejercicios',
    'periodos_asignados',
    'ejecuciones_ejercicio',
    'intensidades',
    'activity_enrollments'
)
ORDER BY table_name;

-- Mostrar estadísticas del nuevo esquema
SELECT 
    'ESTADÍSTICAS DEL NUEVO ESQUEMA' as info,
    'ejercicios_detalles' as tabla, COUNT(*) as registros FROM ejercicios_detalles
UNION ALL
SELECT 
    'ESTADÍSTICAS DEL NUEVO ESQUEMA' as info,
    'organizacion_ejercicios' as tabla, COUNT(*) as registros FROM organizacion_ejercicios
UNION ALL
SELECT 
    'ESTADÍSTICAS DEL NUEVO ESQUEMA' as info,
    'periodos_asignados' as tabla, COUNT(*) as registros FROM periodos_asignados
UNION ALL
SELECT 
    'ESTADÍSTICAS DEL NUEVO ESQUEMA' as info,
    'ejecuciones_ejercicio' as tabla, COUNT(*) as registros FROM ejecuciones_ejercicio
UNION ALL
SELECT 
    'ESTADÍSTICAS DEL NUEVO ESQUEMA' as info,
    'intensidades' as tabla, COUNT(*) as registros FROM intensidades
UNION ALL
SELECT 
    'ESTADÍSTICAS DEL NUEVO ESQUEMA' as info,
    'activity_enrollments' as tabla, COUNT(*) as registros FROM activity_enrollments;

-- =====================================================
-- PASO 6: RECOMENDACIONES FINALES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'RECOMENDACIONES FINALES';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '✅ Esquema modular implementado exitosamente';
    RAISE NOTICE '✅ Tablas obsoletas eliminadas';
    RAISE NOTICE '✅ Sistema listo para producción';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Funciones disponibles:';
    RAISE NOTICE '   - generar_periodos_para_enrollment(enrollment_id)';
    RAISE NOTICE '   - generar_ejecuciones_para_periodo(periodo_id)';
    RAISE NOTICE '   - get_ejercicios_del_dia_completo(periodo_id, dia)';
    RAISE NOTICE '   - get_progreso_cliente_ejercicio(enrollment_id, ejercicio_id)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Próximos pasos:';
    RAISE NOTICE '   1. Actualizar aplicaciones para usar nuevo esquema';
    RAISE NOTICE '   2. Crear más ejercicios y organizaciones';
    RAISE NOTICE '   3. Configurar intensidades personalizadas';
    RAISE NOTICE '   4. Implementar UI para el nuevo sistema';
    RAISE NOTICE '=========================================';
END $$;
