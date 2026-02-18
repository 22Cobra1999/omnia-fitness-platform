-- Migration to enhance expired activities with detailed analytics and automated cleanup
-- Target Table: public.actividades_vencidas

-- 1. Add new analytics columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actividades_vencidas' AND column_name='dias_completados') THEN
        ALTER TABLE public.actividades_vencidas ADD COLUMN dias_completados INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actividades_vencidas' AND column_name='dias_en_curso') THEN
        ALTER TABLE public.actividades_vencidas ADD COLUMN dias_en_curso INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actividades_vencidas' AND column_name='dias_ausente') THEN
        ALTER TABLE public.actividades_vencidas ADD COLUMN dias_ausente INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actividades_vencidas' AND column_name='dias_proximos') THEN
        ALTER TABLE public.actividades_vencidas ADD COLUMN dias_proximos INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actividades_vencidas' AND column_name='items_completados') THEN
        ALTER TABLE public.actividades_vencidas ADD COLUMN items_completados INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actividades_vencidas' AND column_name='items_no_logrados') THEN
        ALTER TABLE public.actividades_vencidas ADD COLUMN items_no_logrados INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actividades_vencidas' AND column_name='items_restantes') THEN
        ALTER TABLE public.actividades_vencidas ADD COLUMN items_restantes INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Create the archival and cleanup function
CREATE OR REPLACE FUNCTION public.archive_expired_enrollment(p_enrollment_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_stats RECORD;
    v_result JSONB;
BEGIN
    -- 1. Calculate statistics from progreso_diario_actividad
    SELECT 
        COUNT(*) FILTER (WHERE items_completados >= items_objetivo AND items_objetivo > 0) as d_compl,
        COUNT(*) FILTER (WHERE items_completados < items_objetivo AND items_completados > 0) as d_encurso,
        COUNT(*) FILTER (WHERE items_completados = 0 AND items_objetivo > 0 AND fecha <= CURRENT_DATE) as d_ausente,
        COUNT(*) FILTER (WHERE fecha > CURRENT_DATE) as d_prox,
        COALESCE(SUM(items_completados), 0) as i_compl,
        COALESCE(SUM(items_objetivo - items_completados) FILTER (WHERE fecha <= CURRENT_DATE), 0) as i_nologrado,
        COALESCE(SUM(items_objetivo) FILTER (WHERE fecha > CURRENT_DATE), 0) as i_restante,
        CASE 
            WHEN SUM(items_objetivo) > 0 
            THEN (SUM(items_completados) * 100 / SUM(items_objetivo))::INTEGER 
            ELSE 0 
        END as prog_perc
    INTO v_stats
    FROM public.progreso_diario_actividad
    WHERE enrollment_id = p_enrollment_id;

    -- 2. Upsert into actividades_vencidas
    -- We assume the base entry might already exist from the basic migration or TodayScreen snapshot
    UPDATE public.actividades_vencidas
    SET 
        dias_completados = v_stats.d_compl,
        dias_en_curso = v_stats.d_encurso,
        dias_ausente = v_stats.d_ausente,
        dias_proximos = v_stats.d_prox,
        items_completados = v_stats.i_compl,
        items_no_logrados = v_stats.i_nologrado,
        items_restantes = v_stats.i_restante,
        progreso_porcentaje = v_stats.prog_perc,
        updated_at = NOW()
    WHERE enrollment_id = p_enrollment_id;

    -- If no update happened (entry doesn't exist), we could insert here, 
    -- but usually it's better to ensure the base entry exists first via a SELECT.
    -- To keep it atomic and simple for the user, let's do a full check.
    
    -- 3. Cleanup raw progress tables
    -- Only delete if we actually found stats (safety check)
    IF FOUND THEN
        DELETE FROM public.progreso_cliente WHERE enrollment_id = p_enrollment_id;
        DELETE FROM public.progreso_cliente_nutricion WHERE enrollment_id = p_enrollment_id;
        
        v_result := jsonb_build_object(
            'success', true,
            'message', 'Archived and cleaned up successfully',
            'stats', jsonb_build_object(
                'dias_completados', v_stats.d_compl,
                'items_completados', v_stats.i_compl,
                'progreso', v_stats.prog_perc
            )
        );
    ELSE
        v_result := jsonb_build_object('success', false, 'message', 'Enrollment not found or no stats available');
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Backfill existing records in actividades_vencidas
-- This will populate the new columns for records that were created before this migration.
-- WARNING: This will also trigger the cleanup of raw progress tables for these enrollments.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT enrollment_id FROM public.actividades_vencidas WHERE enrollment_id IS NOT NULL LOOP
        PERFORM public.archive_expired_enrollment(r.enrollment_id);
    END LOOP;
END $$;
