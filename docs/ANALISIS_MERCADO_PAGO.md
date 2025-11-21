# Análisis para Integración de Mercado Pago

## 📊 Tablas Existentes Relacionadas con Pagos

### 1. Tabla `banco` ✅ (Ya existe)

```sql
CREATE TABLE banco (
  id bigserial PRIMARY KEY,
  enrollment_id integer NOT NULL REFERENCES activity_enrollments(id) ON DELETE CASCADE,
  amount_paid numeric(12,2),
  payment_date timestamptz,
  payment_method text,
  currency text,
  external_reference text,  -- ⚠️ Puede usarse para payment_id de Mercado Pago
  payment_status text,      -- ⚠️ Puede usarse para status de Mercado Pago
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices existentes
CREATE INDEX idx_banco_enrollment_id ON banco(enrollment_id);
CREATE INDEX idx_banco_payment_date ON banco(payment_date);
```

**Estado**: ✅ Tabla creada y lista para usar

**Campos útiles para Mercado Pago**:
- `external_reference`: Puede almacenar el `payment_id` de Mercado Pago
- `payment_status`: Puede almacenar estados como 'pending', 'approved', 'rejected', 'cancelled', 'refunded'
- `payment_method`: Puede almacenar 'mercadopago', 'credit_card', 'debit_card', etc.

**Campos que FALTAN para Mercado Pago**:
- ❌ `mercadopago_payment_id` (ID único del pago en Mercado Pago)
- ❌ `mercadopago_preference_id` (ID de la preferencia de pago)
- ❌ `mercadopago_status` (Estado específico de Mercado Pago: pending, approved, rejected, etc.)
- ❌ `mercadopago_status_detail` (Detalle del estado: accredited, pending_contingency, etc.)
- ❌ `mercadopago_payment_type_id` (Tipo: credit_card, debit_card, ticket, etc.)
- ❌ `mercadopago_installments` (Cantidad de cuotas)
- ❌ `mercadopago_fee` (Comisión de Mercado Pago)
- ❌ `mercadopago_net_amount` (Monto neto después de comisiones)
- ❌ `mercadopago_currency_id` (Moneda: ARS, USD, etc.)
- ❌ `mercadopago_date_approved` (Fecha de aprobación)
- ❌ `mercadopago_date_created` (Fecha de creación en MP)
- ❌ `mercadopago_date_last_updated` (Última actualización)
- ❌ `mercadopago_collector_id` (ID del vendedor/coach)
- ❌ `webhook_received` (Si se recibió el webhook)
- ❌ `webhook_data` (JSONB con datos completos del webhook)

---

### 2. Tabla `activity_enrollments` ✅ (Ya existe)

**Relación**: Un enrollment puede tener múltiples pagos en `banco` (para suscripciones o pagos parciales)

**Campos relevantes**:
- `id`: PK, referencia en `banco.enrollment_id`
- `activity_id`: FK a `activities`
- `client_id`: FK a `auth.users` (cliente)
- `status`: Estado de la inscripción
- `start_date`: Fecha de inicio
- `created_at`: Fecha de creación

**Estado**: ✅ Tabla existe y está relacionada con `banco`

---

### 3. Tabla `activities` ✅ (Ya existe)

**Campos relevantes para pagos**:
- `id`: PK
- `coach_id`: FK a `auth.users` (coach que recibe el pago)
- `price`: Precio de la actividad
- `currency`: Moneda (si existe)

**Estado**: ✅ Tabla existe

---

## 🔧 Modificaciones Necesarias para Mercado Pago

### Opción 1: Extender tabla `banco` (Recomendado)

Agregar columnas específicas de Mercado Pago a la tabla existente:

```sql
-- Agregar columnas para Mercado Pago
ALTER TABLE banco
  ADD COLUMN IF NOT EXISTS mercadopago_payment_id BIGINT UNIQUE,
  ADD COLUMN IF NOT EXISTS mercadopago_preference_id TEXT,
  ADD COLUMN IF NOT EXISTS mercadopago_status TEXT,
  ADD COLUMN IF NOT EXISTS mercadopago_status_detail TEXT,
  ADD COLUMN IF NOT EXISTS mercadopago_payment_type_id TEXT,
  ADD COLUMN IF NOT EXISTS mercadopago_installments INTEGER,
  ADD COLUMN IF NOT EXISTS mercadopago_fee NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS mercadopago_net_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS mercadopago_currency_id TEXT DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS mercadopago_date_approved TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mercadopago_date_created TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mercadopago_date_last_updated TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mercadopago_collector_id TEXT,
  ADD COLUMN IF NOT EXISTS webhook_received BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS webhook_data JSONB;

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_banco_mercadopago_payment_id ON banco(mercadopago_payment_id);
CREATE INDEX IF NOT EXISTS idx_banco_mercadopago_preference_id ON banco(mercadopago_preference_id);
CREATE INDEX IF NOT EXISTS idx_banco_mercadopago_status ON banco(mercadopago_status);
```

### Opción 2: Crear tabla separada `mercadopago_payments`

