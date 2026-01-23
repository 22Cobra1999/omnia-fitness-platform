-- ==========================================
-- AUDIT AND FIX ENROLLMENT DATES
-- Logic:
-- 1. expiration_date = created_at + 10 days (Limit to start)
-- 2. document program_end_date = start_date + 30 days (Access window)
-- 3. workshop program_end_date = last class + 7 days
-- ==========================================

-- STEP 1: Fix Expiration Dates (Limit to start)
-- This applies to all activities as a standard rule for new/pending enrollments
UPDATE public.activity_enrollments
SET expiration_date = (created_at::date + INTERVAL '10 days')::date
WHERE expiration_date IS NULL 
   OR (expiration_date - created_at::date) > INTERVAL '10 days';

-- STEP 2: Fix Document Access Dates (Start + 30 days)
UPDATE public.activity_enrollments ae
SET program_end_date = (ae.start_date::date + INTERVAL '30 days')::date
FROM public.activities a
WHERE ae.activity_id = a.id
  AND (a.type = 'document' OR a.type = 'documento')
  AND ae.start_date IS NOT NULL;

-- STEP 3: Fix Workshop Access Dates (Last class + 7 days)
UPDATE public.activity_enrollments ae
SET program_end_date = (
    SELECT MAX((h->>'fecha')::DATE) + INTERVAL '7 days'
    FROM public.taller_detalles td,
         jsonb_array_elements(td.originales->'fechas_horarios') as h
    WHERE td.actividad_id = ae.activity_id
)
FROM public.activities a
WHERE ae.activity_id = a.id
  AND (a.type = 'workshop' OR a.type = 'taller')
  AND ae.start_date IS NOT NULL;

-- STEP 4: Fix Program Access Dates (Last session/plate + 7 days)
UPDATE public.activity_enrollments ae
SET program_end_date = COALESCE(
    (SELECT MAX(fecha) FROM public.progreso_cliente_fitness WHERE actividad_id = ae.activity_id AND cliente_id = ae.client_id),
    (SELECT MAX(fecha) FROM public.progreso_cliente_nutricion WHERE actividad_id = ae.activity_id AND cliente_id = ae.client_id)
) + INTERVAL '7 days'
FROM public.activities a
WHERE ae.activity_id = a.id
  AND (a.type = 'program' OR a.type = 'programa' OR a.type = 'fitness' OR a.type = 'nutrition')
  AND ae.start_date IS NOT NULL;

-- STEP 5: Force recalculation for specific IDs mentioned in audit
-- ID 203: Start 2025-12-22, Last plate 2026-01-24 -> End 2026-01-31
UPDATE public.activity_enrollments 
SET program_end_date = '2026-01-31' 
WHERE id = '203';
