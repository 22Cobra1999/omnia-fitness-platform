-- =============================================
-- SCHEMA PARA SISTEMA DE MENSAJERÍA OMNIA
-- Diseñado para conversaciones entre clientes y coaches
-- =============================================

-- Tabla principal de conversaciones
-- Cada conversación representa un hilo entre un cliente y un coach
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Metadatos de la conversación
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Estado de la conversación
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Último mensaje para optimizar consultas
    last_message_id UUID REFERENCES messages(id),
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_preview TEXT,
    
    -- Contadores para optimización
    client_unread_count INTEGER DEFAULT 0,
    coach_unread_count INTEGER DEFAULT 0,
    
    -- Índices únicos para evitar duplicados
    UNIQUE(client_id, coach_id)
);

-- Tabla de mensajes
-- Almacena todos los mensajes individuales
CREATE TABLE messages (
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

-- Tabla de notificaciones push
-- Para gestionar notificaciones en tiempo real
CREATE TABLE message_notifications (
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

-- =============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =============================================

-- Índices para conversations
CREATE INDEX idx_conversations_client_id ON conversations(client_id);
CREATE INDEX idx_conversations_coach_id ON conversations(coach_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Índices para messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

-- Índices para notificaciones
CREATE INDEX idx_notifications_user_id ON message_notifications(user_id);
CREATE INDEX idx_notifications_message_id ON message_notifications(message_id);
CREATE INDEX idx_notifications_created_at ON message_notifications(created_at DESC);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para conversations
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar el último mensaje en la conversación
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

-- Trigger para actualizar conversación cuando se inserta un mensaje
CREATE TRIGGER update_conversation_on_message_insert
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Función para crear conversación automáticamente
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

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista para obtener conversaciones con información del coach
CREATE VIEW conversations_with_coach_info AS
SELECT 
    c.*,
    u.full_name as coach_name,
    u.avatar_url as coach_avatar,
    u.email as coach_email
FROM conversations c
JOIN auth.users u ON c.coach_id = u.id
WHERE c.is_active = TRUE;

-- Vista para obtener conversaciones con información del cliente
CREATE VIEW conversations_with_client_info AS
SELECT 
    c.*,
    u.full_name as client_name,
    u.avatar_url as client_avatar,
    u.email as client_email
FROM conversations c
JOIN auth.users u ON c.client_id = u.id
WHERE c.is_active = TRUE;

-- =============================================
-- RLS (Row Level Security)
-- =============================================

-- Habilitar RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para conversations
CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (
        auth.uid() = client_id OR auth.uid() = coach_id
    );

CREATE POLICY "Users can create conversations they participate in" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid() = client_id OR auth.uid() = coach_id
    );

CREATE POLICY "Users can update their own conversations" ON conversations
    FOR UPDATE USING (
        auth.uid() = client_id OR auth.uid() = coach_id
    );

-- Políticas para messages
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE client_id = auth.uid() OR coach_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages in their conversations" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE client_id = auth.uid() OR coach_id = auth.uid()
        )
    );

-- Políticas para message_notifications
CREATE POLICY "Users can view their own notifications" ON message_notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create notifications for themselves" ON message_notifications
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- =============================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =============================================

COMMENT ON TABLE conversations IS 'Almacena las conversaciones entre clientes y coaches';
COMMENT ON TABLE messages IS 'Almacena todos los mensajes individuales dentro de las conversaciones';
COMMENT ON TABLE message_notifications IS 'Gestiona las notificaciones push para mensajes';

COMMENT ON COLUMN conversations.client_unread_count IS 'Contador de mensajes no leídos para el cliente';
COMMENT ON COLUMN conversations.coach_unread_count IS 'Contador de mensajes no leídos para el coach';
COMMENT ON COLUMN conversations.last_message_preview IS 'Vista previa del último mensaje (máximo 100 caracteres)';

COMMENT ON COLUMN messages.sender_type IS 'Tipo de remitente: client o coach';
COMMENT ON COLUMN messages.message_type IS 'Tipo de mensaje: text, image, file, system';




























