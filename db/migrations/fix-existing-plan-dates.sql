-- Script para corregir datos existentes en planes_uso_coach
-- Ejecutar después de add-renewal-count-to-planes.sql

-- 1. Agregar renewal_count si no existe (ya debería estar si se ejecutó la migración anterior)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'planes_uso_coach' 
        AND column_name = 'renewal_count'
    ) THEN
        ALTER TABLE planes_uso_coach 
        ADD COLUMN renewal_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Actualizar renewal_count a 0 para todos los planes existentes (excepto los que ya tienen valor)
UPDATE planes_uso_coach 
SET renewal_count = 0 
WHERE renewal_count IS NULL;

-- 2.1. Reactivar planes cancelados que deberían estar activos (coaches nuevos sin plan activo)
-- Si un coach no tiene ningún plan activo pero tiene un plan cancelado reciente, reactivarlo
UPDATE planes_uso_coach p1
SET status = 'active'
WHERE p1.status = 'cancelled'
  AND NOT EXISTS (
    SELECT 1 
    FROM planes_uso_coach p2 
    WHERE p2.coach_id = p1.coach_id 
      AND p2.status = 'active'
  )
  AND (
    -- Si es plan free y fue creado recientemente (últimos 90 días)
    (p1.plan_type = 'free' AND p1.created_at > NOW() - INTERVAL '90 days')
    -- O si es cualquier plan y started_at es reciente o futuro
    OR (p1.started_at IS NOT NULL AND p1.started_at >= NOW() - INTERVAL '60 days')
    -- O si no tiene started_at pero fue creado recientemente
    OR (p1.started_at IS NULL AND p1.created_at > NOW() - INTERVAL '30 days')
  );

-- 3. Corregir expires_at para planes que no lo tienen o es incorrecto
-- Calcula expires_at como started_at + 31 días para TODOS los planes (activos, cancelados, expirados)
UPDATE planes_uso_coach
SET expires_at = (
    CASE 
        WHEN started_at IS NOT NULL THEN 
            started_at + INTERVAL '31 days'
        ELSE 
            COALESCE(created_at, NOW()) + INTERVAL '31 days'
    END
)
WHERE (
    expires_at IS NULL 
    OR expires_at < started_at 
    OR (started_at IS NOT NULL AND expires_at > (started_at + INTERVAL '32 days')) -- Más de 31 días, probablemente incorrecto
    OR (started_at IS NOT NULL AND expires_at < (started_at + INTERVAL '30 days')) -- Menos de 31 días, probablemente incorrecto
  );

-- 4. Para planes que no tienen started_at, establecerlo como created_at o NOW()
UPDATE planes_uso_coach
SET started_at = COALESCE(created_at, NOW())
WHERE started_at IS NULL;

-- 5. Corregir expires_at para planes que ahora tienen started_at pero no expires_at
-- Aplicar a TODOS los estados
UPDATE planes_uso_coach
SET expires_at = started_at + INTERVAL '31 days'
WHERE started_at IS NOT NULL 
  AND expires_at IS NULL;

-- 6. Verificar y corregir planes con started_at en el futuro (para downgrades)
-- Estos planes deben mantenerse, pero asegurémonos de que expires_at sea correcto
UPDATE planes_uso_coach
SET expires_at = started_at + INTERVAL '31 days'
WHERE started_at > NOW() -- Planes programados para el futuro (downgrades)
  AND (
    expires_at IS NULL 
    OR expires_at != (started_at + INTERVAL '31 days')
  );

-- 7. Para planes expirados o cancelados, asegurar que tengan fechas válidas
-- Corregir TODOS los planes cancelados/expirados que tengan fechas incorrectas
UPDATE planes_uso_coach
SET expires_at = started_at + INTERVAL '31 days'
WHERE status IN ('expired', 'cancelled')
  AND started_at IS NOT NULL
  AND (
    expires_at IS NULL 
    OR expires_at != (started_at + INTERVAL '31 days')
  );

-- 8. Verificación final: Mostrar planes que necesitan revisión manual
SELECT 
    id,
    coach_id,
    plan_type,
    status,
    started_at,
    expires_at,
    CASE 
        WHEN expires_at IS NULL THEN '❌ FALTA expires_at'
        WHEN started_at IS NULL THEN '❌ FALTA started_at'
        WHEN started_at IS NOT NULL AND expires_at != (started_at + INTERVAL '31 days') THEN '⚠️ expires_at incorrecto'
        WHEN started_at > NOW() AND status = 'active' THEN '✅ Plan programado (downgrade)'
        ELSE '✅ OK'
    END as estado,
    renewal_count,
    created_at
FROM planes_uso_coach
ORDER BY status, started_at DESC NULLS LAST;

-- 9. Mostrar resumen de correcciones
SELECT 
    plan_type,
    status,
    COUNT(*) as total,
    COUNT(CASE WHEN expires_at IS NOT NULL AND started_at IS NOT NULL 
               AND expires_at = (started_at + INTERVAL '31 days') THEN 1 END) as correctos,
    COUNT(CASE WHEN expires_at IS NULL OR started_at IS NULL THEN 1 END) as con_fechas_faltantes,
    COUNT(CASE WHEN expires_at != (started_at + INTERVAL '31 days') THEN 1 END) as con_fechas_incorrectas
FROM planes_uso_coach
GROUP BY plan_type, status
ORDER BY plan_type, status;

