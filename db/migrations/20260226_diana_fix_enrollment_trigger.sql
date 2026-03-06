-- ================================================================
-- 🏛️ DIANA - REPARACIÓN MOTOR DE INSCRIPCIÓN (MODULAR SCHEMA)
-- 1. Actualización de duplicate_program_details_for_client
-- 2. Sincronización proactiva con progreso_cliente
-- ================================================================

CREATE OR REPLACE FUNCTION public.duplicate_program_details_for_client()
RETURNS TRIGGER AS $$
DECLARE
    v_activity_type TEXT;
    v_categoria TEXT;
    v_start_date DATE;
    v_dia_semana TEXT;
    v_plan_json JSONB;
    v_tabla_progreso TEXT;
BEGIN
    -- 1. Obtener información de la actividad (tipo y categoría)
    SELECT type, categoria INTO v_activity_type, v_categoria
    FROM public.activities
    WHERE id = NEW.activity_id;

    -- Fecha de inicio (usamos el día de hoy si no hay una fecha definida)
    v_start_date := COALESCE(NEW.start_date, CURRENT_DATE);

    -- 2. DETERMINAR DÍA DE LA SEMANA PARA LA PRIMERA CARGA
    -- Esto asegura que el "Today Screen" no esté vacío al inscribirse
    SELECT 
        CASE EXTRACT(DOW FROM v_start_date)
            WHEN 0 THEN 'domingo'
            WHEN 1 THEN 'lunes'
            WHEN 2 THEN 'martes'
            WHEN 3 THEN 'miercoles'
            WHEN 4 THEN 'jueves'
            WHEN 5 THEN 'viernes'
            WHEN 6 THEN 'sabado'
        END INTO v_dia_semana;

    -- 3. OBTENER PLANIFICACIÓN DESDE EL ESQUEMA MODULAR
    -- Intentamos obtener la Semana 1, Día correspondiente.
    -- La tabla unificada para planificación es planificacion_ejercicios.
    
    IF v_categoria = 'nutricion' THEN
        v_tabla_progreso := 'progreso_cliente_nutricion';
    ELSE
        v_tabla_progreso := 'progreso_cliente';
    END IF;

    SELECT 
        CASE v_dia_semana
            WHEN 'lunes' THEN lunes
            WHEN 'martes' THEN martes
            WHEN 'miercoles' THEN miercoles
            WHEN 'jueves' THEN jueves
            WHEN 'viernes' THEN viernes
            WHEN 'sabado' THEN sabado
            WHEN 'domingo' THEN domingo
        END::JSONB INTO v_plan_json
    FROM public.planificacion_ejercicios
    WHERE actividad_id = NEW.activity_id AND numero_semana = 1;

    -- 4. INICIALIZACIÓN PROACTIVA DEL PROGRESO (Sincronización Real)
    -- Si encontramos planificación para el día de inicio, creamos el registro de progreso.
    IF v_plan_json IS NOT NULL THEN
        IF v_tabla_progreso = 'progreso_cliente' THEN
            INSERT INTO public.progreso_cliente (actividad_id, cliente_id, enrollment_id, fecha, ejercicios_pendientes, ejercicios_completados)
            VALUES (NEW.activity_id, NEW.client_id, NEW.id, v_start_date, v_plan_json, '{}'::jsonb)
            ON CONFLICT DO NOTHING;
        ELSE
            INSERT INTO public.progreso_cliente_nutricion (actividad_id, cliente_id, enrollment_id, fecha, ejercicios_pendientes, ejercicios_completados)
            VALUES (NEW.activity_id, NEW.client_id, NEW.id, v_start_date, v_plan_json, '{}'::jsonb)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    -- 5. TRABAJO LEGACY (Opcional: si existen tablas antiguas, mantener compatibilidad básica)
    -- Aquí se podría añadir duplicación a tablas de detalles si se reactivan.

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-aplicar el trigger
DROP TRIGGER IF EXISTS trg_duplicate_program_details ON public.activity_enrollments;
CREATE TRIGGER trg_duplicate_program_details
AFTER INSERT ON public.activity_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.duplicate_program_details_for_client();
