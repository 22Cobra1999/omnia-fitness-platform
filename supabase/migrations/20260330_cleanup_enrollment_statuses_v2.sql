-- Actualización de estados de enrollments basados en fechas de expiración y fin de programa
-- Ejecutado el 2026-03-30

BEGIN;

-- 1. Actividades que pasaron su fecha de expiración máxima (Compra)
-- Si la fecha de expiración ya pasó, el estado debe ser 'expirada'.
UPDATE public.activity_enrollments
SET status = 'expirada',
    updated_at = NOW()
WHERE status IN ('activa', 'pendiente')
  AND expiration_date < CURRENT_DATE;

-- 2. Actividades que ya terminaron su período de programa (End Date)
-- Si el programa ya terminó y no fue marcado como expirado antes, es 'finalizada'.
UPDATE public.activity_enrollments
SET status = 'finalizada',
    updated_at = NOW()
WHERE status = 'activa'
  AND program_end_date < CURRENT_DATE;

COMMIT;

-- Verificación de los IDs mencionados por el usuario:
-- 191: Era 'pendiente' con exp '2026-01-19' -> Debería ser 'expirada'
-- 203: Era 'activa' con exp '2026-02-13' -> Debería ser 'expirada'
-- 206: Era 'activa' con end '2026-02-21' -> Debería ser 'finalizada'
-- 207: Era 'activa' con end '2026-02-25' -> Debería ser 'finalizada'
