-- Tabla para trackear planes y uso de almacenamiento por coach
CREATE TABLE IF NOT EXISTS planes_uso_coach (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('free', 'basico', 'black', 'premium')),
  storage_limit_gb DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  storage_used_gb DECIMAL(10, 6) NOT NULL DEFAULT 0.000000,
  storage_available_gb DECIMAL(10, 6) GENERATED ALWAYS AS (storage_limit_gb - storage_used_gb) STORED,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_planes_uso_coach_coach_id ON planes_uso_coach(coach_id);
CREATE INDEX IF NOT EXISTS idx_planes_uso_coach_status ON planes_uso_coach(status);
CREATE INDEX IF NOT EXISTS idx_planes_uso_coach_plan_type ON planes_uso_coach(plan_type);

-- Índice único parcial: Un coach solo puede tener un plan activo a la vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_plan_per_coach 
ON planes_uso_coach(coach_id) 
WHERE status = 'active';

-- Comentarios
COMMENT ON TABLE planes_uso_coach IS 'Rastrea los planes de almacenamiento y su uso por cada coach';
COMMENT ON COLUMN planes_uso_coach.plan_type IS 'Tipo de plan: free, basico, black, premium';
COMMENT ON COLUMN planes_uso_coach.storage_limit_gb IS 'Límite de almacenamiento del plan en GB';
COMMENT ON COLUMN planes_uso_coach.storage_used_gb IS 'Almacenamiento usado actualmente en GB';
COMMENT ON COLUMN planes_uso_coach.storage_available_gb IS 'Almacenamiento disponible (calculado automáticamente)';
COMMENT ON COLUMN planes_uso_coach.status IS 'Estado del plan: active, cancelled, expired, trial';

-- Políticas de seguridad RLS
ALTER TABLE planes_uso_coach ENABLE ROW LEVEL SECURITY;

-- Política: Los coaches pueden ver su propio plan
CREATE POLICY planes_uso_coach_select_policy ON planes_uso_coach
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM coaches WHERE id = coach_id
    ) OR 
    auth.role() = 'admin'
  );

-- Política: Los coaches pueden insertar su propio plan
CREATE POLICY planes_uso_coach_insert_policy ON planes_uso_coach
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM coaches WHERE id = coach_id
    ) OR 
    auth.role() = 'admin'
  );

-- Política: Los coaches pueden actualizar su propio plan (solo ciertos campos)
CREATE POLICY planes_uso_coach_update_policy ON planes_uso_coach
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM coaches WHERE id = coach_id
    ) OR 
    auth.role() = 'admin'
  );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_planes_uso_coach_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_planes_uso_coach_updated_at
  BEFORE UPDATE ON planes_uso_coach
  FOR EACH ROW
  EXECUTE FUNCTION update_planes_uso_coach_updated_at();

-- Función para sincronizar storage_used_gb desde storage_usage
CREATE OR REPLACE FUNCTION sync_coach_storage_usage()
RETURNS TRIGGER AS $$
DECLARE
  total_gb DECIMAL(10, 6);
  coach_uuid UUID;
BEGIN
  -- Obtener el coach_id desde storage_usage
  coach_uuid := NEW.coach_id;
  
  -- Calcular el total usado
  SELECT COALESCE(SUM(gb_usage), 0) INTO total_gb
  FROM storage_usage
  WHERE coach_id = coach_uuid;
  
  -- Actualizar planes_uso_coach
  UPDATE planes_uso_coach
  SET storage_used_gb = total_gb
  WHERE coach_id = coach_uuid AND status = 'active';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

