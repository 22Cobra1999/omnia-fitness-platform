-- ================================================
-- EJEMPLO DE USO: workshop_versions
-- ================================================
-- Estructura en español: "version 1 empezada el dd/mm/aa y finalizada el dd/mm/aa"

-- Ejemplo de datos almacenados:
-- {
--   "versions": [
--     {
--       "version": 1,
--       "empezada_el": "01/01/24",
--       "finalizada_el": "15/01/24"
--     },
--     {
--       "version": 2,
--       "empezada_el": "20/01/24",
--       "finalizada_el": "05/02/24"
--     }
--   ]
-- }

-- ================================================
-- EJEMPLO: Agregar nueva versión cuando se finaliza un taller
-- ================================================
-- Cuando el coach finaliza un taller, se debe agregar una nueva versión:
/*
UPDATE activities
SET workshop_versions = jsonb_set(
  COALESCE(workshop_versions, '{"versions": []}'::jsonb),
  '{versions}',
  (
    COALESCE(workshop_versions->'versions', '[]'::jsonb) || 
    jsonb_build_array(
      jsonb_build_object(
        'version', COALESCE(jsonb_array_length(COALESCE(workshop_versions->'versions', '[]'::jsonb)), 0) + 1,
        'empezada_el', format_date_spanish(created_at),
        'finalizada_el', format_date_spanish(finished_at)
      )
    )
  )
)
WHERE id = :activity_id;
*/

-- ================================================
-- EJEMPLO: Leer versiones para mostrar al usuario
-- ================================================
-- Para mostrar las versiones en español:
/*
SELECT 
  id,
  title,
  jsonb_array_elements(workshop_versions->'versions') AS version_info
FROM activities
WHERE type = 'workshop'
  AND workshop_versions->'versions' IS NOT NULL;

-- Resultado esperado por versión:
-- {
--   "version": 1,
--   "empezada_el": "01/01/24",
--   "finalizada_el": "15/01/24"
-- }
-- 
-- Para mostrar: "version 1 empezada el 01/01/24 y finalizada el 15/01/24"
*/
