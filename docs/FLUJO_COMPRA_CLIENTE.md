# Flujo de Compra del Cliente

Este documento describe el proceso técnico y funcional de la compra de productos (Actividades, Talleres, Programas) por parte de un cliente en la plataforma Omnia Fitness.

## 1. Selección del Producto
El cliente navega por la pestaña de búsqueda (`SearchScreen`) y selecciona una actividad.
- Se abre el detalle de la actividad.
- El cliente presiona el botón "Inscribirme" o "Comprar".

## 2. Generación de Preferencia (Mercado Pago)
Cuando el cliente inicia la compra, se llama al endpoint `/api/mercadopago/checkout-pro/create-preference`.
- Se valida la existencia del producto (`activities` table).
- Se genera una `external_reference` con el formato: `omnia_{activityId}_{clientId}_{timestamp}`.
- Se crea una preferencia en Mercado Pago.
- La plataforma devuelve el `init_point` (Checkout Pro de Mercado Pago).

## 3. Procesamiento en Mercado Pago
El cliente es redirigido a Mercado Pago para completar el pago.
- Al finalizar, Mercado Pago redirige al cliente de vuelta a la plataforma (Success/Failure URL).
- Se envían webhooks (IPN) a la plataforma para notificar el estado del pago.

## 4. Webhook y Registro en Base de Datos
El endpoint de Webhook (`/api/mercadopago/webhook`) procesa la notificación:
- Se verifica el estado del pago (`approved`).
- Se registra la transacción en la tabla `banco`.
- Se crea una inscripción en la tabla `activity_enrollments`.
- Si el producto tiene cupos limitados, se descuenta un cupo.

## 5. Visualización de la Compra
El cliente puede ver sus compras en:
- **Perfil**: Sección "Historial de Compras" (alimentado por `/api/client/recent-purchases`).
- **Mis Actividades**: Pestaña donde aparecen los productos adquiridos.

### Tablas Involucradas:
- `activities`: Información del producto.
- `banco`: Registro contable de la transacción.
- `activity_enrollments`: Vínculo entre el cliente y el producto.
- `clients`: Datos del comprador.

### Campos Clave en `banco`:
- `client_id`: ID del usuario que compra.
- `activity_id`: ID del producto comprado.
- `amount_paid`: Monto pagado.
- `payment_status`: Estado final del pago.
- `concept`: Título descriptivo para el historial.
- `external_reference`: Referencia única de la transacción.
