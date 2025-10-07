-- Paso 1: Eliminar la constraint existente
-- Es importante asegurarse de que no haya datos en la tabla que violen la NUEVA constraint
-- antes de añadirla, aunque en este caso solo estamos añadiendo un valor.
ALTER TABLE activity_enrollments
DROP CONSTRAINT IF EXISTS activity_enrollments_status_check;

-- Paso 2: Añadir la nueva constraint con 'active' incluido
-- Asegúrate de incluir TODOS los estados que uses o planees usar.
-- Los estados actuales son 'enrolled', 'completed', 'cancelled'.
-- Añadimos 'active'.
ALTER TABLE activity_enrollments
ADD CONSTRAINT activity_enrollments_status_check
CHECK (status IN ('enrolled', 'active', 'completed', 'cancelled'));

-- Opcional: Si también usas 'pending' o cualquier otro estado, añádelo aquí:
-- CHECK (status IN ('enrolled', 'active', 'completed', 'cancelled', 'pending'));
