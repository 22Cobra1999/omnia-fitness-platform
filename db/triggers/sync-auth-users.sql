-- Función para manejar nuevos usuarios y actualizaciones
CREATE OR REPLACE FUNCTION public.handle_auth_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Para nuevos usuarios o actualizaciones
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Insertar o actualizar en user_profiles
    INSERT INTO public.user_profiles (
      user_id, 
      bio,
      preferences,
      created_at,
      updated_at
    ) VALUES (
      NEW.id, 
      'Hola, soy ' || COALESCE(NEW.raw_user_meta_data->>'name', 'usuario') || '!',
      jsonb_build_object(
        'role', COALESCE(NEW.raw_app_meta_data->>'role', 'client'),
        'notifications', true
      ),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      bio = EXCLUDED.bio,
      preferences = public.user_profiles.preferences || jsonb_build_object(
        'role', COALESCE(NEW.raw_app_meta_data->>'role', 'client')
      ),
      updated_at = NOW();
    
    RETURN NEW;
  END IF;
  
  -- Para eliminaciones (opcional)
  IF TG_OP = 'DELETE' THEN
    -- Puedes decidir si quieres eliminar el perfil o no
    -- DELETE FROM public.user_profiles WHERE user_id = OLD.id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_changes ON auth.users;
CREATE TRIGGER on_auth_user_changes
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_changes();
