-- Agregar columnas para PDF en calendar_events

ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_file_name TEXT;

COMMENT ON COLUMN calendar_events.pdf_url IS 'URL del PDF adjunto al evento';
COMMENT ON COLUMN calendar_events.pdf_file_name IS 'Nombre del archivo PDF adjunto';
