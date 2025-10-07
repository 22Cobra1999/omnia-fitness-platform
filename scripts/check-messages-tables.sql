-- Script para verificar si las tablas de mensajería existen
-- Ejecutar este script en Supabase SQL Editor

-- 1. Verificar si las tablas existen
SELECT 
    table_name, 
    table_type,
    CASE 
        WHEN table_name IN ('conversations', 'messages', 'message_notifications') 
        THEN '✅ Existe'
        ELSE '❌ No existe'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages', 'message_notifications')
ORDER BY table_name;

-- 2. Si las tablas no existen, mostrarlo claramente
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('conversations', 'messages', 'message_notifications');
    
    IF table_count = 0 THEN
        RAISE NOTICE '❌ NINGUNA tabla de mensajería existe. Necesitas ejecutar create-messages-tables.sql';
    ELSIF table_count < 3 THEN
        RAISE NOTICE '⚠️ Solo % de 3 tablas existen. Ejecuta create-messages-tables.sql para completar', table_count;
    ELSE
        RAISE NOTICE '✅ Todas las tablas de mensajería existen correctamente';
    END IF;
END $$;

-- 3. Verificar funciones
SELECT 
    routine_name, 
    routine_type,
    CASE 
        WHEN routine_name IN ('update_updated_at_column', 'update_conversation_last_message', 'create_conversation_if_not_exists') 
        THEN '✅ Existe'
        ELSE '❌ No existe'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_updated_at_column', 'update_conversation_last_message', 'create_conversation_if_not_exists')
ORDER BY routine_name;

-- 4. Verificar índices
SELECT 
    indexname, 
    tablename,
    '✅ Existe' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'messages', 'message_notifications')
ORDER BY tablename, indexname;

-- 5. Verificar políticas RLS
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    '✅ Existe' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'messages', 'message_notifications')
ORDER BY tablename, policyname;

-- 6. Contar registros en cada tabla (si existen)
DO $$
DECLARE
    conv_count INTEGER;
    msg_count INTEGER;
    notif_count INTEGER;
BEGIN
    -- Verificar conversations
    BEGIN
        SELECT COUNT(*) INTO conv_count FROM conversations;
        RAISE NOTICE '📊 conversations: % registros', conv_count;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '❌ Tabla conversations no existe';
    END;
    
    -- Verificar messages
    BEGIN
        SELECT COUNT(*) INTO msg_count FROM messages;
        RAISE NOTICE '📊 messages: % registros', msg_count;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '❌ Tabla messages no existe';
    END;
    
    -- Verificar message_notifications
    BEGIN
        SELECT COUNT(*) INTO notif_count FROM message_notifications;
        RAISE NOTICE '📊 message_notifications: % registros', notif_count;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '❌ Tabla message_notifications no existe';
    END;
END $$;





























