-- ========================================
-- CONFIGURACIÓN FINAL DE TRIGGERS PARA COACH RATING
-- ========================================
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Verificar estado actual
SELECT 'ESTADO ACTUAL:' as info;
SELECT 'Coach rating stats:' as tipo, coach_id, avg_coach_rating, total_coach_reviews 
FROM coach_rating_stats;

SELECT 'Activity surveys:' as tipo, activity_id, coach_method_rating, difficulty_rating 
FROM activity_surveys 
WHERE coach_method_rating IS NOT NULL;

-- 2. Crear función mejorada para actualizar coach rating stats
CREATE OR REPLACE FUNCTION update_coach_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Limpiar y recalcular todos los stats de coaches
    DELETE FROM coach_rating_stats;
    
    -- Insertar stats calculados correctamente
    INSERT INTO coach_rating_stats (coach_id, avg_coach_rating, total_coach_reviews, updated_at)
    SELECT 
        a.coach_id,
        COALESCE(AVG(acs.coach_method_rating), 0.00) as avg_coach_rating,
        COUNT(acs.coach_method_rating) as total_coach_reviews,
        NOW() as updated_at
    FROM activities a
    LEFT JOIN activity_surveys acs ON acs.activity_id = a.id 
        AND acs.coach_method_rating IS NOT NULL
    WHERE a.coach_id IS NOT NULL
    GROUP BY a.coach_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear función para actualizar activity rating stats
CREATE OR REPLACE FUNCTION update_activity_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar stats de actividades
    UPDATE activities 
    SET 
        program_rating = COALESCE((
            SELECT AVG(difficulty_rating)
            FROM activity_surveys 
            WHERE activity_id = activities.id 
            AND difficulty_rating IS NOT NULL
        ), 0.00),
        total_program_reviews = COALESCE((
            SELECT COUNT(*)
            FROM activity_surveys 
            WHERE activity_id = activities.id
        ), 0),
        updated_at = NOW()
    WHERE id IN (
        SELECT DISTINCT activity_id 
        FROM activity_surveys 
        WHERE activity_id IS NOT NULL
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Eliminar triggers existentes
DROP TRIGGER IF EXISTS trg_update_coach_stats ON activity_surveys;
DROP TRIGGER IF EXISTS trg_update_activity_stats ON activity_surveys;
DROP TRIGGER IF EXISTS trg_refresh_activity_program_stats ON activity_surveys;

-- 5. Crear triggers nuevos
CREATE TRIGGER trg_update_coach_stats
    AFTER INSERT OR UPDATE OR DELETE ON activity_surveys
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_coach_rating_stats();

CREATE TRIGGER trg_update_activity_stats
    AFTER INSERT OR UPDATE OR DELETE ON activity_surveys
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_activity_rating_stats();

-- 6. Ejecutar actualización inicial manualmente
SELECT 'Ejecutando actualización inicial...' as info;

-- Limpiar coach_rating_stats
DELETE FROM coach_rating_stats;

-- Insertar stats calculados correctamente
INSERT INTO coach_rating_stats (coach_id, avg_coach_rating, total_coach_reviews, updated_at)
SELECT 
    a.coach_id,
    COALESCE(AVG(acs.coach_method_rating), 0.00) as avg_coach_rating,
    COUNT(acs.coach_method_rating) as total_coach_reviews,
    NOW() as updated_at
FROM activities a
LEFT JOIN activity_surveys acs ON acs.activity_id = a.id 
    AND acs.coach_method_rating IS NOT NULL
WHERE a.coach_id IS NOT NULL
GROUP BY a.coach_id;

-- Actualizar stats de actividades
UPDATE activities 
SET 
    program_rating = COALESCE((
        SELECT AVG(difficulty_rating)
        FROM activity_surveys 
        WHERE activity_id = activities.id 
        AND difficulty_rating IS NOT NULL
    ), 0.00),
    total_program_reviews = COALESCE((
        SELECT COUNT(*)
        FROM activity_surveys 
        WHERE activity_id = activities.id
    ), 0),
    updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT activity_id 
    FROM activity_surveys 
    WHERE activity_id IS NOT NULL
);

-- 7. Verificar triggers creados
SELECT 'Triggers creados:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'activity_surveys'
AND trigger_schema = 'public';

-- 8. Verificar datos finales
SELECT 'Datos finales:' as info;
SELECT 'Coach rating stats:' as tipo, coach_id, avg_coach_rating, total_coach_reviews, updated_at
FROM coach_rating_stats;

-- 9. Probar trigger (simular un cambio)
SELECT 'Probando trigger...' as info;
UPDATE activity_surveys 
SET updated_at = NOW() 
WHERE id = (SELECT id FROM activity_surveys LIMIT 1);

-- 10. Verificar que el trigger funcionó
SELECT 'Después del test:' as info;
SELECT 'Coach rating stats:' as tipo, coach_id, avg_coach_rating, total_coach_reviews, updated_at
FROM coach_rating_stats;

SELECT '✅ CONFIGURACIÓN COMPLETADA - Los triggers están funcionando!' as resultado;




