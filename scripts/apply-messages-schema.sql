-- Script para aplicar el schema de mensajes a la base de datos
-- Ejecutar este script en Supabase SQL Editor

-- Aplicar el schema completo de mensajes
\i db/messages_schema.sql

-- Verificar que las tablas se crearon correctamente
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages', 'message_notifications')
ORDER BY table_name;

-- Verificar que las funciones se crearon correctamente
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_updated_at_column', 'update_conversation_last_message', 'create_conversation_if_not_exists')
ORDER BY routine_name;

-- Verificar que las vistas se crearon correctamente
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('conversations_with_coach_info', 'conversations_with_client_info')
ORDER BY table_name;

-- Verificar que los índices se crearon correctamente
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'messages', 'message_notifications')
ORDER BY tablename, indexname;

-- Verificar que las políticas RLS se crearon correctamente
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'messages', 'message_notifications')
ORDER BY tablename, policyname;


































