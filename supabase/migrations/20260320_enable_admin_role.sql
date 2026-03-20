-- 1. Eliminar la restricción vieja que bloqueaba el rol admin
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_level_check;

-- 2. Crear la nueva restricción que INCLUYE el rol 'admin'
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_level_check 
CHECK (level IN ('client', 'coach', 'admin'));

-- 3. Asignar el rol admin al usuario solicitado
UPDATE user_profiles 
SET level = 'admin' 
WHERE email = 'cuchilloscutoff@gmail.com';

-- 4. Asegurar que las RLS no bloqueen al admin
-- (Esto asume que el admin debe poder ver todo en la tabla banco para el dashboard)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'banco' AND policyname = 'Admins can see everything') THEN
        DROP POLICY "Admins can see everything" ON banco;
    END IF;
END $$;

CREATE POLICY "Admins can see everything" ON banco
FOR SELECT TO authenticated
USING (
  (SELECT level FROM user_profiles WHERE id = auth.uid()) = 'admin'
);
