-- FIX: Update handle_new_user to match actual user_profiles schema
-- Removing 'bio' column which does not exist in the table

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_full_name TEXT;
BEGIN
  -- Determinar el rol del usuario desde los metadatos
  user_role := COALESCE(
    NEW.raw_app_meta_data->>'role',
    NEW.raw_user_meta_data->>'role',
    'client'
  );

  -- Determinar el nombre completo
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    'Usuario'
  );
  
  -- Insertar o actualizar en user_profiles (sin bio)
  INSERT INTO public.user_profiles (
    id,
    full_name,
    email,
    avatar_url,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    user_full_name,
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    user_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    avatar_url = EXCLUDED.avatar_url,
    role = EXCLUDED.role,
    updated_at = NOW();
    
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- NUNCA permitir que el trigger falle y bloquee el registro
  RAISE WARNING 'Error en handle_new_user para usuario %: % %', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
