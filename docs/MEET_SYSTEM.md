# Sistema de Meets (Reuniones) – Creación, Detalle, Invitaciones, Créditos y Cobro

> Documento vivo: mezcla **lo ya implementado** en el calendario del coach y **lo acordado como regla de negocio** (créditos + cobro).  
> Fecha: 2026-01-04

---

## 1) Objetivo

Permitir que un **coach** cree y gestione reuniones (tipo `consultation`) con:

- **Link de Google Meet** generado automáticamente.
- **Detalle limpio** (modo lectura) y edición explícita (botón lápiz).
- **Invitaciones** (1 cliente hoy; multi-cliente planificado).
- **Sistema de créditos** por reunión.
- **Cobro MercadoPago** cuando corresponde.

---

## 2) UI / UX (Coach Calendar)

### 2.1 Modal único (Crear / Detalle / Editar)
Se reutiliza un único modal:

- **Modo Crear**: al tocar `+`.
- **Modo Detalle (solo lectura)**: al hacer click en una reunión existente.
- **Modo Editar**: se habilita solo al tocar el **ícono lápiz**.

### 2.2 Link de Meet en detalle
En modo detalle (lectura):

- Si existe `meet_link`, se muestra botón **Meet** (ícono video).
- Abre `meet_link` en una pestaña.

### 2.3 Campos
En Crear/Editar:

- Tema
- Notas
- Fecha
- Hora inicio / fin
- Precio (gratis o monto)
- Clientes (selector)

En Detalle (lectura):

- Se muestra información como **texto** (sin frames)
- No se muestra selector ni “quitar cliente”

---

## 3) Datos y Tablas

### 3.1 Tabla principal (implementado)
**`calendar_events`** (una fila por invitación hoy)

Campos relevantes:

- `id`
- `coach_id`
- `client_id` *(hoy: 1 cliente por fila)*
- `event_type` = `'consultation'`
- `start_time`, `end_time`
- `description` *(se usa para “Notas”)*
- `is_free`, `price`, `currency`
- `meet_link`, `google_event_id` *(se completan al crear el Meet)*

### 3.2 Pago (existente en sistema de compras)
**`banco`** se usa para registrar pagos MercadoPago (en el flujo de compra de actividades).

Notas:

- En el flujo `create-with-mercadopago`, se inserta `banco` con `payment_status = 'pending'` y `mercadopago_preference_id`.
- Luego el webhook actualiza el estado a aprobado y se crea/actualiza el enrollment correspondiente.

### 3.3 Créditos (regla acordada, pendiente de implementación)
Créditos del cliente se manejan en:

- **`activity_enrollments`**: columna de “créditos usados” para meets (nombre exacto a confirmar en schema).

---

## 4) Google Meet – Generación del link

### 4.1 Endpoints

#### A) `POST /api/google/calendar/create-meet`
Uso: **reuniones creadas con `+`**.

Input:

```json
{ "eventId": "<calendar_events.id>" }
```

Efecto:

- Crea evento en Google Calendar con Meet.
- Extrae el meet link.
- Actualiza `calendar_events`:
  - `meet_link`
  - `google_event_id`

Si Google no está conectado:

- Responde con `connected: false`.

#### B) `POST /api/google/calendar/auto-create-meet`
Diseñado originalmente para **talleres**.

- Solo procesa `event_type = 'workshop'`.

### 4.2 Flujo actual (implementado)
Cuando el coach crea una reunión desde el modal:

1. Inserta una fila (o varias) en `calendar_events`.
2. Llama a `create-meet` por cada `eventId` insertado.
3. Refresca eventos (`getCoachEvents`) para que `meet_link` aparezca.

---

## 5) Invitaciones

### 5.1 Estado actual (implementado)
Hoy la invitación se modela como:

- **1 fila en `calendar_events` por cliente** (`client_id`)

Ventaja: simple.

Limitación:

- Multi-cliente requiere duplicación de filas o un rediseño.

### 5.2 Multi-cliente (propuesta recomendada)
Crear tabla puente:

- `calendar_event_participants`
  - `event_id`
  - `client_id`
  - (opcional) `price`, `currency`, `payment_status`, `banco_id`

Con esto:

- 1 solo `calendar_events` representa la reunión real.
- 1 solo `meet_link` / `google_event_id`.
- N participantes por reunión.

---

## 6) Créditos y Cobro – Reglas de negocio

> **Importante**: reglas acordadas; implementación pendiente.

### 6.1 Conceptos

- **Crédito**: unidad que permite cubrir 1 Meet.
- Los créditos se consumen por cliente.

### 6.2 Escenarios

#### Escenario 1 – Reunión Gratis y cliente tiene créditos
- Se crea reunión.
- Se genera Meet.
- Se consume 1 crédito:
  - `activity_enrollments.<meet_credits_used> += 1`

#### Escenario 2 – Reunión Gratis y cliente no tiene créditos
- Se crea reunión.
- Se genera Meet.
- **No se bloquea** y **no se cobra**.

#### Escenario 3 – Reunión con precio y cliente tiene créditos
- Se crea reunión con `price`.
- Se genera Meet.
- Se consume 1 crédito.
- **No se cobra MercadoPago**.

#### Escenario 4 – Reunión con precio y cliente no tiene créditos
- Se crea reunión con `price`.
- Debe **pagar con MercadoPago** para “aceptar” la reunión.
- Idealmente:
  - Se crea registro en `banco` (pendiente)
  - Se crea preferencia MP
  - Webhook aprueba → se marca como pagada

Notas:

- Definir si el `meet_link` se muestra antes o después del pago.

---

## 7) Pendientes técnicos

### 7.1 Créditos
- Confirmar:
  - nombre exacto de columna en `activity_enrollments` (ej: `meet_credits_used`)
  - cómo se calcula `credits_available` (si existe como columna o derivado)

### 7.2 Asociar reunión a enrollment
- Definir qué enrollment se usa para el descuento de créditos:
  - `calendar_events.enrollment_id` (si aplica)
  - o buscar enrollment “activo” del cliente con el coach

### 7.3 Cobro MercadoPago para reuniones
Reutilizar patrón existente de creación de preferencia + `banco`:

- Crear endpoint nuevo recomendado:
  - `POST /api/coach/meetings/create-payment`
  - que inserte `banco` + preferencia y devuelva `initPoint`

---

## 8) Referencias en código (actual)

- UI calendario coach: `components/coach/coach-calendar-screen.tsx`
- Google Meet:
  - `app/api/google/calendar/create-meet/route.ts`
  - `app/api/google/calendar/auto-create-meet/route.ts`

