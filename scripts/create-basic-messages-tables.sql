-- Script simplificado para crear las tablas básicas de mensajería
-- Ejecutar este script en Supabase SQL Editor

-- 1. Crear tabla de conversaciones (versión simplificada)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_preview TEXT,
    client_unread_count INTEGER DEFAULT 0,
    coach_unread_count INTEGER DEFAULT 0,
    UNIQUE(client_id, coach_id)
);

-- 2. Crear tabla de mensajes (versión simplificada)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'coach')),
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 3. Crear índices básicos
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_coach_id ON conversations(coach_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- 4. Habilitar RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas básicas de RLS
CREATE POLICY IF NOT EXISTS "Users can view their own conversations" ON conversations
    FOR SELECT USING (
        auth.uid() = client_id OR auth.uid() = coach_id
    );

CREATE POLICY IF NOT EXISTS "Users can create conversations they participate in" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid() = client_id OR auth.uid() = coach_id
    );

CREATE POLICY IF NOT EXISTS "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE client_id = auth.uid() OR coach_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can send messages in their conversations" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE client_id = auth.uid() OR coach_id = auth.uid()
        )
    );

-- 6. Crear función simple para crear conversaciones
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

-- 7. Verificar que las tablas se crearon
SELECT 
    'conversations' as table_name, 
    COUNT(*) as row_count 
FROM conversations
UNION ALL
SELECT 
    'messages' as table_name, 
    COUNT(*) as row_count 
FROM messages;





























