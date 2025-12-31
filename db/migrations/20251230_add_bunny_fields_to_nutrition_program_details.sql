ALTER TABLE nutrition_program_details
  ADD COLUMN IF NOT EXISTS bunny_video_id TEXT;

ALTER TABLE nutrition_program_details
  ADD COLUMN IF NOT EXISTS bunny_library_id INTEGER;

ALTER TABLE nutrition_program_details
  ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;
