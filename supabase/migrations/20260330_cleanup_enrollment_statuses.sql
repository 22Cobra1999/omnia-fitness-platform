-- ==============================================================================
-- MIGRATION: ENROLLMENT STATUS CLEANUP (V4.8)
-- Automatically fixes statuses that are out of sync with their dates.
-- ==============================================================================

DO $$
BEGIN
    -- 1. Mark as EXPIRADA if the access expiration date has passed
    -- (And they weren't already marked as finished)
    UPDATE public.activity_enrollments
    SET status = 'expirada',
        updated_at = NOW()
    WHERE status IN ('activa', 'active', 'pendiente', 'pending')
      AND expiration_date < CURRENT_DATE;

    -- 2. Mark as FINALIZADA if the program end date has passed 
    -- (And they are still marked as active)
    UPDATE public.activity_enrollments
    SET status = 'finalizada',
        updated_at = NOW()
    WHERE status IN ('activa', 'active')
      AND program_end_date < CURRENT_DATE;

    -- 3. Unified lowercase normalization (Optional but recommended for consistency)
    UPDATE public.activity_enrollments
    SET status = CASE 
        WHEN status = 'activa' THEN 'active'
        WHEN status = 'pendiente' THEN 'pending'
        WHEN status = 'finalizada' THEN 'finished'
        WHEN status = 'expirada' THEN 'expired'
        ELSE status
    END
    WHERE status IN ('activa', 'pendiente', 'finalizada', 'expirada');
    
END $$;