```sql
CREATE TABLE mercadopago_payments (
  id BIGSERIAL PRIMARY KEY,
  banco_id BIGINT NOT NULL REFERENCES banco(id) ON DELETE CASCADE,
  payment_id BIGINT UNIQUE NOT NULL,
  preference_id TEXT,
  status TEXT NOT NULL,
  status_detail TEXT,
  payment_type_id TEXT,
  installments INTEGER,
  fee NUMERIC(12,2),
  net_amount NUMERIC(12,2),
  currency_id TEXT DEFAULT 'ARS',
  date_approved TIMESTAMPTZ,
  date_created TIMESTAMPTZ,
  date_last_updated TIMESTAMPTZ,
  collector_id TEXT,
  webhook_received BOOLEAN DEFAULT FALSE,
  webhook_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mp_payments_payment_id ON mercadopago_payments(payment_id);
CREATE INDEX idx_mp_payments_preference_id ON mercadopago_payments(preference_id);
CREATE INDEX idx_mp_payments_status ON mercadopago_payments(status);
CREATE INDEX idx_mp_payments_banco_id ON mercadopago_payments(banco_id);
```

**Recomendación**: Opción 1 (extender `banco`) es más simple y mantiene todo en un solo lugar.

---

## 📋 Flujo de Integración con Mercado Pago

### 1. Cliente inicia compra
```
Cliente → Selecciona actividad → Click "Comprar"
  ↓
POST /api/enrollments/direct
  ↓
Crea activity_enrollments
  ↓
Crea registro en banco (con status='pending')
```

### 2. Crear preferencia de pago en Mercado Pago
```
POST /api/payments/create-preference
  ↓
Llama a Mercado Pago API
  ↓
Crea preferencia de pago
  ↓
Actualiza banco con:
  - mercadopago_preference_id
  - payment_status='pending'
  ↓
Retorna preference_id al frontend
```

### 3. Cliente completa pago
```
Frontend → Redirige a Mercado Pago
  ↓
Cliente paga en Mercado Pago
  ↓
Mercado Pago → Webhook a /api/payments/webhook
  ↓
Actualiza banco con datos del pago
  ↓
Si approved → Actualiza activity_enrollments.status='activa'
```

### 4. Webhook de Mercado Pago
```
POST /api/payments/webhook
  ↓
Verifica firma del webhook
  ↓
Busca pago por payment_id
  ↓
Actualiza banco con:
  - mercadopago_status
  - mercadopago_status_detail
  - payment_status
  - webhook_data (JSON completo)
  ↓
Si approved → Activa enrollment
```

---

## 🔑 Campos Clave para Mercado Pago

### En la tabla `banco`:

| Campo Actual | Uso para Mercado Pago | Estado |
|-------------|----------------------|--------|
| `external_reference` | Puede usarse para `payment_id` | ⚠️ Mejor crear campo específico |
| `payment_status` | Estado general del pago | ✅ Útil |
| `payment_method` | Método de pago | ✅ Útil |
| `amount_paid` | Monto pagado | ✅ Útil |
| `currency` | Moneda | ✅ Útil |
| `payment_date` | Fecha del pago | ✅ Útil |

### Campos que necesitamos agregar:

1. **Identificadores de Mercado Pago**:
   - `mercadopago_payment_id` (BIGINT, UNIQUE)
   - `mercadopago_preference_id` (TEXT)

2. **Estado y detalles**:
   - `mercadopago_status` (pending, approved, rejected, cancelled, refunded)
   - `mercadopago_status_detail` (accredited, pending_contingency, etc.)

3. **Información financiera**:
   - `mercadopago_fee` (comisión de MP)
   - `mercadopago_net_amount` (monto neto recibido)
   - `mercadopago_installments` (cuotas)

4. **Metadatos**:
   - `mercadopago_payment_type_id` (credit_card, debit_card, ticket, etc.)
   - `mercadopago_currency_id` (ARS, USD, etc.)
   - `mercadopago_collector_id` (ID del coach/vendedor)

5. **Fechas**:
   - `mercadopago_date_approved`
   - `mercadopago_date_created`
   - `mercadopago_date_last_updated`

6. **Webhook**:
   - `webhook_received` (BOOLEAN)
   - `webhook_data` (JSONB con datos completos)

---

## 📝 Próximos Pasos

1. ✅ **Ejecutar consulta SQL** para ver todas las tablas existentes
2. ⏳ **Crear migración** para agregar columnas de Mercado Pago a `banco`
3. ⏳ **Crear API endpoints**:
   - `POST /api/payments/create-preference` - Crear preferencia de pago
   - `POST /api/payments/webhook` - Recibir webhooks de Mercado Pago
   - `GET /api/payments/:paymentId` - Consultar estado de pago
4. ⏳ **Instalar SDK de Mercado Pago**:
   ```bash
   npm install mercadopago
   ```
5. ⏳ **Configurar variables de entorno**:
   - `MERCADOPAGO_ACCESS_TOKEN`
   - `MERCADOPAGO_PUBLIC_KEY`
   - `MERCADOPAGO_WEBHOOK_SECRET`

---

## 🔍 Consulta SQL para Ver Todas las Tablas

Ejecuta este SQL en el SQL Editor de Supabase:

```sql
-- Ver archivo: db/queries/list-all-tables-and-columns.sql
```

O ejecuta el script:
```bash
node scripts/list-all-tables-simple.js
```

(Necesitas configurar `DATABASE_URL` en `.env.local`)









