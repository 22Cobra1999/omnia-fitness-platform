-- Crear tabla banco para información de pagos vinculada a activity_enrollments
CREATE TABLE banco (
  id bigserial PRIMARY KEY,
  enrollment_id integer NOT NULL REFERENCES activity_enrollments(id) ON DELETE CASCADE,
  amount_paid numeric(12,2),
  payment_date timestamptz,
  payment_method text,
  currency text,
  external_reference text,
  payment_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices útiles
CREATE INDEX idx_banco_enrollment_id ON banco(enrollment_id);
CREATE INDEX idx_banco_payment_date ON banco(payment_date);

-- Agregar columna de TODO del coach por cliente/actividad en activity_enrollments
ALTER TABLE activity_enrollments
  ADD COLUMN todo_list jsonb NOT NULL DEFAULT '[]';

-- Migrar datos de pago desde activity_enrollments a banco
INSERT INTO banco (enrollment_id, amount_paid, payment_date)
SELECT id::integer, amount_paid, payment_date
FROM activity_enrollments;

-- Eliminar columnas de pago de activity_enrollments
ALTER TABLE activity_enrollments DROP COLUMN amount_paid;
ALTER TABLE activity_enrollments DROP COLUMN payment_date;
-- Si existen estas columnas, también eliminarlas (ignorar errores si no existen en su entorno)
-- ALTER TABLE activity_enrollments DROP COLUMN payment_method;
-- ALTER TABLE activity_enrollments DROP COLUMN currency;
-- ALTER TABLE activity_enrollments DROP COLUMN external_reference;
-- ALTER TABLE activity_enrollments DROP COLUMN payment_status;


