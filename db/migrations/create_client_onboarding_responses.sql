-- Migración: Crear tabla para respuestas de onboarding de clientes
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla client_onboarding_responses
CREATE TABLE IF NOT EXISTS client_onboarding_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Paso 1: Nivel de exigencia
  intensity_level VARCHAR(50) CHECK (intensity_level IN ('tranquilo', 'constante', 'exigente', 'a_fondo')),
  
  -- Paso 2: Deseo de cambio
  change_goal VARCHAR(50) CHECK (change_goal IN ('desde_cero', 'mejorar', 'mantener', 'depende')),
  
  -- Paso 3: Horizonte del progreso (Time Preference)
  progress_horizon VARCHAR(50) CHECK (progress_horizon IN ('semana', 'mes', '2-3_meses', 'sostenible')),
  
  -- Paso 4: Constancia (Riesgo de abandono)
  consistency_level VARCHAR(50) CHECK (consistency_level IN ('cuesta', 'arranco_bien', 'constante', 'disciplinado')),
  
  -- Paso 5: Relación con el coach
  coaching_style VARCHAR(50) CHECK (coaching_style IN ('independiente', 'acompañado', 'guiado', 'encima_mio')),
  
  -- Paso 6: Modalidad e Intereses
  training_modality VARCHAR(50) CHECK (training_modality IN ('presencial', 'online', 'hibrido', 'adaptable')),
  interests TEXT[], -- Array de strings para almacenar múltiples intereses (fuerza, hiit, etc.)
  
  -- Paso 7: Últimos detalles (Datos duros se guardan aquí también para tener backup histórico)
  -- Nota: Los datos de salud también pueden ir a physicalData en profiles, pero aquí queda el registro del onboarding
  injuries TEXT[], -- Array de lesiones
  conditions TEXT[], -- Array de condiciones/patologías
  health_notes TEXT, -- Campo libre "algo que aclarar"
  
  birth_date DATE,
  height_cm NUMERIC(5,2),
  weight_kg NUMERIC(5,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(client_id) -- Un registro de onboarding por cliente (se puede actualizar)
);

-- 2. Índices para mejorar búsquedas y análisis
CREATE INDEX IF NOT EXISTS idx_onboarding_client_id ON client_onboarding_responses(client_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_intensity ON client_onboarding_responses(intensity_level);
CREATE INDEX IF NOT EXISTS idx_onboarding_consistency ON client_onboarding_responses(consistency_level);

-- 3. Habilitar RLS (Seguridad)
ALTER TABLE client_onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS:
-- Los clientes pueden ver y editar sus propias respuestas
CREATE POLICY "Clients can view their own onboarding" ON client_onboarding_responses
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert/update their own onboarding" ON client_onboarding_responses
  FOR ALL USING (auth.uid() = client_id);

-- Los coaches pueden ver las respuestas de sus clientes (asumiendo que hay una relación en otra tabla o lógica de negocio)
-- Esta política puede requerir ajustes según cómo se relacionan coaches y clientes en tu sistema actual.
-- Por ahora, permitimos que el coach vea si tiene acceso mediante service role o lógica de aplicación, 
-- o simplificamos permitiendo lectura a usuarios autenticados si es aceptable, 
-- O MEJOR: Usamos una política basada en si el usuario es un coach (auth.jwt() -> role)
-- CREATE POLICY "Coaches can view client onboarding" ON client_onboarding_responses
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'coach'
--     )
--   );

-- 4. Trigger para actualizar updated_at
CREATE TRIGGER update_client_onboarding_modtime
  BEFORE UPDATE ON client_onboarding_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios explicativos
COMMENT ON TABLE client_onboarding_responses IS 'Almacena las respuestas del formulario de onboarding conversacional de clientes';
COMMENT ON COLUMN client_onboarding_responses.interests IS 'Array de intereses seleccionados (Fuerza, HIIT, Nutrición, etc.)';
COMMENT ON COLUMN client_onboarding_responses.consistency_level IS 'Autoevaluación de constancia para predecir riesgo de abandono';
