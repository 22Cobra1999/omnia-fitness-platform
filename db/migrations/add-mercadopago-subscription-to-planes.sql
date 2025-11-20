-- Agregar campo para almacenar el ID de suscripción de Mercado Pago
ALTER TABLE planes_uso_coach 
ADD COLUMN IF NOT EXISTS mercadopago_subscription_id VARCHAR(255);

-- Agregar índice para búsquedas por suscripción
CREATE INDEX IF NOT EXISTS idx_planes_uso_coach_subscription_id 
ON planes_uso_coach(mercadopago_subscription_id) 
WHERE mercadopago_subscription_id IS NOT NULL;

-- Agregar comentario
COMMENT ON COLUMN planes_uso_coach.mercadopago_subscription_id IS 'ID de la suscripción de Mercado Pago para cobro automático mensual';

