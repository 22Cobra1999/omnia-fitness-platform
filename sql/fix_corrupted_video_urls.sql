-- ============================================
-- CORRECCIÓN: URLs de Video Corruptas en activity_media
-- Propósito: Corregir registros donde video_url apunta a una imagen
-- Fecha: 8 de Octubre, 2025
-- ============================================

-- Paso 1: Ver todos los registros con URLs corruptas
SELECT 
  id,
  activity_id,
  CASE 
    WHEN video_url LIKE '%/images/%' THEN '❌ VIDEO_URL apunta a /images/ (CORRUPTO)'
    WHEN video_url LIKE '%/videos/%' THEN '✅ VIDEO_URL correcto'
    WHEN video_url IS NULL THEN 'Sin video'
    ELSE '⚠️ Revisar'
  END as "Estado Video",
  image_url,
  video_url
FROM activity_media
ORDER BY activity_id;

-- ============================================
-- PASO 2: CORRECCIÓN AUTOMÁTICA
-- Eliminar video_url si apunta a una imagen
-- ============================================

UPDATE activity_media
SET video_url = NULL
WHERE 
  video_url LIKE '%/images/%'  -- Si video_url contiene '/images/', es una imagen incorrecta
  AND video_url IS NOT NULL;

-- Verificar los cambios
SELECT 
  id,
  activity_id,
  CASE 
    WHEN video_url LIKE '%/images/%' THEN '❌ CORRUPTO'
    WHEN video_url LIKE '%/videos/%' THEN '✅ CORRECTO'
    WHEN video_url IS NULL THEN '✅ Sin video (limpiado)'
    ELSE '⚠️ Revisar'
  END as "Estado Video",
  image_url,
  video_url
FROM activity_media
ORDER BY activity_id;

-- ============================================
-- RESULTADO ESPERADO:
-- 
-- Después de ejecutar este script:
-- 
-- 1. activity_id 48: video_url = NULL (ya que apuntaba a una imagen)
-- 2. activity_id 59: video_url = .../videos/Nike.mp4 (correcto)
-- 3. activity_id 78: video_url = .../videos/Ronaldinho.mov (correcto)
-- 
-- El producto 48 quedará sin video, y podrás seleccionar
-- un video correcto cuando lo edites nuevamente.
-- ============================================

-- ============================================
-- ALTERNATIVA: CORRECCIÓN MANUAL
-- Si prefieres corregir manualmente el producto 48:
-- ============================================

-- Ver las actividades del coach
-- SELECT id, title, coach_id FROM activities WHERE coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';

-- Actualizar producto 48 con un video válido (ej. el de Nike del producto 59)
-- UPDATE activity_media
-- SET video_url = 'https://mgrfswrsvrzwtgilssad.supabase.co/storage/v1/object/public/product-media/coaches/b16c4f8c-f47b-4df0-ad2b-13dcbd76263f/videos/1759936073052_Nike_-_Running_Isn_t_Just_Running___Spec_Ad.mp4'
-- WHERE activity_id = 48;

