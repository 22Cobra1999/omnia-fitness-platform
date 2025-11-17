-- ============================================
-- CONSULTAS PARA DIAGNÓSTICO DE VIDEOS DEL COACH
-- Coach ID: b16c4f8c-f47b-4df0-ad2b-13dcbd76263f
-- ============================================

-- ⚡ CONSULTA RÁPIDA: Todos los bunny_video_id únicos del coach (SIMPLE)
SELECT DISTINCT
  bunny_video_id,
  video_url,
  bunny_library_id,
  'activity_media' as fuente
FROM activity_media
WHERE bunny_video_id IS NOT NULL
  AND activity_id IN (SELECT id FROM activities WHERE coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f')

UNION

SELECT DISTINCT
  bunny_video_id,
  video_url,
  bunny_library_id,
  'ejercicios_detalles' as fuente
FROM ejercicios_detalles
WHERE bunny_video_id IS NOT NULL
  AND coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'

ORDER BY bunny_video_id;

-- 1. Actividades del coach
SELECT 
  id, 
  title, 
  coach_id,
  type,
  created_at
FROM activities
WHERE coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
ORDER BY created_at DESC;

-- 2. Videos en activity_media (de las actividades del coach)
SELECT 
  am.id,
  am.activity_id,
  am.video_url,
  am.bunny_video_id,
  am.bunny_library_id,
  am.video_thumbnail_url,
  am.video_file_name,
  a.title as actividad_titulo,
  a.coach_id
FROM activity_media am
INNER JOIN activities a ON am.activity_id = a.id
WHERE a.coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
  AND am.video_url IS NOT NULL
  AND am.video_url != ''
ORDER BY am.id DESC;

-- 3. Videos en ejercicios_detalles (del coach)
SELECT 
  ed.id,
  ed.activity_id,
  ed.nombre_ejercicio,
  ed.video_url,
  ed.bunny_video_id,
  ed.bunny_library_id,
  ed.video_thumbnail_url,
  ed.video_file_name,
  ed.coach_id
FROM ejercicios_detalles ed
WHERE ed.coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
  AND ed.video_url IS NOT NULL
  AND ed.video_url != ''
ORDER BY ed.id DESC;

-- 4. Todos los bunny_video_id únicos del coach (de ambas tablas)
SELECT DISTINCT
  bunny_video_id,
  'activity_media' as fuente,
  video_url,
  bunny_library_id
FROM activity_media
WHERE bunny_video_id IS NOT NULL
  AND activity_id IN (
    SELECT id FROM activities WHERE coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
  )

UNION

SELECT DISTINCT
  bunny_video_id,
  'ejercicios_detalles' as fuente,
  video_url,
  bunny_library_id
FROM ejercicios_detalles
WHERE bunny_video_id IS NOT NULL
  AND coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'

ORDER BY bunny_video_id;

-- 5. Resumen: Cantidad de videos por fuente
SELECT 
  'activity_media' as fuente,
  COUNT(*) as total_registros,
  COUNT(DISTINCT bunny_video_id) as videos_unicos
FROM activity_media
WHERE video_url IS NOT NULL
  AND video_url != ''
  AND activity_id IN (
    SELECT id FROM activities WHERE coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
  )

UNION ALL

SELECT 
  'ejercicios_detalles' as fuente,
  COUNT(*) as total_registros,
  COUNT(DISTINCT bunny_video_id) as videos_unicos
FROM ejercicios_detalles
WHERE video_url IS NOT NULL
  AND video_url != ''
  AND coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';

-- 6. Videos sin bunny_video_id pero con video_url (necesitan extraer el ID de la URL)
SELECT 
  'activity_media' as fuente,
  id,
  activity_id,
  video_url,
  bunny_video_id,
  SUBSTRING(video_url FROM '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}') as posible_guid_en_url
FROM activity_media
WHERE video_url IS NOT NULL
  AND video_url != ''
  AND (bunny_video_id IS NULL OR bunny_video_id = '')
  AND activity_id IN (
    SELECT id FROM activities WHERE coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
  )

UNION ALL

SELECT 
  'ejercicios_detalles' as fuente,
  id,
  activity_id,
  video_url,
  bunny_video_id,
  SUBSTRING(video_url FROM '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}') as posible_guid_en_url
FROM ejercicios_detalles
WHERE video_url IS NOT NULL
  AND video_url != ''
  AND (bunny_video_id IS NULL OR bunny_video_id = '')
  AND coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';

