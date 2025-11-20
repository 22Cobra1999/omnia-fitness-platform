# 🧪 Guía de Testing: Sistema de Suscripciones Automáticas

## 📋 Prerequisitos

### 1. Ejecutar Migración SQL

Ejecuta la migración en Supabase SQL Editor:

```sql
-- Ejecutar: db/migrations/add-mercadopago-subscription-to-planes.sql
ALTER TABLE planes_uso_coach 
ADD COLUMN IF NOT EXISTS mercadopago_subscription_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_planes_uso_coach_subscription_id 
ON planes_uso_coach(mercadopago_subscription_id) 
WHERE mercadopago_subscription_id IS NOT NULL;

COMMENT ON COLUMN planes_uso_coach.mercadopago_subscription_id IS 'ID de la suscripción de Mercado Pago para cobro automático mensual';
```

### 2. Variables de Entorno (Vercel)

Verifica que estas variables estén configuradas en **Vercel → Settings → Environment Variables**:

```env
# Mercado Pago (PRUEBA)
MERCADOPAGO_ACCESS_TOKEN=TEST-1806894141402209-111615-...
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-cc6d31a8-ff84-4644-98dd-e05c6740d95e
MERCADOPAGO_CLIENT_ID=1806894141402209
MERCADOPAGO_CLIENT_SECRET=7dtInztF6aQwAGQCfWk2XGdMbWBd54QS

# URLs
NEXT_PUBLIC_APP_URL=https://omnia-app.vercel.app
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=https://omnia-app.vercel.app/api/mercadopago/oauth/callback

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. Configurar Webhook en Mercado Pago

1. Ve a: https://www.mercadopago.com.ar/developers/panel/app
2. Selecciona tu aplicación
3. Ve a **"Webhooks"** o **"Notificaciones"**
4. Agrega la URL del webhook:
   ```
   https://omnia-app.vercel.app/api/payments/subscription-webhook
   ```
5. Selecciona los topics:
   - `subscription_preapproval`
   - `payment`
   - `subscription_authorized_payment`

---

## 🧪 Flujo de Testing Completo

### Paso 1: Cambiar a Plan de Pago (Básico, Black o Premium)

1. **Inicia sesión** como coach en la aplicación
2. Ve a **Perfil** → **Mi Suscripción**
3. Haz clic en **"Ver Planes"**
4. Selecciona un plan de pago (ej: **Básico** - $12,000 ARS/mes)
5. Haz clic en **"Cambiar a este plan"**

**Resultado esperado:**
- ✅ Se crea una suscripción en Mercado Pago
- ✅ Se muestra un enlace de pago (`init_point`)
- ✅ El plan se crea en la BD con `mercadopago_subscription_id`
- ✅ El estado del plan es `active`

**Verificar en logs:**
```bash
# Ver logs en Vercel Dashboard → Deployments → Logs
# Deberías ver:
✅ Suscripción de Mercado Pago creada: {subscription_id}
✅ Plan cambiado exitosamente
```

### Paso 2: Completar el Primer Pago

1. **Sigue el enlace** de pago que se generó (`init_point`)
2. Completa el pago usando una tarjeta de prueba de Mercado Pago:
   - **Tarjeta aprobada**: `5031 7557 3453 0604`
   - **CVV**: `123`
   - **Fecha**: Cualquier fecha futura
   - **Titular**: `APRO` (para aprobado) o `CONT` (para pendiente)

**Resultado esperado:**
- ✅ El pago se procesa exitosamente
- ✅ El plan queda activo en la BD
- ✅ La suscripción queda autorizada en Mercado Pago

**Verificar en Supabase:**
```sql
SELECT 
  id,
  coach_id,
  plan_type,
  status,
  mercadopago_subscription_id,
  started_at,
  expires_at
