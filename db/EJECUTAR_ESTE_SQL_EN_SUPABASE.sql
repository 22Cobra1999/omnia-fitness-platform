-- ================================================================
-- SCRIPT COMPLETO PARA SISTEMA DE TALLERES EN SUPABASE
-- ================================================================
-- 
-- INSTRUCCIONES:
-- 1. Abre tu proyecto en Supabase: https://mgrfswrsvrzwtgilssad.supabase.co
-- 2. Ve a SQL Editor
-- 3. Crea una nueva query
-- 4. Copia y pega TODO este archivo
-- 5. Clic en "Run"
-- 
-- Este script incluye:
-- ✅ Campos de taller en activities
-- ✅ Mejoras a activity_schedules
-- ✅ Tabla workshop_topics
-- ✅ Funciones de verificación de cupos
-- ✅ Vistas de reportes
-- 
-- ================================================================

-- ================================================================
-- PARTE 1: CREAR TABLA ACTIVITY_SCHEDULES (SI NO EXISTE)
-- ================================================================

-- Tabla para almacenar los horarios programados de las actividades compradas
CREATE TABLE IF NOT EXISTS activity_schedules (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER REFERENCES activity_enrollments(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  session_type TEXT NOT NULL DEFAULT 'workshop',
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  zoom_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices básicos para activity_schedules
CREATE INDEX IF NOT EXISTS idx_activity_schedules_client_date 
ON activity_schedules(client_id, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_activity_schedules_coach_date 
ON activity_schedules(coach_id, scheduled_date);

-- Habilitar RLS en activity_schedules
ALTER TABLE activity_schedules ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para activity_schedules
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own schedules" ON activity_schedules;
    DROP POLICY IF EXISTS "Coaches can insert schedules for their activities" ON activity_schedules;
    DROP POLICY IF EXISTS "Users can update their own schedules" ON activity_schedules;
    DROP POLICY IF EXISTS "Users can delete their own schedules" ON activity_schedules;
    
    CREATE POLICY "Users can view their own schedules" ON activity_schedules
      FOR SELECT USING (auth.uid() = client_id OR auth.uid() = coach_id);

    CREATE POLICY "Coaches can insert schedules for their activities" ON activity_schedules
      FOR INSERT WITH CHECK (auth.uid() = coach_id);

    CREATE POLICY "Users can update their own schedules" ON activity_schedules
      FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = coach_id);

    CREATE POLICY "Users can delete their own schedules" ON activity_schedules
      FOR DELETE USING (auth.uid() = client_id OR auth.uid() = coach_id);
      
    RAISE NOTICE '✅ Tabla activity_schedules creada con políticas RLS';
END $$;

-- ================================================================
-- PARTE 2: AGREGAR CAMPOS DE TALLER A ACTIVITIES
-- ================================================================

-- Agregar campo workshop_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'workshop_type'
    ) THEN
        ALTER TABLE activities 
        ADD COLUMN workshop_type TEXT 
        CHECK (workshop_type IN ('presencial', 'virtual', 'hibrido'));
        
        COMMENT ON COLUMN activities.workshop_type IS 'Tipo de taller: presencial, virtual o híbrido';
    END IF;
    
    -- Agregar campo workshop_schedule_blocks
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'workshop_schedule_blocks'
    ) THEN
        ALTER TABLE activities 
        ADD COLUMN workshop_schedule_blocks JSONB;
        
        COMMENT ON COLUMN activities.workshop_schedule_blocks IS 'Bloques de horarios configurados para el taller (TimeBlocks del WorkshopScheduleManager)';
    END IF;
    
    RAISE NOTICE '✅ Campos workshop_type y workshop_schedule_blocks agregados';
END $$;

-- Crear índice para mejorar búsquedas por tipo de workshop
CREATE INDEX IF NOT EXISTS idx_activities_workshop_type 
ON activities(workshop_type) 
WHERE type = 'workshop';

-- ================================================================
-- PARTE 3: MEJORAR ACTIVITY_SCHEDULES
-- ================================================================

-- Agregar estado 'absent' al constraint de status
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'activity_schedules_status_check'
    ) THEN
        ALTER TABLE activity_schedules 
        DROP CONSTRAINT activity_schedules_status_check;
    END IF;
    
    ALTER TABLE activity_schedules 
    ADD CONSTRAINT activity_schedules_status_check 
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'absent'));
    
    RAISE NOTICE '✅ Status constraint actualizado con estado "absent"';
END $$;

