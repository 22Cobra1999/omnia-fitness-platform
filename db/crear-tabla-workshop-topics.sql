-- ================================================
-- TABLA PARA TEMAS DE TALLERES
-- ================================================
-- Esta tabla almacena los diferentes temas/módulos de un taller
-- Cada tema puede tener múltiples horarios (original y bis)

-- PASO 1: Crear tabla workshop_topics
-- ================================================
CREATE TABLE IF NOT EXISTS workshop_topics (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  
  -- Información del tema
  topic_title TEXT NOT NULL,
  topic_description TEXT,
  topic_number INTEGER,                    -- Número de tema (1, 2, 3, etc.)
  
  -- Configuración visual
  color TEXT DEFAULT 'bg-blue-500',        -- Color para identificar el tema en el calendario
  
  -- Horarios del tema
  schedule_type TEXT NOT NULL DEFAULT 'single',  -- 'single' o 'dual' (si tiene bis)
  
  -- Horario ORIGINAL
  original_days JSONB,                     -- Array de días: ['Lun', 'Mié', 'Vie']
  original_start_time TIME,                -- Hora inicio del horario original
  original_end_time TIME,                  -- Hora fin del horario original
  original_dates JSONB,                    -- Array de fechas específicas generadas
  
  -- Horario BIS (segundo horario)
  bis_enabled BOOLEAN DEFAULT FALSE,       -- Si está habilitado el segundo horario
  bis_days JSONB,                          -- Array de días para el horario bis
  bis_start_time TIME,                     -- Hora inicio del horario bis
  bis_end_time TIME,                       -- Hora fin del horario bis
  bis_dates JSONB,                         -- Array de fechas específicas generadas
  
  -- Período de validez
  start_date DATE NOT NULL,                -- Desde cuándo aplica este tema
  end_date DATE NOT NULL,                  -- Hasta cuándo aplica este tema
  
  -- Estado
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraint para evitar temas duplicados
  UNIQUE(activity_id, topic_number)
);

-- Comentarios de la tabla
COMMENT ON TABLE workshop_topics IS 'Temas/módulos de talleres con sus horarios';
COMMENT ON COLUMN workshop_topics.topic_title IS 'Título del tema (ej: "Introducción al Yoga")';
COMMENT ON COLUMN workshop_topics.topic_description IS 'Descripción del tema';
COMMENT ON COLUMN workshop_topics.topic_number IS 'Número de tema dentro del taller';
COMMENT ON COLUMN workshop_topics.color IS 'Color en formato Tailwind para identificar visualmente';
COMMENT ON COLUMN workshop_topics.schedule_type IS 'Tipo de horario: single (solo original) o dual (original + bis)';
COMMENT ON COLUMN workshop_topics.original_days IS 'Días de la semana del horario original: ["Lun", "Mié", "Vie"]';
COMMENT ON COLUMN workshop_topics.bis_enabled IS 'Si está habilitado el segundo horario (bis)';
COMMENT ON COLUMN workshop_topics.bis_days IS 'Días de la semana del horario bis: ["Mar", "Jue"]';

-- PASO 2: Modificar tabla activity_schedules para agregar topic_id y schedule_variant
-- ================================================
DO $$
BEGIN
    -- Agregar referencia al tema
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
    
    -- Agregar indicador de horario original o bis
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

-- PASO 3: Crear índices para optimizar consultas
-- ================================================
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

-- PASO 4: Crear función para generar sesiones desde un tema
-- ================================================
CREATE OR REPLACE FUNCTION generate_sessions_from_topic(
    p_topic_id INTEGER,
    p_coach_id UUID
) RETURNS TABLE (
    fecha_generada DATE,
    hora_inicio TIME,
    hora_fin TIME,
    variante TEXT,
    dias_semana TEXT
) AS $$
DECLARE
    v_topic RECORD;
    v_date DATE;
    v_day_name TEXT;
    v_day_mapping JSONB := '{"Dom": 0, "Lun": 1, "Mar": 2, "Mié": 3, "Jue": 4, "Vie": 5, "Sáb": 6}'::JSONB;
