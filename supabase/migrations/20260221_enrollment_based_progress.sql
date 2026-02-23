-- MIGRACIÓN IMPORTANTE: Flujo de Progreso por Enrollment ID
-- Archivo: 20260221_enrollment_based_progress.sql

-- 1. Agregar columna enrollment_id a las tablas de progreso
ALTER TABLE public.progreso_diario_actividad 
ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES public.activity_enrollments(id) ON DELETE CASCADE;

ALTER TABLE public.progreso_cliente 
ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES public.activity_enrollments(id) ON DELETE CASCADE;

ALTER TABLE public.progreso_cliente_nutricion 
ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES public.activity_enrollments(id) ON DELETE CASCADE;

-- 2. Crear índices para optimizar búsquedas basadas en las compras
CREATE INDEX IF NOT EXISTS idx_progreso_diario_enrollment ON public.progreso_diario_actividad(enrollment_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_progreso_cliente_enrollment ON public.progreso_cliente(enrollment_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_progreso_nutricion_enrollment ON public.progreso_cliente_nutricion(enrollment_id) TABLESPACE pg_default;

-- 3. Modificar constraints UNIQUE en progreso_diario_actividad
-- Borramos el constraint viejo que mezclaba recompras (basado en actividad_id y cliente)
ALTER TABLE public.progreso_diario_actividad
DROP CONSTRAINT IF EXISTS progreso_diario_actividad_cliente_id_fecha_actividad_id_key;

-- Agregamos el constraint nuevo (basado en la compra específica de ese enrollment)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'progreso_diario_actividad_enrollment_fecha_key'
    ) THEN
        ALTER TABLE public.progreso_diario_actividad 
        ADD CONSTRAINT progreso_diario_actividad_enrollment_fecha_key UNIQUE (enrollment_id, fecha);
    END IF;
END $$;

-- 4. Actualizar el trigger de progreso diario (update_daily_progress_from_program)
CREATE OR REPLACE FUNCTION update_daily_progress_from_program()
RETURNS TRIGGER AS $$
DECLARE
    v_total_items INTEGER;
    v_completed_items INTEGER;
    v_kcal NUMERIC := 0;
    v_protein NUMERIC := 0;
    v_carbs NUMERIC := 0;
    v_fat NUMERIC := 0;
    v_mins INTEGER := 0;
    v_area TEXT;
BEGIN
    -- Determine Area and basic counts
    IF TG_TABLE_NAME = 'progreso_cliente_nutricion' THEN
        v_area := 'nutricion';
        
        -- Count items (Plates) - Robust check for array/object
        v_completed_items := CASE 
            WHEN jsonb_typeof(NEW.ejercicios_completados->'ejercicios') = 'array' THEN jsonb_array_length(NEW.ejercicios_completados->'ejercicios')
            WHEN jsonb_typeof(NEW.ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_completados))
            ELSE 0 
        END;
        
        -- Total items for THIS DAY = Completed + Pending
        v_total_items := v_completed_items + CASE 
            WHEN jsonb_typeof(NEW.ejercicios_pendientes->'ejercicios') = 'array' THEN jsonb_array_length(NEW.ejercicios_pendientes->'ejercicios')
            WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_pendientes))
            ELSE 0 
        END;
        
        -- Macros calculation
        IF jsonb_typeof(NEW.macros) = 'object' THEN
            SELECT 
                COALESCE(SUM(COALESCE((value->>'proteinas')::numeric, 0) * 4 + COALESCE((value->>'carbohidratos')::numeric, 0) * 4 + COALESCE((value->>'grasas')::numeric, 0) * 9), 0),
                COALESCE(SUM(COALESCE((value->>'proteinas')::numeric, 0)), 0),
                COALESCE(SUM(COALESCE((value->>'carbohidratos')::numeric, 0)), 0),
                COALESCE(SUM(COALESCE((value->>'grasas')::numeric, 0)), 0)
            INTO v_kcal, v_protein, v_carbs, v_fat
            FROM jsonb_each(NEW.macros);
        END IF;
          
    ELSE
        v_area := 'fitness';
        
        -- Count items (Exercises)
        v_completed_items := CASE WHEN jsonb_typeof(NEW.ejercicios_completados) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_completados)) ELSE 0 END;
        v_total_items := v_completed_items + CASE WHEN jsonb_typeof(NEW.ejercicios_pendientes) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(NEW.ejercicios_pendientes)) ELSE 0 END;
        
        -- Calories and Minutes
        IF jsonb_typeof(NEW.calorias_json) = 'object' THEN
            SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_kcal FROM jsonb_each_text(NEW.calorias_json);
        END IF;
        IF jsonb_typeof(NEW.minutos_json) = 'object' THEN
            SELECT COALESCE(SUM((value::text)::numeric), 0) INTO v_mins FROM jsonb_each_text(NEW.minutos_json);
        END IF;
          
    END IF;

    -- Upsert into progreso_diario_actividad 
    -- IMPORTANTE: Ahora el constraint es por (enrollment_id, fecha)
    BEGIN
        INSERT INTO public.progreso_diario_actividad (
            cliente_id, fecha, actividad_id, enrollment_id, tipo, area,
            items_objetivo, items_completados, 
            calorias, proteinas, carbohidratos, grasas, minutos,
            recalculado_en
        ) VALUES (
            NEW.cliente_id, NEW.fecha, NEW.actividad_id, NEW.enrollment_id, 'programa', v_area,
            v_total_items, v_completed_items,
            v_kcal, v_protein, v_carbs, v_fat, v_mins,
            NOW()
        );
    EXCEPTION WHEN unique_violation THEN
        UPDATE public.progreso_diario_actividad
        SET items_objetivo = v_total_items,
            items_completados = v_completed_items,
            calorias = v_kcal,
            proteinas = v_protein,
            carbohidratos = v_carbs,
            grasas = v_fat,
            minutos = v_mins,
            recalculado_en = NOW()
        -- Usar enrollment_id si existe, caso contrario fallback al viejo (cliente + actividad)
        WHERE (NEW.enrollment_id IS NOT NULL AND enrollment_id = NEW.enrollment_id AND fecha = NEW.fecha)
           OR (NEW.enrollment_id IS NULL AND cliente_id = NEW.cliente_id AND fecha = NEW.fecha AND actividad_id = NEW.actividad_id);
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Actualizar la función duplicate_program_details_on_enrollment (Manual RPC)
-- Esta función se encarga de "fotocopiar" el plan maestro a la tabla de progreso del cliente.

