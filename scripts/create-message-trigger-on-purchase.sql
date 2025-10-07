-- Script para crear trigger que genere conversaciones automáticamente al comprar actividades
-- Ejecutar este script en Supabase SQL Editor

-- 1. Verificar que las tablas necesarias existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations') THEN
        RAISE EXCEPTION 'La tabla conversations no existe. Ejecuta primero create-messages-tables.sql';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_enrollments') THEN
        RAISE EXCEPTION 'La tabla activity_enrollments no existe.';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activities') THEN
        RAISE EXCEPTION 'La tabla activities no existe.';
    END IF;
END $$;

-- 2. Crear función para crear conversación automáticamente
CREATE OR REPLACE FUNCTION create_conversation_on_enrollment()
RETURNS TRIGGER AS $$
DECLARE
    activity_coach_id UUID;
    conversation_exists BOOLEAN;
BEGIN
    -- Obtener el coach_id de la actividad
    SELECT coach_id INTO activity_coach_id
    FROM activities
    WHERE id = NEW.activity_id;
    
    -- Verificar que la actividad tiene un coach
    IF activity_coach_id IS NULL THEN
        RAISE WARNING 'Actividad % no tiene coach asignado, no se creará conversación', NEW.activity_id;
        RETURN NEW;
    END IF;
    
    -- Verificar si ya existe una conversación
    SELECT EXISTS(
        SELECT 1 FROM conversations 
        WHERE client_id = NEW.client_id 
        AND coach_id = activity_coach_id
    ) INTO conversation_exists;
    
    -- Si no existe conversación, crear una nueva
    IF NOT conversation_exists THEN
        INSERT INTO conversations (
            client_id, 
            coach_id, 
            is_active, 
            created_at
        ) VALUES (
            NEW.client_id, 
            activity_coach_id, 
            TRUE, 
            NOW()
        );
        
        RAISE NOTICE 'Conversación creada automáticamente para client_id: %, coach_id: %', NEW.client_id, activity_coach_id;
    ELSE
        RAISE NOTICE 'Conversación ya existe para client_id: %, coach_id: %', NEW.client_id, activity_coach_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS trigger_create_conversation_on_enrollment ON activity_enrollments;

-- 4. Crear el trigger
CREATE TRIGGER trigger_create_conversation_on_enrollment
    AFTER INSERT ON activity_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION create_conversation_on_enrollment();

-- 5. Crear función para actualizar conversación cuando cambia el status del enrollment
CREATE OR REPLACE FUNCTION update_conversation_on_enrollment_status()
RETURNS TRIGGER AS $$
DECLARE
    activity_coach_id UUID;
BEGIN
    -- Solo procesar si el status cambió
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- Obtener el coach_id de la actividad
    SELECT coach_id INTO activity_coach_id
    FROM activities
    WHERE id = NEW.activity_id;
    
    -- Si no hay coach, no hacer nada
    IF activity_coach_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Actualizar el estado de la conversación basado en el status del enrollment
    IF NEW.status IN ('active', 'enrolled', 'pending') AND OLD.status NOT IN ('active', 'enrolled', 'pending') THEN
        -- Activar conversación
        UPDATE conversations 
        SET is_active = TRUE, updated_at = NOW()
        WHERE client_id = NEW.client_id AND coach_id = activity_coach_id;
        
        RAISE NOTICE 'Conversación activada para client_id: %, coach_id: %', NEW.client_id, activity_coach_id;
        
    ELSIF NEW.status IN ('completed', 'cancelled') AND OLD.status IN ('active', 'enrolled', 'pending') THEN
        -- Desactivar conversación (pero mantener el historial)
        UPDATE conversations 
        SET is_active = FALSE, updated_at = NOW()
        WHERE client_id = NEW.client_id AND coach_id = activity_coach_id;
        
        RAISE NOTICE 'Conversación desactivada para client_id: %, coach_id: %', NEW.client_id, activity_coach_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear trigger para actualizar conversaciones cuando cambia el status
DROP TRIGGER IF EXISTS trigger_update_conversation_on_enrollment_status ON activity_enrollments;

CREATE TRIGGER trigger_update_conversation_on_enrollment_status
    AFTER UPDATE ON activity_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_enrollment_status();

-- 7. Verificar que los triggers se crearon correctamente
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN (
    'trigger_create_conversation_on_enrollment',
    'trigger_update_conversation_on_enrollment_status'
)
ORDER BY trigger_name;

-- 8. Mostrar información de las funciones creadas
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name IN (
    'create_conversation_on_enrollment',
    'update_conversation_on_enrollment_status'
)
ORDER BY routine_name;

-- 9. Mensaje de confirmación
SELECT '✅ Triggers de mensajería creados exitosamente' as status;
SELECT '📋 Las conversaciones se crearán automáticamente al comprar actividades' as info;
SELECT '🔄 Las conversaciones se activarán/desactivarán según el status del enrollment' as info;




























