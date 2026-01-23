-- Create new normalized table for workshop topics progress
CREATE TABLE IF NOT EXISTS public.taller_progreso_temas (
    id BIGSERIAL PRIMARY KEY,
    ejecucion_id BIGINT NOT NULL REFERENCES public.ejecuciones_taller(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actividad_id BIGINT NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    tema_id BIGINT NOT NULL,
    tema_nombre TEXT,
    descripcion TEXT, -- Added description column as requested
    estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'reservado', 'completado', 'finalizado'
    fecha_seleccionada DATE,
    horario_seleccionado JSONB, -- Stores {start, end}
    confirmo_asistencia BOOLEAN DEFAULT FALSE,
    asistio BOOLEAN DEFAULT FALSE,
    snapshot_originales JSONB, -- Store the frozen schedule snapshot here
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ejecucion_id, tema_id)
);

-- Enable RLS
ALTER TABLE public.taller_progreso_temas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own topic progress" ON public.taller_progreso_temas
    FOR SELECT USING (auth.uid() = cliente_id);

CREATE POLICY "Users can update their own topic progress" ON public.taller_progreso_temas
    FOR UPDATE USING (auth.uid() = cliente_id);

CREATE INDEX idx_taller_progreso_ejecucion ON public.taller_progreso_temas(ejecucion_id);
CREATE INDEX idx_taller_progreso_cliente ON public.taller_progreso_temas(cliente_id);
CREATE INDEX idx_taller_progreso_tema ON public.taller_progreso_temas(tema_id);

-- Migration Function to move data from JSON to new table
CREATE OR REPLACE FUNCTION migrate_ejecuciones_json_to_rows() RETURNS VOID AS $$
DECLARE
    r RECORD;
    tema JSONB;
BEGIN
    FOR r IN SELECT * FROM public.ejecuciones_taller LOOP
        -- Process 'temas_cubiertos'
        IF r.temas_cubiertos IS NOT NULL AND jsonb_array_length(r.temas_cubiertos) > 0 THEN
            FOR tema IN SELECT * FROM jsonb_array_elements(r.temas_cubiertos) LOOP
                INSERT INTO public.taller_progreso_temas (
                    ejecucion_id, cliente_id, actividad_id, tema_id, tema_nombre, 
                    fecha_seleccionada, horario_seleccionado, confirmo_asistencia, asistio, estado
                ) VALUES (
                    r.id, r.cliente_id, r.actividad_id, 
                    (tema->>'tema_id')::BIGINT, 
                    tema->>'tema_nombre',
                    (tema->>'fecha_seleccionada')::DATE,
                    tema->'horario_seleccionado',
                    (tema->>'confirmo_asistencia')::BOOLEAN,
                    (tema->>'asistio')::BOOLEAN,
                    CASE WHEN (tema->>'asistio')::BOOLEAN THEN 'completado' ELSE 'reservado' END
                ) ON CONFLICT DO NOTHING;
            END LOOP;
        END IF;

        -- Process 'temas_pendientes'
        IF r.temas_pendientes IS NOT NULL AND jsonb_array_length(r.temas_pendientes) > 0 THEN
            FOR tema IN SELECT * FROM jsonb_array_elements(r.temas_pendientes) LOOP
                INSERT INTO public.taller_progreso_temas (
                    ejecucion_id, cliente_id, actividad_id, tema_id, tema_nombre, 
                    snapshot_originales, estado
                ) VALUES (
                    r.id, r.cliente_id, r.actividad_id, 
                    (tema->>'tema_id')::BIGINT, 
                    tema->>'tema_nombre',
                    tema->'snapshot_originales',
                    'pendiente'
                ) ON CONFLICT DO NOTHING;
            END LOOP;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute migration
-- SELECT migrate_ejecuciones_json_to_rows();
