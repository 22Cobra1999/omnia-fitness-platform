-- Agregar columna file_name a storage_usage para guardar el nombre del archivo
-- Útil para la vista de uso total

-- 1. Agregar columna file_name (nullable, puede ser NULL si no hay archivo específico)
ALTER TABLE storage_usage 
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- 2. Comentario para documentación
COMMENT ON COLUMN storage_usage.file_name IS 'Nombre del archivo representativo para este concepto. Para uso en la vista de uso total.';

-- 3. Migrar datos existentes: Actualizar file_name para videos
-- Usa bunny_video_id o extrae nombre de URL (un solo nombre por fila, no concatenado)
UPDATE storage_usage su
SET file_name = COALESCE(
  (
    -- Intentar obtener bunny_video_id de ejercicios_detalles (tomar solo el primero)
    SELECT file_name
    FROM (
      SELECT 
        CASE 
          WHEN ed.nombre_ejercicio IS NOT NULL AND ed.nombre_ejercicio != '' THEN
            ed.nombre_ejercicio || '.mp4'
          WHEN ed.bunny_video_id IS NOT NULL THEN
            'video_' || substring(ed.bunny_video_id from 1 for 12) || '.mp4'
          WHEN ed.video_url IS NOT NULL AND ed.video_url != '' THEN
            COALESCE(
              substring(ed.video_url from '/([^/?#]+\.(mp4|mov|avi|webm))$'),
              substring(ed.video_url from '/([^/?#]+)$'),
              'video_' || ed.id::text || '.mp4'
            )
          ELSE NULL
        END as file_name
      FROM ejercicios_detalles ed
      INNER JOIN activities a ON a.id = ed.activity_id
      WHERE a.coach_id = su.coach_id
        AND ed.video_url IS NOT NULL 
        AND ed.video_url != ''
      ORDER BY ed.id
      LIMIT 1
    ) sub
    WHERE file_name IS NOT NULL
  ),
  (
    -- Intentar obtener bunny_video_id de activity_media (tomar solo el primero)
    SELECT file_name
    FROM (
      SELECT 
        CASE 
          WHEN am.bunny_video_id IS NOT NULL THEN
            'video_' || substring(am.bunny_video_id from 1 for 12) || '.mp4'
          WHEN am.video_url IS NOT NULL AND am.video_url != '' THEN
            COALESCE(
              substring(am.video_url from '/([^/?#]+\.(mp4|mov|avi|webm))$'),
              substring(am.video_url from '/([^/?#]+)$'),
              'video_' || am.id::text || '.mp4'
            )
          ELSE NULL
        END as file_name
      FROM activity_media am
      INNER JOIN activities a ON a.id = am.activity_id
      WHERE a.coach_id = su.coach_id
        AND am.video_url IS NOT NULL 
        AND am.video_url != ''
      ORDER BY am.id
      LIMIT 1
    ) sub
    WHERE file_name IS NOT NULL
  ),
  'video.mp4'
)
WHERE su.concept = 'video' 
  AND su.gb_usage > 0;

-- 4. Migrar datos existentes: Actualizar file_name para imágenes
-- Extrae nombre de archivo de las URLs de imágenes (un solo nombre por fila)
UPDATE storage_usage su
SET file_name = (
  SELECT file_name
  FROM (
    SELECT 
      COALESCE(
        substring(am.image_url from '/([^/?#]+)$'),
        substring(am.image_url from '/([^/?#]+)\?'),
        'imagen_' || am.id::text || '.jpg'
      ) as file_name
    FROM activity_media am
    INNER JOIN activities a ON a.id = am.activity_id
    WHERE a.coach_id = su.coach_id
      AND am.image_url IS NOT NULL 
      AND am.image_url != ''
    ORDER BY am.id
    LIMIT 1
  ) sub
  WHERE file_name IS NOT NULL
)
WHERE su.concept = 'image' 
  AND su.gb_usage > 0;

-- 5. Migrar datos existentes: Actualizar file_name para PDFs
-- Extrae nombre de archivo de las URLs de PDFs (un solo nombre por fila)
UPDATE storage_usage su
SET file_name = (
  SELECT file_name
  FROM (
    SELECT 
      COALESCE(
        substring(am.pdf_url from '/([^/?#]+)$'),
        substring(am.pdf_url from '/([^/?#]+)\?'),
        'pdf_' || am.id::text || '.pdf'
      ) as file_name
    FROM activity_media am
    INNER JOIN activities a ON a.id = am.activity_id
    WHERE a.coach_id = su.coach_id
      AND am.pdf_url IS NOT NULL 
      AND am.pdf_url != ''
    ORDER BY am.id
    LIMIT 1
  ) sub
  WHERE file_name IS NOT NULL
)
WHERE su.concept = 'pdf' 
  AND su.gb_usage > 0;

-- 6. Para filas que no se pudieron actualizar (sin datos), usar un valor por defecto
UPDATE storage_usage
SET file_name = 
  CASE concept
    WHEN 'video' THEN 'Videos'
    WHEN 'image' THEN 'Imágenes'
    WHEN 'pdf' THEN 'PDFs'
    ELSE 'Archivos'
  END
WHERE file_name IS NULL 
  AND gb_usage > 0;

