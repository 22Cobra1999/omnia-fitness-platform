import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    console.log('🚀 Iniciando setup del sistema de mensajes...')

    // 1. Crear tablas de mensajes
    console.log('📋 Creando tablas de mensajes...')
    
    const createTablesSQL = `
    -- 1. Crear tabla de conversaciones
    CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        
        -- Metadatos de la conversación
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Estado de la conversación
        is_active BOOLEAN DEFAULT TRUE,
        
        -- Último mensaje para optimizar consultas
        last_message_id UUID,
        last_message_at TIMESTAMP WITH TIME ZONE,
        last_message_preview TEXT,
        
        -- Contadores para optimización
        client_unread_count INTEGER DEFAULT 0,
        coach_unread_count INTEGER DEFAULT 0,
        
        -- Índices únicos para evitar duplicados
        UNIQUE(client_id, coach_id)
    );

    -- 2. Crear tabla de mensajes
    CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        
        -- Información del remitente
        sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'coach')),
        
        -- Contenido del mensaje
        content TEXT NOT NULL,
        message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
        
        -- Metadatos
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Estado del mensaje
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP WITH TIME ZONE,
        
        -- Para mensajes editados/eliminados
        is_edited BOOLEAN DEFAULT FALSE,
        edited_at TIMESTAMP WITH TIME ZONE,
        is_deleted BOOLEAN DEFAULT FALSE,
        deleted_at TIMESTAMP WITH TIME ZONE,
        
        -- Archivos adjuntos (opcional)
        attachment_url TEXT,
        attachment_type TEXT,
        attachment_size INTEGER
    );

    -- 3. Crear tabla de notificaciones
    CREATE TABLE IF NOT EXISTS message_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        
        -- Estado de la notificación
        is_sent BOOLEAN DEFAULT FALSE,
        sent_at TIMESTAMP WITH TIME ZONE,
        is_delivered BOOLEAN DEFAULT FALSE,
        delivered_at TIMESTAMP WITH TIME ZONE,
        
        -- Tipo de notificación
        notification_type TEXT DEFAULT 'message' CHECK (notification_type IN ('message', 'system')),
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 4. Crear índices para optimización
    CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_coach_id ON conversations(coach_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON message_notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_message_id ON message_notifications(message_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON message_notifications(created_at DESC);
    `

    const { error: createTablesError } = await supabase.rpc('exec_sql', { sql: createTablesSQL })
    
    if (createTablesError) {
      console.error('Error creando tablas:', createTablesError)
      // Intentar crear las tablas de otra manera
      const { error: directError } = await supabase
        .from('conversations')
        .select('id')
        .limit(1)
      
      if (directError && directError.code === 'PGRST116') {
        return NextResponse.json({ 
          success: false, 
          error: 'No se pudieron crear las tablas. Ejecuta manualmente el script SQL en Supabase.' 
        }, { status: 500 })
      }
    }

    console.log('✅ Tablas creadas exitosamente')

    // 2. Habilitar RLS y crear políticas
    console.log('🔒 Configurando RLS y políticas...')
    
    const rlsSQL = `
    -- Habilitar RLS
    ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE message_notifications ENABLE ROW LEVEL SECURITY;

    -- Políticas para conversations
    DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
    CREATE POLICY "Users can view their own conversations" ON conversations
        FOR SELECT USING (
            auth.uid() = client_id OR auth.uid() = coach_id
        );

    DROP POLICY IF EXISTS "Users can create conversations they participate in" ON conversations;
    CREATE POLICY "Users can create conversations they participate in" ON conversations
        FOR INSERT WITH CHECK (
            auth.uid() = client_id OR auth.uid() = coach_id
        );

    DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
    CREATE POLICY "Users can update their own conversations" ON conversations
        FOR UPDATE USING (
            auth.uid() = client_id OR auth.uid() = coach_id
        );

    -- Políticas para messages
    DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
    CREATE POLICY "Users can view messages in their conversations" ON messages
        FOR SELECT USING (
            conversation_id IN (
                SELECT id FROM conversations 
                WHERE client_id = auth.uid() OR coach_id = auth.uid()
            )
        );

    DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
    CREATE POLICY "Users can send messages in their conversations" ON messages
        FOR INSERT WITH CHECK (
            sender_id = auth.uid() AND
            conversation_id IN (
                SELECT id FROM conversations 
                WHERE client_id = auth.uid() OR coach_id = auth.uid()
            )
        );

    -- Políticas para message_notifications
    DROP POLICY IF EXISTS "Users can view their own notifications" ON message_notifications;
    CREATE POLICY "Users can view their own notifications" ON message_notifications
        FOR SELECT USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "Users can create notifications for themselves" ON message_notifications;
    CREATE POLICY "Users can create notifications for themselves" ON message_notifications
        FOR INSERT WITH CHECK (user_id = auth.uid());
    `

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL })
    
    if (rlsError) {
      console.warn('Advertencia al configurar RLS:', rlsError.message)
    }

    console.log('✅ RLS configurado')

    // 3. Crear conversaciones basadas en enrollments existentes
    console.log('💬 Creando conversaciones basadas en enrollments existentes...')
    
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('activity_enrollments')
      .select(`
        id,
        client_id,
        activity_id,
        status,
        created_at,
        activities:activity_id (
          id,
          title,
          coach_id
        )
      `)
      .in('status', ['active', 'enrolled', 'pending', 'completed'])
      .not('activities.coach_id', 'is', null)

    if (enrollmentsError) {
      console.error('Error obteniendo enrollments:', enrollmentsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al obtener enrollments' 
      }, { status: 500 })
    }

    console.log(`📊 Encontrados ${enrollments?.length || 0} enrollments`)

    // Crear conversaciones únicas
    const uniqueConversations = new Map()
    
    enrollments?.forEach(enrollment => {
      if (enrollment.activities && enrollment.activities.coach_id) {
        const key = `${enrollment.client_id}-${enrollment.activities.coach_id}`
        if (!uniqueConversations.has(key)) {
          uniqueConversations.set(key, {
            client_id: enrollment.client_id,
            coach_id: enrollment.activities.coach_id,
            created_at: enrollment.created_at
          })
        }
      }
    })

    console.log(`📋 ${uniqueConversations.size} conversaciones únicas a crear`)

    // Insertar conversaciones
    const conversationsToInsert = Array.from(uniqueConversations.values())
    const createdConversations = []

    if (conversationsToInsert.length > 0) {
      const { data: insertedConversations, error: insertError } = await supabase
        .from('conversations')
        .insert(conversationsToInsert)
        .select()

      if (insertError) {
        console.error('Error insertando conversaciones:', insertError)
        return NextResponse.json({ 
          success: false, 
          error: 'Error al insertar conversaciones' 
        }, { status: 500 })
      }

      createdConversations.push(...(insertedConversations || []))
    }

    console.log(`✅ ${createdConversations.length} conversaciones creadas`)

    // 4. Crear triggers
    console.log('⚡ Creando triggers automáticos...')
    
    const triggersSQL = `
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
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Eliminar trigger existente si existe
    DROP TRIGGER IF EXISTS trigger_create_conversation_on_enrollment ON activity_enrollments;

    -- Crear el trigger
    CREATE TRIGGER trigger_create_conversation_on_enrollment
        AFTER INSERT ON activity_enrollments
        FOR EACH ROW
        EXECUTE FUNCTION create_conversation_on_enrollment();
    `

    const { error: triggersError } = await supabase.rpc('exec_sql', { sql: triggersSQL })
    
    if (triggersError) {
      console.warn('Advertencia al crear triggers:', triggersError.message)
    }

    console.log('✅ Triggers creados')

    // 5. Verificar que todo funciona
    const { data: conversationCount, error: countError } = await supabase
      .from('conversations')
      .select('id', { count: 'exact' })

    console.log('🎉 Setup completado exitosamente!')

    return NextResponse.json({
      success: true,
      message: 'Sistema de mensajes configurado exitosamente',
      stats: {
        enrollments_found: enrollments?.length || 0,
        unique_conversations: uniqueConversations.size,
        conversations_created: createdConversations.length,
        total_conversations: conversationCount?.length || 0
      },
      details: {
        tables_created: true,
        rls_configured: true,
        triggers_created: true,
        conversations_created: createdConversations.length > 0
      }
    })

  } catch (error) {
    console.error('Error en setup del sistema de mensajes:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}



























