-- Función para insertar o actualizar activity_media
CREATE OR REPLACE FUNCTION upsert_activity_media(
  p_activity_id INTEGER,
  p_image_url TEXT DEFAULT NULL,
  p_video_url TEXT DEFAULT NULL,
  p_vimeo_id TEXT DEFAULT NULL,
  p_pdf_url TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Intentar actualizar primero
  UPDATE activity_media 
  SET 
    image_url = COALESCE(p_image_url, image_url),
    video_url = COALESCE(p_video_url, video_url),
    vimeo_id = COALESCE(p_vimeo_id, vimeo_id),
    pdf_url = COALESCE(p_pdf_url, pdf_url)
  WHERE activity_id = p_activity_id;
  
  -- Si no se actualizó ninguna fila, insertar nueva
  IF NOT FOUND THEN
    INSERT INTO activity_media (activity_id, image_url, video_url, vimeo_id, pdf_url)
    VALUES (p_activity_id, p_image_url, p_video_url, p_vimeo_id, p_pdf_url);
  END IF;
END;
$$;

-- Política RLS para activity_media (permitir acceso a coaches)
CREATE POLICY "Coaches can manage activity_media" ON activity_media
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM activities a
    JOIN user_profiles up ON a.coach_id = up.id
    WHERE a.id = activity_media.activity_id
    AND up.role = 'coach'
  )
);

-- Habilitar RLS en activity_media
ALTER TABLE activity_media ENABLE ROW LEVEL SECURITY;