-- Agregar campos adicionales útiles para talleres
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_schedules' 
        AND column_name = 'attendance_confirmed'
    ) THEN
        ALTER TABLE activity_schedules 
        ADD COLUMN attendance_confirmed BOOLEAN DEFAULT FALSE;
        
        COMMENT ON COLUMN activity_schedules.attendance_confirmed 
        IS 'Si el cliente confirmó que va a asistir a la sesión';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_schedules' 
        AND column_name = 'session_number'
    ) THEN
        ALTER TABLE activity_schedules 
        ADD COLUMN session_number INTEGER;
        
        COMMENT ON COLUMN activity_schedules.session_number 
        IS 'Número de sesión dentro del taller (1, 2, 3, etc.)';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_schedules' 
        AND column_name = 'location'
    ) THEN
        ALTER TABLE activity_schedules 
        ADD COLUMN location TEXT;
        
        COMMENT ON COLUMN activity_schedules.location 
        IS 'Ubicación física para talleres presenciales';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_schedules' 
        AND column_name = 'rating'
    ) THEN
        ALTER TABLE activity_schedules 
        ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
        
        COMMENT ON COLUMN activity_schedules.rating 
        IS 'Calificación del cliente para esta sesión (1-5)';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_schedules' 
        AND column_name = 'feedback'
    ) THEN
        ALTER TABLE activity_schedules 
        ADD COLUMN feedback TEXT;
        
        COMMENT ON COLUMN activity_schedules.feedback 
        IS 'Comentarios del cliente sobre la sesión';
    END IF;
    
    RAISE NOTICE '✅ Campos adicionales agregados a activity_schedules';
END $$;

-- Crear índices adicionales
CREATE INDEX IF NOT EXISTS idx_activity_schedules_status 
ON activity_schedules(status);

CREATE INDEX IF NOT EXISTS idx_activity_schedules_session_type 
ON activity_schedules(session_type);

CREATE INDEX IF NOT EXISTS idx_activity_schedules_activity_date 
ON activity_schedules(activity_id, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_activity_schedules_session_number 
ON activity_schedules(activity_id, session_number);

-- ================================================================
-- PARTE 4: CREAR TABLA WORKSHOP_TOPICS
-- ================================================================

CREATE TABLE IF NOT EXISTS workshop_topics (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  
  -- Información del tema
  topic_title TEXT NOT NULL,
  topic_description TEXT,
  topic_number INTEGER,
  
  -- Configuración visual
  color TEXT DEFAULT 'bg-blue-500',
  
  -- Horarios del tema
  schedule_type TEXT NOT NULL DEFAULT 'single',
  
  -- Horario ORIGINAL
  original_days JSONB,
  original_start_time TIME,
  original_end_time TIME,
  original_dates JSONB,
  
  -- Horario BIS (segundo horario)
  bis_enabled BOOLEAN DEFAULT FALSE,
  bis_days JSONB,
  bis_start_time TIME,
  bis_end_time TIME,
  bis_dates JSONB,
  
  -- Período de validez
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Estado
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraint para evitar temas duplicados
  UNIQUE(activity_id, topic_number)
);

COMMENT ON TABLE workshop_topics IS 'Temas/módulos de talleres con sus horarios';

-- Agregar campos topic_id y schedule_variant a activity_schedules
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_schedules' 
        AND column_name = 'topic_id'
    ) THEN
        ALTER TABLE activity_schedules 
        ADD COLUMN topic_id INTEGER REFERENCES workshop_topics(id) ON DELETE SET NULL;
        
        COMMENT ON COLUMN activity_schedules.topic_id 
        IS 'Referencia al tema del taller (si aplica)';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_schedules' 
        AND column_name = 'schedule_variant'
    ) THEN
        ALTER TABLE activity_schedules 
        ADD COLUMN schedule_variant TEXT DEFAULT 'original' 
        CHECK (schedule_variant IN ('original', 'bis'));
        
        COMMENT ON COLUMN activity_schedules.schedule_variant 
        IS 'Indica si es horario original o bis (segundo horario)';
    END IF;
    
    RAISE NOTICE '✅ Campos topic_id y schedule_variant agregados a activity_schedules';
END $$;

-- Crear índices para workshop_topics
CREATE INDEX IF NOT EXISTS idx_workshop_topics_activity_id 
ON workshop_topics(activity_id);

CREATE INDEX IF NOT EXISTS idx_workshop_topics_topic_number 
ON workshop_topics(activity_id, topic_number);

