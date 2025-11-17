-- Crear tabla de eventos del calendario para coaches y clientes
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referencias
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL,
    
    -- Información del evento
    title TEXT NOT NULL,
    description TEXT,
    
    -- Fecha y hora
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    -- Tipo de evento
    event_type TEXT CHECK (event_type IN ('consultation', 'workout', 'workshop', 'meeting', 'other')),
    
    -- Estado
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    
    -- Tipo de consulta (si aplica)
    consultation_type TEXT CHECK (consultation_type IN ('videocall', 'message', NULL)),
    
    -- Notas
    notes TEXT,
    
    -- Información de zona horaria
    timezone_offset INTEGER,
    timezone_name TEXT,
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_calendar_events_coach_id ON public.calendar_events(coach_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_client_id ON public.calendar_events(client_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON public.calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_coach_start ON public.calendar_events(coach_id, start_time);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calendar_events_updated_at_trigger
    BEFORE UPDATE ON public.calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_events_updated_at();

-- Habilitar Row Level Security
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Política: Los coaches pueden ver todos sus eventos
CREATE POLICY "Coaches can view their own events"
    ON public.calendar_events
    FOR SELECT
    USING (auth.uid() = coach_id);

-- Política: Los clientes pueden ver sus propios eventos
CREATE POLICY "Clients can view their own events"
    ON public.calendar_events
    FOR SELECT
    USING (auth.uid() = client_id);

-- Política: Los coaches pueden crear eventos
CREATE POLICY "Coaches can create events"
    ON public.calendar_events
    FOR INSERT
    WITH CHECK (auth.uid() = coach_id);

-- Política: Los coaches pueden actualizar sus eventos
CREATE POLICY "Coaches can update their own events"
    ON public.calendar_events
    FOR UPDATE
    USING (auth.uid() = coach_id);

-- Política: Los coaches pueden eliminar sus eventos
CREATE POLICY "Coaches can delete their own events"
    ON public.calendar_events
    FOR DELETE
    USING (auth.uid() = coach_id);

-- Comentarios para documentación
COMMENT ON TABLE public.calendar_events IS 'Tabla para almacenar eventos del calendario de coaches y clientes';
COMMENT ON COLUMN public.calendar_events.event_type IS 'Tipo de evento: consultation, workout, workshop, meeting, other';
COMMENT ON COLUMN public.calendar_events.status IS 'Estado del evento: scheduled, completed, cancelled, rescheduled';
COMMENT ON COLUMN public.calendar_events.consultation_type IS 'Tipo de consulta: videocall o message';


