BEGIN
    -- Obtener información del tema
    SELECT * INTO v_topic
    FROM workshop_topics
    WHERE id = p_topic_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tema no encontrado: %', p_topic_id;
    END IF;
    
    -- Generar sesiones del horario ORIGINAL
    IF v_topic.original_days IS NOT NULL THEN
        v_date := v_topic.start_date;
        
        WHILE v_date <= v_topic.end_date LOOP
            -- Obtener nombre del día
            v_day_name := CASE EXTRACT(DOW FROM v_date)
                WHEN 0 THEN 'Dom'
                WHEN 1 THEN 'Lun'
                WHEN 2 THEN 'Mar'
                WHEN 3 THEN 'Mié'
                WHEN 4 THEN 'Jue'
                WHEN 5 THEN 'Vie'
                WHEN 6 THEN 'Sáb'
            END;
            
            -- Si este día está en original_days, generar sesión
            IF v_topic.original_days ? v_day_name THEN
                RETURN QUERY SELECT 
                    v_date,
                    v_topic.original_start_time,
                    v_topic.original_end_time,
                    'original'::TEXT,
                    v_day_name;
            END IF;
            
            v_date := v_date + INTERVAL '1 day';
        END LOOP;
    END IF;
    
    -- Generar sesiones del horario BIS (si está habilitado)
    IF v_topic.bis_enabled AND v_topic.bis_days IS NOT NULL THEN
        v_date := v_topic.start_date;
        
        WHILE v_date <= v_topic.end_date LOOP
            -- Obtener nombre del día
            v_day_name := CASE EXTRACT(DOW FROM v_date)
                WHEN 0 THEN 'Dom'
                WHEN 1 THEN 'Lun'
                WHEN 2 THEN 'Mar'
                WHEN 3 THEN 'Mié'
                WHEN 4 THEN 'Jue'
                WHEN 5 THEN 'Vie'
                WHEN 6 THEN 'Sáb'
            END;
            
            -- Si este día está en bis_days, generar sesión
            IF v_topic.bis_days ? v_day_name THEN
                RETURN QUERY SELECT 
                    v_date,
                    v_topic.bis_start_time,
                    v_topic.bis_end_time,
                    'bis'::TEXT,
                    v_day_name;
            END IF;
            
            v_date := v_date + INTERVAL '1 day';
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION generate_sessions_from_topic IS 
'Genera todas las sesiones (original y bis) para un tema específico';

-- PASO 5: Crear función para verificar cupos por tema y variante
-- ================================================
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
    -- Obtener activity_id y cupos totales del tema
    SELECT t.activity_id, a.available_slots 
    INTO v_activity_id, v_total_slots
    FROM workshop_topics t
    JOIN activities a ON t.activity_id = a.id
    WHERE t.id = p_topic_id;
    
    -- Si no tiene cupos definidos, retornar NULL (cupos ilimitados)
    IF v_total_slots IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Contar cupos ocupados para este tema, fecha, hora y variante específica
    SELECT COUNT(*) INTO v_occupied_slots
    FROM activity_schedules
    WHERE topic_id = p_topic_id
    AND scheduled_date = p_scheduled_date
    AND scheduled_time = p_scheduled_time
    AND schedule_variant = p_schedule_variant
    AND status IN ('scheduled', 'completed');
    
    -- Calcular cupos disponibles
    v_available_slots := v_total_slots - v_occupied_slots;
    
    RETURN v_available_slots;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_topic_available_slots IS 
'Retorna cupos disponibles para un tema específico en fecha/hora/variante';

