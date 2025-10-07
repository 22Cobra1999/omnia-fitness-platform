-- Configuración simple de RLS para activity_media

-- Política para permitir acceso a coaches
CREATE POLICY "Enable all access for coaches" ON activity_media
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM activities a
    JOIN user_profiles up ON a.coach_id = up.id
    WHERE a.id = activity_media.activity_id
    AND up.role = 'coach'
  )
);

-- Habilitar RLS
ALTER TABLE activity_media ENABLE ROW LEVEL SECURITY;

-- Política alternativa más permisiva (si la anterior no funciona)
-- CREATE POLICY "Enable all access" ON activity_media FOR ALL USING (true);


