-- Insertar plan manual para el coach
-- Ejecutar este SQL en Supabase Dashboard después de reemplazar el coach_id

-- Primero, buscar el coach_id del usuario
-- Reemplaza 'f.pomati@usal.edu.ar' con el email del coach si es diferente
SELECT 
  c.id as coach_id,
  u.email,
  u.id as user_id
FROM coaches c
JOIN users u ON c.user_id = u.id
WHERE u.email = 'f.pomati@usal.edu.ar';

-- Luego inserta el plan usando el coach_id obtenido
-- Reemplaza 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f' con el coach_id real de la consulta anterior
INSERT INTO planes_uso_coach (
  coach_id,
  plan_type,
  storage_limit_gb,
  storage_used_gb,
  status,
  started_at
) VALUES (
  'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f', -- Reemplaza con el coach_id real
  'free', -- Plan inicial: free, basico, black, premium
  1.00,   -- Límite según plan (free=1, basico=5, black=25, premium=100)
  0.000000, -- Uso actual (se actualizará automáticamente)
  'active',
  NOW()
)
ON CONFLICT DO NOTHING; -- Evita duplicados si ya existe

-- Verificar que se insertó correctamente
SELECT * FROM planes_uso_coach 
WHERE coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f' 
AND status = 'active';





