-- PASO 6: Crear vista para reporte de temas y horarios
-- ================================================
CREATE OR REPLACE VIEW workshop_topics_schedule_view AS
SELECT 
    t.id AS topic_id,
    t.activity_id,
    a.title AS workshop_title,
    t.topic_number,
    t.topic_title,
    t.color,
    t.schedule_type,
    
    -- Horario Original
    t.original_days,
    t.original_start_time,
    t.original_end_time,
    array_length(
        ARRAY(SELECT jsonb_array_elements_text(t.original_dates)), 
        1
    ) AS original_sessions_count,
    
    -- Horario Bis
    t.bis_enabled,
    t.bis_days,
    t.bis_start_time,
    t.bis_end_time,
    array_length(
        ARRAY(SELECT jsonb_array_elements_text(t.bis_dates)), 
        1
    ) AS bis_sessions_count,
    
    -- Período
    t.start_date,
    t.end_date,
    
    -- Cupos
    a.available_slots AS total_slots_per_session,
    
    -- Estado
    t.is_active
FROM workshop_topics t
JOIN activities a ON t.activity_id = a.id
ORDER BY t.activity_id, t.topic_number;

COMMENT ON VIEW workshop_topics_schedule_view IS 
'Vista consolidada de temas de talleres con sus horarios';

-- PASO 7: Habilitar RLS
-- ================================================
ALTER TABLE workshop_topics ENABLE ROW LEVEL SECURITY;

-- Políticas para workshop_topics
CREATE POLICY "Everyone can view active topics" ON workshop_topics
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Coaches can manage their workshop topics" ON workshop_topics
  FOR ALL USING (
    activity_id IN (
      SELECT id FROM activities WHERE coach_id = auth.uid()
    )
  );

-- PASO 8: Ejemplo de uso
-- ================================================
-- Ejemplo 1: Crear un tema con horario original y bis
INSERT INTO workshop_topics (
    activity_id,
    topic_number,
    topic_title,
    topic_description,
    color,
    schedule_type,
    -- Horario original: Lunes, Miércoles, Viernes 10:00-11:00
    original_days,
    original_start_time,
    original_end_time,
    -- Horario bis: Martes, Jueves 18:00-19:00
    bis_enabled,
    bis_days,
    bis_start_time,
    bis_end_time,
    start_date,
    end_date
) VALUES (
    1,                                          -- ID del taller
    1,                                          -- Tema #1
    'Introducción al Yoga',
    'Fundamentos básicos de yoga para principiantes',
    'bg-blue-500',
    'dual',                                     -- Tiene horario original y bis
    '["Lun", "Mié", "Vie"]'::JSONB,            -- Horario original
    '10:00:00',
    '11:00:00',
    TRUE,                                       -- Bis habilitado
    '["Mar", "Jue"]'::JSONB,                   -- Horario bis
    '18:00:00',
    '19:00:00',
    '2025-10-01',
    '2025-10-31'
) RETURNING *;

-- Ejemplo 2: Ver todas las sesiones generadas para un tema
SELECT * FROM generate_sessions_from_topic(1, 'uuid-coach')
ORDER BY fecha_generada, hora_inicio;

-- Ejemplo 3: Verificar cupos disponibles
SELECT get_topic_available_slots(
    1,                      -- topic_id
    '2025-10-15',          -- fecha
    '10:00:00',            -- hora
    'original'             -- variante (original o bis)
) AS cupos_disponibles;

-- Ejemplo 4: Ver reporte de temas
SELECT * FROM workshop_topics_schedule_view;

-- PASO 9: Verificar estructura final
-- ================================================
SELECT 
    'ESTRUCTURA WORKSHOP_TOPICS' AS seccion,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'workshop_topics'
ORDER BY ordinal_position;

SELECT 
    'ESTRUCTURA ACTIVITY_SCHEDULES (NUEVOS CAMPOS)' AS seccion,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'activity_schedules'
AND column_name IN ('topic_id', 'schedule_variant')
ORDER BY ordinal_position;





