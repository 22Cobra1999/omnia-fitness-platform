-- Quitar la columna progress que agregamos innecesariamente
ALTER TABLE activity_enrollments 
DROP COLUMN IF EXISTS progress;
