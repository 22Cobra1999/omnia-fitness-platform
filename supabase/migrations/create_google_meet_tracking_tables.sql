-- ================================================================
-- TABLAS PARA INTEGRACIÓN GOOGLE MEET CON TRACKING DE ASISTENCIA
-- ================================================================

-- ================================================================
-- 1. TABLA: google_meet_links (con tracking completo)
-- ================================================================

CREATE TABLE IF NOT EXISTS google_meet_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  google_event_id TEXT UNIQUE,
  meet_link TEXT NOT NULL,
  meet_code TEXT,
  
  -- Control de asistencia y duración
  coach_joined_at TIMESTAMP WITH TIME ZONE,
  client_joined_at TIMESTAMP WITH TIME ZONE,
  meeting_started_at TIMESTAMP WITH TIME ZONE,
  meeting_ended_at TIMESTAMP WITH TIME ZONE,
  actual_duration_minutes INTEGER,
  
  -- Estados de asistencia
  coach_attendance_status TEXT CHECK (coach_attendance_status IN ('pending', 'present', 'absent', 'late')) DEFAULT 'pending',
  client_attendance_status TEXT CHECK (client_attendance_status IN ('pending', 'present', 'absent', 'late')) DEFAULT 'pending',
  
  -- Notas y observaciones
  coach_notes TEXT,
  client_notes TEXT,
  meeting_quality_rating INTEGER CHECK (meeting_quality_rating >= 1 AND meeting_quality_rating <= 5),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 2. TABLA: google_oauth_tokens (para autenticación)
-- ================================================================

CREATE TABLE IF NOT EXISTS google_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un coach solo puede tener un token activo
  UNIQUE(coach_id)
);

-- ================================================================
-- 3. TABLA: meeting_attendance_logs (logs detallados)
-- ================================================================

CREATE TABLE IF NOT EXISTS meeting_attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meet_link_id UUID REFERENCES google_meet_links(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  participant_type TEXT CHECK (participant_type IN ('coach', 'client')) NOT NULL,
  
  -- Timestamps detallados
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  total_time_minutes INTEGER,
  
  -- Métricas de participación (estimadas)
  microphone_enabled_time_minutes INTEGER DEFAULT 0,
  camera_enabled_time_minutes INTEGER DEFAULT 0,
  screen_shared_time_minutes INTEGER DEFAULT 0,
  
  -- Estado de conexión
  connection_quality TEXT CHECK (connection_quality IN ('excellent', 'good', 'fair', 'poor')),
  disconnections_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 4. MODIFICAR: calendar_events (agregar campos de tracking)
-- ================================================================

-- Verificar si los campos ya existen antes de agregarlos
DO $$
BEGIN
    -- Campos para Google Meet
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'google_event_id') THEN
        ALTER TABLE calendar_events ADD COLUMN google_event_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'meet_link') THEN
        ALTER TABLE calendar_events ADD COLUMN meet_link TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'meet_code') THEN
        ALTER TABLE calendar_events ADD COLUMN meet_code TEXT;
    END IF;
    
    -- Campos para tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'attendance_tracked') THEN
        ALTER TABLE calendar_events ADD COLUMN attendance_tracked BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'duration_tracked') THEN
        ALTER TABLE calendar_events ADD COLUMN duration_tracked BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- ================================================================
-- 5. ÍNDICES PARA RENDIMIENTO
-- ================================================================

