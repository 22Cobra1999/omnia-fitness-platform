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

    -- 3. Lowercase normalization (Ensuring we stay within allowed Spanish values)
    UPDATE public.activity_enrollments
    SET status = CASE 
        WHEN status = 'active' THEN 'activa'
        WHEN status = 'pending' THEN 'pendiente'
        WHEN status = 'finished' THEN 'finalizada'
        WHEN status = 'expired' THEN 'expirada'
        WHEN status = 'completed' THEN 'finalizada'
        ELSE LOWER(status)
    END
    WHERE status IN ('active', 'pending', 'finished', 'expired', 'completed', 'ACTIVA', 'PENDIENTE', 'FINALIZADA', 'EXPIRADA');
    
END $$;
