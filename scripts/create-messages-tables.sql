-- Script simplificado para crear las tablas de mensajería
-- Ejecutar este script en Supabase SQL Editor

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

-- 5. Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Crear trigger para conversations
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Crear función para actualizar el último mensaje
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar la conversación con el último mensaje
    UPDATE conversations 
    SET 
        last_message_id = NEW.id,
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    -- Incrementar contador de mensajes no leídos para el destinatario
    IF NEW.sender_type = 'client' THEN
        UPDATE conversations 
        SET coach_unread_count = coach_unread_count + 1
        WHERE id = NEW.conversation_id;
    ELSE
        UPDATE conversations 
        SET client_unread_count = client_unread_count + 1
        WHERE id = NEW.conversation_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Crear trigger para actualizar conversación cuando se inserta un mensaje
DROP TRIGGER IF EXISTS update_conversation_on_message_insert ON messages;
CREATE TRIGGER update_conversation_on_message_insert
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- 9. Crear función para crear conversación automáticamente
CREATE OR REPLACE FUNCTION create_conversation_if_not_exists(
    p_client_id UUID,
    p_coach_id UUID
) RETURNS UUID AS $$
DECLARE
    conversation_uuid UUID;
BEGIN
    -- Buscar conversación existente
    SELECT id INTO conversation_uuid
    FROM conversations
    WHERE client_id = p_client_id AND coach_id = p_coach_id;
    
    -- Si no existe, crear una nueva
    IF conversation_uuid IS NULL THEN
        INSERT INTO conversations (client_id, coach_id)
        VALUES (p_client_id, p_coach_id)
        RETURNING id INTO conversation_uuid;
    END IF;
    
    RETURN conversation_uuid;
END;
$$ language 'plpgsql';

-- 10. Habilitar RLS (Row Level Security)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_notifications ENABLE ROW LEVEL SECURITY;

-- 11. Crear políticas RLS
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

-- 12. Verificar que las tablas se crearon correctamente
SELECT 
    'conversations' as table_name, 
    COUNT(*) as row_count 
FROM conversations
UNION ALL
SELECT 
    'messages' as table_name, 
    COUNT(*) as row_count 
FROM messages
UNION ALL
SELECT 
    'message_notifications' as table_name, 
    COUNT(*) as row_count 
FROM message_notifications;

-- 13. Mostrar información de las tablas creadas
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages', 'message_notifications')
ORDER BY table_name;


