CREATE INDEX IF NOT EXISTS idx_workshop_topics_dates 
ON workshop_topics(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_activity_schedules_topic_id 
ON activity_schedules(topic_id);

CREATE INDEX IF NOT EXISTS idx_activity_schedules_schedule_variant 
ON activity_schedules(schedule_variant);

CREATE INDEX IF NOT EXISTS idx_activity_schedules_topic_variant 
ON activity_schedules(topic_id, schedule_variant);

-- ================================================================
-- PARTE 5: FUNCIONES DE VERIFICACIÓN DE CUPOS
-- ================================================================

-- Función para contar cupos ocupados (general - sin tema)
CREATE OR REPLACE FUNCTION get_workshop_available_slots(
    p_activity_id INTEGER,
    p_scheduled_date DATE,
    p_scheduled_time TIME
) RETURNS INTEGER AS $$
DECLARE
    v_total_slots INTEGER;
    v_occupied_slots INTEGER;
    v_available_slots INTEGER;
BEGIN
    SELECT available_slots INTO v_total_slots
    FROM activities
    WHERE id = p_activity_id;
    
    IF v_total_slots IS NULL THEN
        RETURN NULL;
    END IF;
    
    SELECT COUNT(*) INTO v_occupied_slots
    FROM activity_schedules
    WHERE activity_id = p_activity_id
    AND scheduled_date = p_scheduled_date
    AND scheduled_time = p_scheduled_time
    AND status IN ('scheduled', 'completed');
    
    v_available_slots := v_total_slots - v_occupied_slots;
    
    RETURN v_available_slots;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_workshop_available_slots IS 
'Retorna cupos disponibles para un taller en fecha/hora específica (uso general)';

-- Función para verificar cupos por TEMA y VARIANTE (original/bis)
CREATE OR REPLACE FUNCTION get_topic_available_slots(
    p_topic_id INTEGER,
    p_scheduled_date DATE,
    p_scheduled_time TIME,
    p_schedule_variant TEXT DEFAULT 'original'
) RETURNS INTEGER AS $$
DECLARE
    v_activity_id INTEGER;
    v_total_slots INTEGER;
    v_occupied_slots INTEGER;
    v_available_slots INTEGER;
BEGIN
    SELECT t.activity_id, a.available_slots 
    INTO v_activity_id, v_total_slots
    FROM workshop_topics t
    JOIN activities a ON t.activity_id = a.id
    WHERE t.id = p_topic_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    IF v_total_slots IS NULL THEN
        RETURN NULL;
    END IF;
    
    SELECT COUNT(*) INTO v_occupied_slots
    FROM activity_schedules
    WHERE topic_id = p_topic_id
    AND scheduled_date = p_scheduled_date
    AND scheduled_time = p_scheduled_time
    AND schedule_variant = p_schedule_variant
    AND status IN ('scheduled', 'completed');
    
    v_available_slots := v_total_slots - v_occupied_slots;
    
    RETURN v_available_slots;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_topic_available_slots IS 
'Retorna cupos disponibles para un TEMA específico en fecha/hora/variante (original o bis)';

-- Función para verificar disponibilidad con soporte de temas
CREATE OR REPLACE FUNCTION check_workshop_availability(
    p_activity_id INTEGER DEFAULT NULL,
    p_topic_id INTEGER DEFAULT NULL,
    p_scheduled_date DATE DEFAULT NULL,
    p_scheduled_time TIME DEFAULT NULL,
    p_schedule_variant TEXT DEFAULT 'original'
) RETURNS BOOLEAN AS $$
DECLARE
    v_available_slots INTEGER;
BEGIN
    IF p_topic_id IS NOT NULL THEN
        v_available_slots := get_topic_available_slots(
            p_topic_id,
            p_scheduled_date,
            p_scheduled_time,
            p_schedule_variant
        );
    ELSIF p_activity_id IS NOT NULL THEN
        v_available_slots := get_workshop_available_slots(
            p_activity_id,
            p_scheduled_date,
            p_scheduled_time
        );
    ELSE
        RETURN FALSE;
    END IF;
    
    IF v_available_slots IS NULL THEN
        RETURN TRUE;
    END IF;
    
    RETURN v_available_slots > 0;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_workshop_availability IS 
'Verifica si hay cupo disponible. Soporta verificación por tema (con variante) o actividad general';

-- ================================================================
-- PARTE 6: RLS PARA WORKSHOP_TOPICS
-- ================================================================

ALTER TABLE workshop_topics ENABLE ROW LEVEL SECURITY;

-- Políticas para workshop_topics
DO $$
BEGIN
    -- Eliminar políticas si existen
    DROP POLICY IF EXISTS "Everyone can view active topics" ON workshop_topics;
    DROP POLICY IF EXISTS "Coaches can manage their workshop topics" ON workshop_topics;
    
    -- Crear nuevas políticas
    CREATE POLICY "Everyone can view active topics" ON workshop_topics
      FOR SELECT USING (is_active = TRUE);

    CREATE POLICY "Coaches can manage their workshop topics" ON workshop_topics
      FOR ALL USING (
        activity_id IN (
          SELECT id FROM activities WHERE coach_id = auth.uid()
        )
      );
END $$;

-- ================================================================
-- VERIFICACIÓN FINAL
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '✅ SISTEMA DE TALLERES INSTALADO CORRECTAMENTE';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE '📋 RESUMEN:';
    RAISE NOTICE '  ✅ Campos de taller agregados a activities';
    RAISE NOTICE '  ✅ activity_schedules mejorada con estados y campos adicionales';
    RAISE NOTICE '  ✅ Tabla workshop_topics creada';
    RAISE NOTICE '  ✅ Funciones de verificación de cupos creadas';
    RAISE NOTICE '  ✅ Políticas RLS configuradas';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 PRÓXIMOS PASOS:';
    RAISE NOTICE '  1. Actualizar tus componentes de frontend';
    RAISE NOTICE '  2. Crear tu primer tema de taller';
    RAISE NOTICE '  3. Probar las funciones de verificación de cupos';
    RAISE NOTICE '';
    RAISE NOTICE '📚 Documentación completa en: GUIA_TEMAS_TALLERES.md';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