-- Índices para google_meet_links
CREATE INDEX IF NOT EXISTS idx_google_meet_links_calendar_event_id ON google_meet_links(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_google_meet_links_google_event_id ON google_meet_links(google_event_id);
CREATE INDEX IF NOT EXISTS idx_google_meet_links_meeting_started_at ON google_meet_links(meeting_started_at);

-- Índices para google_oauth_tokens
CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_coach_id ON google_oauth_tokens(coach_id);
CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_expires_at ON google_oauth_tokens(expires_at);

-- Índices para meeting_attendance_logs
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_logs_meet_link_id ON meeting_attendance_logs(meet_link_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_logs_participant_id ON meeting_attendance_logs(participant_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_logs_joined_at ON meeting_attendance_logs(joined_at);

-- Índices para calendar_events
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_event_id ON calendar_events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_attendance_tracked ON calendar_events(attendance_tracked);

-- ================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Habilitar RLS
ALTER TABLE google_meet_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendance_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para google_meet_links
DROP POLICY IF EXISTS "Coaches can view their own meet links" ON google_meet_links;
CREATE POLICY "Coaches can view their own meet links" ON google_meet_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM calendar_events ce 
      WHERE ce.id = google_meet_links.calendar_event_id 
      AND ce.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coaches can update their own meet links" ON google_meet_links;
CREATE POLICY "Coaches can update their own meet links" ON google_meet_links
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM calendar_events ce 
      WHERE ce.id = google_meet_links.calendar_event_id 
      AND ce.coach_id = auth.uid()
    )
  );

-- Políticas para google_oauth_tokens
DROP POLICY IF EXISTS "Coaches can manage their own tokens" ON google_oauth_tokens;
CREATE POLICY "Coaches can manage their own tokens" ON google_oauth_tokens
  FOR ALL USING (coach_id = auth.uid());

-- Políticas para meeting_attendance_logs
DROP POLICY IF EXISTS "Participants can view their own logs" ON meeting_attendance_logs;
CREATE POLICY "Participants can view their own logs" ON meeting_attendance_logs
  FOR SELECT USING (participant_id = auth.uid());

-- ================================================================
-- 7. FUNCIONES AUXILIARES
-- ================================================================

-- Función para calcular duración automáticamente
CREATE OR REPLACE FUNCTION calculate_meeting_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Si tenemos ambos timestamps, calcular duración
  IF NEW.meeting_started_at IS NOT NULL AND NEW.meeting_ended_at IS NOT NULL THEN
    NEW.actual_duration_minutes := EXTRACT(EPOCH FROM (NEW.meeting_ended_at - NEW.meeting_started_at)) / 60;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular duración automáticamente
DROP TRIGGER IF EXISTS trigger_calculate_meeting_duration ON google_meet_links;
CREATE TRIGGER trigger_calculate_meeting_duration
  BEFORE UPDATE ON google_meet_links
  FOR EACH ROW
  EXECUTE FUNCTION calculate_meeting_duration();

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS trigger_update_google_meet_links_updated_at ON google_meet_links;
CREATE TRIGGER trigger_update_google_meet_links_updated_at
  BEFORE UPDATE ON google_meet_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_google_oauth_tokens_updated_at ON google_oauth_tokens;
CREATE TRIGGER trigger_update_google_oauth_tokens_updated_at
  BEFORE UPDATE ON google_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- 8. VERIFICACIÓN
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '✅ TABLAS DE GOOGLE MEET CON TRACKING CREADAS CORRECTAMENTE';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 TABLAS CREADAS:';
    RAISE NOTICE '   ✅ google_meet_links (con tracking completo)';
    RAISE NOTICE '   ✅ google_oauth_tokens (para autenticación)';
    RAISE NOTICE '   ✅ meeting_attendance_logs (logs detallados)';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 CAMPOS AGREGADOS A calendar_events:';
    RAISE NOTICE '   ✅ google_event_id, meet_link, meet_code';
    RAISE NOTICE '   ✅ attendance_tracked, duration_tracked';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 FUNCIONALIDADES HABILITADAS:';
    RAISE NOTICE '   ✅ Tracking de asistencia en tiempo real';
    RAISE NOTICE '   ✅ Control de duración automático';
    RAISE NOTICE '   ✅ Logs detallados de participación';
    RAISE NOTICE '   ✅ Seguridad con RLS';
    RAISE NOTICE '';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '🎯 LISTO PARA IMPLEMENTAR GOOGLE MEET INTEGRATION';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
END $$;

-- Mostrar resumen de tablas creadas
SELECT 
  'google_meet_links' as tabla,
  COUNT(*) as registros
FROM google_meet_links
UNION ALL
SELECT 
  'google_oauth_tokens' as tabla,
  COUNT(*) as registros
FROM google_oauth_tokens
UNION ALL
SELECT 
  'meeting_attendance_logs' as tabla,
  COUNT(*) as registros
FROM meeting_attendance_logs;































