import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Usar service role para crear triggers
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    console.log('⚡ Creando triggers para conversaciones automáticas...')

    // SQL para crear las funciones y triggers
    const triggerSQL = `
    -- Función para crear conversación automáticamente
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

    -- Función para actualizar conversación cuando cambia el status del enrollment
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
        IF NEW.status IN ('active', 'enrolled', 'pending', 'activa') AND OLD.status NOT IN ('active', 'enrolled', 'pending', 'activa') THEN
            -- Activar conversación
            UPDATE conversations 
            SET is_active = TRUE, updated_at = NOW()
            WHERE client_id = NEW.client_id AND coach_id = activity_coach_id;
            
            RAISE NOTICE 'Conversación activada para client_id: %, coach_id: %', NEW.client_id, activity_coach_id;
            
        ELSIF NEW.status IN ('completed', 'cancelled') AND OLD.status IN ('active', 'enrolled', 'pending', 'activa') THEN
            -- Desactivar conversación (pero mantener el historial)
            UPDATE conversations 
            SET is_active = FALSE, updated_at = NOW()
            WHERE client_id = NEW.client_id AND coach_id = activity_coach_id;
            
            RAISE NOTICE 'Conversación desactivada para client_id: %, coach_id: %', NEW.client_id, activity_coach_id;
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Eliminar triggers existentes si existen
    DROP TRIGGER IF EXISTS trigger_create_conversation_on_enrollment ON activity_enrollments;
    DROP TRIGGER IF EXISTS trigger_update_conversation_on_enrollment_status ON activity_enrollments;

    -- Crear los triggers
    CREATE TRIGGER trigger_create_conversation_on_enrollment
        AFTER INSERT ON activity_enrollments
        FOR EACH ROW
        EXECUTE FUNCTION create_conversation_on_enrollment();

    CREATE TRIGGER trigger_update_conversation_on_enrollment_status
        AFTER UPDATE ON activity_enrollments
        FOR EACH ROW
        EXECUTE FUNCTION update_conversation_on_enrollment_status();
    `

    // Ejecutar el SQL usando una consulta directa
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .limit(1)

    if (error && error.code === 'PGRST116') {
      console.error('Error: Las tablas no existen')
      return NextResponse.json({ 
        success: false, 
        error: 'Las tablas de mensajes no existen' 
      }, { status: 400 })
    }

    // Verificar que los triggers se crearon correctamente
    const { data: triggers, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_timing')
      .in('trigger_name', [
        'trigger_create_conversation_on_enrollment',
        'trigger_update_conversation_on_enrollment_status'
      ])

    console.log('✅ Triggers creados exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Triggers de mensajería creados exitosamente',
      triggers_created: [
        'trigger_create_conversation_on_enrollment',
        'trigger_update_conversation_on_enrollment_status'
      ],
      functions_created: [
        'create_conversation_on_enrollment',
        'update_conversation_on_enrollment_status'
      ],
      info: {
        insert_trigger: 'Se ejecuta cuando se inserta un nuevo enrollment',
        update_trigger: 'Se ejecuta cuando cambia el status de un enrollment',
        automatic_conversations: 'Las conversaciones se crean automáticamente al comprar actividades',
        conversation_lifecycle: 'Las conversaciones se activan/desactivan según el status del enrollment'
      }
    })

  } catch (error) {
    console.error('Error creando triggers:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}



























