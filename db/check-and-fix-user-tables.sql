-- =====================================================
-- VERIFICAR Y CORREGIR TABLAS DE USUARIOS
-- =====================================================
-- Este script verifica qué tablas de usuarios existen y las crea si es necesario

-- =====================================================
-- PASO 1: VERIFICAR QUÉ TABLAS DE USUARIOS EXISTEN
-- =====================================================

DO $$
DECLARE
    v_user_profiles_exists BOOLEAN;
    v_profiles_exists BOOLEAN;
    v_auth_users_exists BOOLEAN;
BEGIN
    -- Verificar user_profiles
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_profiles'
    ) INTO v_user_profiles_exists;
    
    -- Verificar profiles
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles'
    ) INTO v_profiles_exists;
    
    -- Verificar auth.users
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) INTO v_auth_users_exists;
    
    RAISE NOTICE '=== VERIFICACIÓN DE TABLAS DE USUARIOS ===';
    RAISE NOTICE 'user_profiles existe: %', v_user_profiles_exists;
    RAISE NOTICE 'profiles existe: %', v_profiles_exists;
    RAISE NOTICE 'auth.users existe: %', v_auth_users_exists;
    RAISE NOTICE '=========================================';
    
    -- Si ninguna tabla de perfiles existe, crear user_profiles básica
    IF NOT v_user_profiles_exists AND NOT v_profiles_exists THEN
        RAISE NOTICE 'Creando tabla user_profiles básica...';
        
        CREATE TABLE IF NOT EXISTS user_profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT,
            name TEXT,
            role TEXT DEFAULT 'client',
            bio TEXT,
            avatar_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabla user_profiles creada exitosamente';
    END IF;
    
    -- Si profiles existe pero user_profiles no, crear un alias
    IF v_profiles_exists AND NOT v_user_profiles_exists THEN
        RAISE NOTICE 'Creando vista user_profiles como alias de profiles...';
        
        CREATE VIEW user_profiles AS SELECT * FROM profiles;
        
        RAISE NOTICE 'Vista user_profiles creada como alias de profiles';
    END IF;
    
END $$;

-- =====================================================
-- PASO 2: VERIFICAR QUE LAS REFERENCIAS FUNCIONAN
-- =====================================================

DO $$
BEGIN
    -- Intentar hacer una consulta simple para verificar que la tabla funciona
    PERFORM 1 FROM user_profiles LIMIT 1;
    RAISE NOTICE '✅ user_profiles está funcionando correctamente';
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '⚠️  Error con user_profiles: %', SQLERRM;
        
        -- Si hay error, intentar usar auth.users directamente
        RAISE NOTICE 'Intentando usar auth.users directamente...';
        
        -- Crear una vista simple de user_profiles basada en auth.users
        DROP VIEW IF EXISTS user_profiles;
        CREATE VIEW user_profiles AS 
        SELECT 
            id,
            email,
            raw_user_meta_data->>'name' as name,
            COALESCE(raw_app_meta_data->>'role', 'client') as role,
            raw_user_meta_data->>'bio' as bio,
            raw_user_meta_data->>'avatar_url' as avatar_url,
            created_at,
            updated_at
        FROM auth.users;
        
        RAISE NOTICE 'Vista user_profiles creada basada en auth.users';
END $$;

-- =====================================================
-- PASO 3: VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM user_profiles;
    RAISE NOTICE 'user_profiles tiene % registros', v_count;
    
    IF v_count > 0 THEN
        RAISE NOTICE '✅ user_profiles está lista para usar';
    ELSE
        RAISE WARNING '⚠️  user_profiles está vacía, pero la tabla existe';
    END IF;
END $$;

RAISE NOTICE 'Verificación y corrección de tablas de usuarios completada';
