-- =====================================================
-- CORREGIR CONSTRAINT DE STATUS EN ACTIVITY_ENROLLMENTS
-- =====================================================
-- Este script corrige el constraint de status para permitir ambos valores

-- =====================================================
-- PASO 1: VERIFICAR CONSTRAINT ACTUAL
-- =====================================================

DO $$
DECLARE
    v_constraint_exists BOOLEAN;
    v_constraint_definition TEXT;
BEGIN
    -- Verificar si existe el constraint
    SELECT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'activity_enrollments_status_check'
    ) INTO v_constraint_exists;
    
    IF v_constraint_exists THEN
        -- Obtener la definición actual del constraint
        SELECT check_clause INTO v_constraint_definition
        FROM information_schema.check_constraints 
        WHERE constraint_name = 'activity_enrollments_status_check';
        
        RAISE NOTICE 'Constraint actual: %', v_constraint_definition;
    ELSE
        RAISE NOTICE 'No existe constraint activity_enrollments_status_check';
    END IF;
END $$;

-- =====================================================
-- PASO 2: ELIMINAR CONSTRAINT EXISTENTE
-- =====================================================

ALTER TABLE activity_enrollments
DROP CONSTRAINT IF EXISTS activity_enrollments_status_check;

-- =====================================================
-- PASO 3: CREAR CONSTRAINT CORREGIDO
-- =====================================================

-- Crear constraint que permita ambos valores (español e inglés)
ALTER TABLE activity_enrollments
ADD CONSTRAINT activity_enrollments_status_check
CHECK (status IN (
    'pendiente', 'pending',
    'activa', 'active', 
    'finalizada', 'completed',
    'pausada', 'paused',
    'cancelada', 'cancelled'
));

-- =====================================================
-- PASO 4: VERIFICAR QUE FUNCIONA
-- =====================================================

DO $$
BEGIN
    -- Probar que los valores funcionan
    RAISE NOTICE 'Probando valores de status...';
    
    -- Crear una tabla temporal para probar
    CREATE TEMP TABLE test_status (
        status TEXT CHECK (status IN (
            'pendiente', 'pending',
            'activa', 'active', 
            'finalizada', 'completed',
            'pausada', 'paused',
            'cancelada', 'cancelled'
        ))
    );
    
    -- Probar insertar valores válidos
    INSERT INTO test_status VALUES ('activa');
    INSERT INTO test_status VALUES ('active');
    INSERT INTO test_status VALUES ('pendiente');
    INSERT INTO test_status VALUES ('pending');
    
    RAISE NOTICE '✅ Constraint corregido exitosamente';
    
    -- Limpiar tabla temporal
    DROP TABLE test_status;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '⚠️  Error al probar constraint: %', SQLERRM;
END $$;

-- =====================================================
-- PASO 5: ACTUALIZAR DATOS EXISTENTES SI ES NECESARIO
-- =====================================================

-- Verificar si hay datos con valores que no coinciden
DO $$
DECLARE
    v_invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_invalid_count
    FROM activity_enrollments
    WHERE status NOT IN (
        'pendiente', 'pending',
        'activa', 'active', 
        'finalizada', 'completed',
        'pausada', 'paused',
        'cancelada', 'cancelled'
    );
    
    IF v_invalid_count > 0 THEN
        RAISE NOTICE 'Encontrados % registros con status inválido, actualizando...', v_invalid_count;
        
        -- Actualizar valores comunes
        UPDATE activity_enrollments SET status = 'activa' WHERE status = 'enrolled';
        UPDATE activity_enrollments SET status = 'finalizada' WHERE status = 'finished';
        UPDATE activity_enrollments SET status = 'cancelada' WHERE status = 'cancelled';
        
        RAISE NOTICE 'Datos actualizados';
    ELSE
        RAISE NOTICE 'Todos los datos tienen status válido';
    END IF;
END $$;

-- =====================================================
-- PASO 6: VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
    v_constraint_definition TEXT;
    v_test_result BOOLEAN;
BEGIN
    -- Verificar constraint final
    SELECT check_clause INTO v_constraint_definition
    FROM information_schema.check_constraints 
    WHERE constraint_name = 'activity_enrollments_status_check';
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'CONSTRAINT CORREGIDO EXITOSAMENTE';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Constraint final: %', v_constraint_definition;
    RAISE NOTICE '=========================================';
    
    -- Probar que funciona con 'activa'
    BEGIN
        INSERT INTO activity_enrollments (activity_id, client_id, status, start_date)
        VALUES (1, (SELECT id FROM auth.users LIMIT 1), 'activa', CURRENT_DATE);
        
        -- Si llegamos aquí, funciona
        v_test_result := true;
        
        -- Limpiar el registro de prueba
        DELETE FROM activity_enrollments 
        WHERE activity_id = 1 AND status = 'activa' AND start_date = CURRENT_DATE;
        
    EXCEPTION
        WHEN OTHERS THEN
            v_test_result := false;
            RAISE WARNING 'Error al probar insert con activa: %', SQLERRM;
    END;
    
    IF v_test_result THEN
        RAISE NOTICE '✅ Constraint funciona correctamente con activa';
    ELSE
        RAISE WARNING '⚠️  Constraint no funciona correctamente';
    END IF;
END $$;

RAISE NOTICE 'Corrección del constraint de status completada';