CREATE OR REPLACE FUNCTION public.duplicate_program_details_on_enrollment(
    p_activity_id INT,
    p_client_id UUID,
    p_enrollment_id UUID,
    p_program_type TEXT
)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF p_program_type = 'fitness_program' THEN
        -- Insert into progreso_cliente
        INSERT INTO public.progreso_cliente (
            actividad_id,
            cliente_id,
            enrollment_id,
            fecha,
            semana,
            dia,
            dia_indice,
            completado,
            nombre_actividad,
            descripcion,
            calorias_json,
            minutos_json,
            ejercicios_completados,
            ejercicios_pendientes,
            recalculado_en
        )
        SELECT 
            pd.actividad_id,
            p_client_id,
            p_enrollment_id,
            CURRENT_DATE + ((pd.semana - 1) * 7 + pd.dia - 1) * INTERVAL '1 day', -- Calculate future date based on week/day
            pd.semana,
            pd.dia,
            (pd.semana - 1) * 7 + pd.dia,
            false,
            a.title,
            a.description,
            '{}'::jsonb,
            '{}'::jsonb,
            '{"ejercicios": []}'::jsonb,
            (
                SELECT jsonb_build_object('ejercicios', jsonb_agg(ed.ejercicio))
                FROM ejercicios_detalles ed
                WHERE ed.periodo_id = pd.id
            ),
            NOW()
        FROM periodos pd
        JOIN activities a ON a.id = pd.actividad_id
        WHERE pd.actividad_id = p_activity_id;

    ELSIF p_program_type = 'nutrition_program' THEN
        -- Insert into progreso_cliente_nutricion
        INSERT INTO public.progreso_cliente_nutricion (
            actividad_id,
            cliente_id,
            enrollment_id,
            fecha,
            semana,
            dia,
            dia_indice,
            completado,
            ejercicios_completados,
            ejercicios_pendientes,
            macros,
            recalculado_en
        )
        SELECT 
            pd.actividad_id,
            p_client_id,
            p_enrollment_id,
            CURRENT_DATE + ((pd.semana - 1) * 7 + pd.dia - 1) * INTERVAL '1 day',
            pd.semana,
            pd.dia,
            (pd.semana - 1) * 7 + pd.dia,
            false,
            '{"ejercicios": []}'::jsonb,
            (
                SELECT jsonb_build_object('ejercicios', jsonb_agg(nd.comida))
                FROM nutrition_program_details nd
                WHERE nd.periodo_id = pd.id
            ),
            '{}'::jsonb,
            NOW()
        FROM periodos pd
        WHERE pd.actividad_id = p_activity_id;
    END IF;
END;
$function$;

-- NO VUELVAS A CORRER EL RESET DE TRIGGERS AQUI.


-- Not needed to drop and recreate the triggers themselves as they just call the function,
-- but doing it for absolute safety:
DROP TRIGGER IF EXISTS trigger_update_daily_progress_fitness ON public.progreso_cliente;
CREATE TRIGGER trigger_update_daily_progress_fitness
    AFTER INSERT OR UPDATE ON public.progreso_cliente
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_progress_from_program();

DROP TRIGGER IF EXISTS trigger_update_daily_progress_nutrition ON public.progreso_cliente_nutricion;
CREATE TRIGGER trigger_update_daily_progress_nutrition
    AFTER INSERT OR UPDATE ON public.progreso_cliente_nutricion
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_progress_from_program();
