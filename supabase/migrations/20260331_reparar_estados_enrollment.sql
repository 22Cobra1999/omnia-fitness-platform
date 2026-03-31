-- MIGRACIÓN: Reparar estados de enrollment basados en fechas
-- Evita el error de 'check constraint' usando solo los valores permitidos:
-- ('activa', 'pendiente', 'finalizada', 'expirada')

BEGIN;

-- 1. Marcar como 'expirada' si la fecha de expiración ya pasó
-- Estas son actividades que nunca se iniciaron o se compraron y vencieron.
UPDATE public.activity_enrollments
SET status = 'expirada',
    updated_at = NOW()
WHERE status IN ('activa', 'pendiente')
  AND expiration_date < CURRENT_DATE;

-- 2. Marcar como 'finalizada' si el programa ya terminó su duración
-- Estas son actividades que estaban en curso pero ya pasaron su End Date.
UPDATE public.activity_enrollments
SET status = 'finalizada',
    updated_at = NOW()
WHERE status = 'activa'
  AND program_end_date < CURRENT_DATE;

COMMIT;

-- Verificación (informativa)
-- SELECT id, activity_id, status, expiration_date, program_end_date 
-- FROM public.activity_enrollments 
-- WHERE client_id = '...' 
-- ORDER BY updated_at DESC;