FROM planes_uso_coach
WHERE coach_id = 'tu-coach-id'
AND status = 'active';
```

### Paso 3: Verificar Webhook de Renovación

Mercado Pago enviará una notificación cuando se cobre el siguiente mes. Para probar manualmente:

1. **Simula una notificación** usando el MCP de Mercado Pago o:
2. **Espera** a que Mercado Pago cobre automáticamente el siguiente mes

**Notificación esperada:**
```json
{
  "type": "subscription_preapproval",
  "entity": "preapproval",
  "action": "updated",
  "data": {
    "id": "subscription_id"
  }
}
```

**Resultado esperado:**
- ✅ El webhook recibe la notificación
- ✅ Obtiene información actualizada de la suscripción
- ✅ Renueva el plan automáticamente (actualiza `expires_at`)
- ✅ El plan sigue activo

**Verificar en logs:**
```bash
📥 Webhook de suscripción recibido
📋 Procesando notificación de suscripción (updated)
✅ Suscripción autorizada, actualizando fecha de expiración
✅ Plan renovado exitosamente
```

### Paso 4: Probar Cancelación

1. **Cambia a plan Free** desde la UI
2. O **cancela manualmente** la suscripción

**Resultado esperado:**
- ✅ La suscripción anterior se cancela en Mercado Pago
- ✅ El plan anterior se marca como `cancelled`
- ✅ Se crea un nuevo plan `free`

**Verificar en Supabase:**
```sql
SELECT 
  id,
  plan_type,
  status,
  mercadopago_subscription_id
FROM planes_uso_coach
WHERE coach_id = 'tu-coach-id'
ORDER BY created_at DESC;
```

---

## 🔍 Endpoints a Probar

### 1. Crear/Cambiar Plan
```
POST /api/coach/plan
Body: { "plan_type": "basico" }

Response:
{
  "success": true,
  "plan": {...},
  "subscription_id": "subscription_123",
  "requires_payment": true
}
```

### 2. Webhook de Suscripción
```
POST /api/payments/subscription-webhook
Body: {
  "type": "subscription_preapproval",
  "entity": "preapproval",
  "action": "updated",
  "data": {"id": "subscription_123"}
}

Response: 200 OK
```

### 3. Verificar Plan Actual
```
GET /api/coach/plan

Response:
{
  "success": true,
  "plan": {
    "id": "...",
    "plan_type": "basico",
    "mercadopago_subscription_id": "subscription_123",
    ...
  }
}
```

---

## 🐛 Troubleshooting

### Error: "No se pudo crear suscripción"

**Causa posible:** Access Token de Mercado Pago inválido o incorrecto

**Solución:**
1. Verifica `MERCADOPAGO_ACCESS_TOKEN` en Vercel
2. Asegúrate de usar un token de **PRUEBA** (empieza con `TEST-`)
3. Verifica que el token no haya expirado

### Error: "Webhook no recibe notificaciones"

**Causa posible:** Webhook no configurado o URL incorrecta

**Solución:**
1. Verifica la URL del webhook en Mercado Pago Dashboard
2. Asegúrate de que la URL sea: `https://omnia-app.vercel.app/api/payments/subscription-webhook`
3. Verifica que los topics estén configurados correctamente

### Error: "Plan no se renueva automáticamente"

**Causa posible:** Webhook no está procesando correctamente las notificaciones

**Solución:**
1. Verifica los logs del webhook en Vercel
2. Verifica que el `subscription_id` coincida en la BD
3. Prueba el webhook manualmente usando el MCP

---

## ✅ Checklist de Testing

- [ ] Migración SQL ejecutada
- [ ] Variables de entorno configuradas en Vercel
- [ ] Webhook configurado en Mercado Pago
- [ ] Puedo cambiar a plan de pago (Básico/Black/Premium)
- [ ] Se crea suscripción en Mercado Pago
- [ ] Puedo completar el primer pago
- [ ] El plan queda activo en la BD
- [ ] El webhook recibe notificaciones
- [ ] El plan se renueva automáticamente
- [ ] Puedo cancelar la suscripción
- [ ] El plan se cancela correctamente

---

## 📊 Monitoreo

### Logs en Vercel
- Ve a: Vercel Dashboard → Deployments → [Último Deploy] → Functions → Logs
- Busca mensajes con prefijos:
  - `📅 Creando suscripción`
  - `📥 Webhook de suscripción recibido`
  - `✅ Plan renovado exitosamente`

### Supabase
- Verifica la tabla `planes_uso_coach` periódicamente
- Verifica que `mercadopago_subscription_id` esté presente para planes de pago
- Verifica que `expires_at` se actualice cuando se renueva

### Mercado Pago Dashboard
- Ve a: https://www.mercadopago.com.ar/developers/panel/app
- Verifica las suscripciones creadas
- Verifica los pagos recurrentes procesados

