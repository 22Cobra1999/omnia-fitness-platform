-- =====================================================
-- CREAR INTENSIDADES POR DEFECTO PARA EJERCICIOS EXISTENTES
-- =====================================================
-- Como los IDs no coinciden, creamos intensidades por defecto

-- =====================================================
-- PASO 1: VERIFICAR EJERCICIOS EXISTENTES
-- =====================================================

DO $$
DECLARE
    v_ejercicios_count INTEGER;
    v_intensidades_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_ejercicios_count FROM ejercicios_detalles;
    SELECT COUNT(*) INTO v_intensidades_count FROM intensidades;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'ESTADO ACTUAL';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Ejercicios en ejercicios_detalles: %', v_ejercicios_count;
    RAISE NOTICE 'Intensidades existentes: %', v_intensidades_count;
    RAISE NOTICE '=========================================';
END $$;

-- =====================================================
-- PASO 2: MOSTRAR EJERCICIOS EXISTENTES
-- =====================================================

SELECT 
    'EJERCICIOS EXISTENTES' as info,
    id,
    nombre_ejercicio,
    descripcion,
    tipo
FROM ejercicios_detalles 
ORDER BY id
LIMIT 10;

-- =====================================================
-- PASO 3: CREAR INTENSIDADES POR DEFECTO
-- =====================================================

DO $$
DECLARE
    v_ejercicio RECORD;
    v_intensidades_creadas INTEGER := 0;
BEGIN
    RAISE NOTICE 'Creando intensidades por defecto para todos los ejercicios...';
    
    -- Para cada ejercicio, crear intensidades básicas
    FOR v_ejercicio IN 
        SELECT id, nombre_ejercicio
        FROM ejercicios_detalles
        ORDER BY id
    LOOP
        -- Crear intensidades básicas si no existen
        INSERT INTO intensidades (ejercicio_id, nombre, orden, reps, series, peso, duracion_minutos, descanso_segundos) VALUES
        (v_ejercicio.id, 'Principiante', 1, 8, 3, 0, NULL, 90),
        (v_ejercicio.id, 'Intermedio', 2, 12, 3, 0, NULL, 60),
        (v_ejercicio.id, 'Avanzado', 3, 15, 4, 0, NULL, 45)
        ON CONFLICT (ejercicio_id, nombre) DO NOTHING;
        
        v_intensidades_creadas := v_intensidades_creadas + 3;
        RAISE NOTICE 'Creadas intensidades para ejercicio: % (ID: %)', v_ejercicio.nombre_ejercicio, v_ejercicio.id;
    END LOOP;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'INTENSIDADES CREADAS: %', v_intensidades_creadas;
    RAISE NOTICE '=========================================';
END $$;

-- =====================================================
-- PASO 4: VERIFICAR RESULTADO
-- =====================================================

DO $$
DECLARE
    v_ejercicios_count INTEGER;
    v_intensidades_count INTEGER;
    v_ejercicios_con_intensidades INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_ejercicios_count FROM ejercicios_detalles;
    SELECT COUNT(*) INTO v_intensidades_count FROM intensidades;
    SELECT COUNT(DISTINCT ejercicio_id) INTO v_ejercicios_con_intensidades FROM intensidades;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'VERIFICACIÓN POST-CREACIÓN';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Ejercicios totales: %', v_ejercicios_count;
    RAISE NOTICE 'Intensidades totales: %', v_intensidades_count;
    RAISE NOTICE 'Ejercicios con intensidades: %', v_ejercicios_con_intensidades;
    RAISE NOTICE '=========================================';
END $$;

-- =====================================================
-- PASO 5: MOSTRAR MUESTRA DE INTENSIDADES CREADAS
-- =====================================================

SELECT 
    'INTENSIDADES CREADAS' as info,
    i.id,
    ed.nombre_ejercicio,
    i.nombre as intensidad,
    i.orden,
    i.reps,
    i.series,
    i.peso,
    i.duracion_minutos,
    i.descanso_segundos
FROM intensidades i
JOIN ejercicios_detalles ed ON ed.id = i.ejercicio_id
ORDER BY ed.nombre_ejercicio, i.orden
LIMIT 15;









































