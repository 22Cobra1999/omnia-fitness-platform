ALTER TABLE planes_uso_coach
ADD COLUMN IF NOT EXISTS mercadopago_subscription_status text null,
ADD COLUMN IF NOT EXISTS mercadopago_subscription_payer_email text null,
ADD COLUMN IF NOT EXISTS mercadopago_subscription_next_payment_date timestamptz null,
ADD COLUMN IF NOT EXISTS mercadopago_subscription_info jsonb null,
ADD COLUMN IF NOT EXISTS mercadopago_subscription_last_webhook_payload jsonb null,
ADD COLUMN IF NOT EXISTS mercadopago_subscription_last_webhook_received_at timestamptz null;
