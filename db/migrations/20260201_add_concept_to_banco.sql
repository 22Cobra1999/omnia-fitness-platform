-- Migración: Agregar columna concept a la tabla banco
-- Esto permite guardar un nombre descriptivo de la compra directamente en la transacción

ALTER TABLE banco
  ADD COLUMN IF NOT EXISTS concept TEXT;

COMMENT ON COLUMN banco.concept IS 'Nombre descriptivo de la actividad o producto comprado';

-- Intentar rellenar concept desde activities si activity_id existe
UPDATE banco
SET concept = activities.title
FROM activities
WHERE banco.activity_id = activities.id
  AND (banco.concept IS NULL OR banco.concept = '');
