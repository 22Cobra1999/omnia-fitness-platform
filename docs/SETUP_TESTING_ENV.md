# 🧪 Configuración del Entorno de Prueba - Suscripciones

## 📋 Checklist de Configuración

### 1. Variables de Entorno en Vercel (MODO PRUEBA)

Ve a **Vercel Dashboard → Settings → Environment Variables** y configura:

```env
# ============================================
# MERCADO PAGO - MODO PRUEBA (TESTING)
# ============================================

# ✅ Access Token de PRUEBA (obligatorio para suscripciones)
MERCADOPAGO_ACCESS_TOKEN=TEST-1806894141402209-111615-607774a8d606f9a7200dc2e23b8e7b4d-143028270

# ✅ Public Key de PRUEBA (para frontend)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-cc6d31a8-ff84-4644-98dd-e05c6740d95e

# ✅ Client ID y Secret (pueden ser de producción, funcionan con cuentas de prueba)
MERCADOPAGO_CLIENT_ID=1806894141402209
MERCADOPAGO_CLIENT_SECRET=7dtInztF6aQwAGQCfWk2XGdMbWBd54QS

# ✅ URLs de la aplicación (producción para webhooks)
NEXT_PUBLIC_APP_URL=https://omnia-app.vercel.app
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=https://omnia-app.vercel.app/api/mercadopago/oauth/callback

# ✅ Clave de encriptación (misma en todos los entornos)
ENCRYPTION_KEY=1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4
```

**⚠️ IMPORTANTE:**
- `MERCADOPAGO_ACCESS_TOKEN` **DEBE** empezar con `TEST-` para modo prueba
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` **DEBE** empezar con `TEST-` para modo prueba
- Las URLs deben apuntar a tu dominio de producción (Vercel) para que los webhooks funcionen

---

### 2. Ejecutar Migración SQL en Supabase

Ejecuta en **Supabase SQL Editor**:

```sql
-- Agregar campo para suscripciones
ALTER TABLE planes_uso_coach 
ADD COLUMN IF NOT EXISTS mercadopago_subscription_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_planes_uso_coach_subscription_id 
ON planes_uso_coach(mercadopago_subscription_id) 
WHERE mercadopago_subscription_id IS NOT NULL;

COMMENT ON COLUMN planes_uso_coach.mercadopago_subscription_id IS 'ID de la suscripción de Mercado Pago para cobro automático mensual';
```

---

### 3. Configurar Webhook en Mercado Pago (MODO PRUEBA)

1. Ve a: https://www.mercadopago.com.ar/developers/panel/app
2. Selecciona tu aplicación
3. Ve a **"Webhooks"** o **"Notificaciones"**
4. Agrega la URL del webhook:
   ```
   https://omnia-app.vercel.app/api/payments/subscription-webhook
   ```
5. Selecciona los topics:
   - ✅ `subscription_preapproval` (actualizaciones de suscripción)
   - ✅ `payment` (pagos recurrentes)
   - ✅ `subscription_authorized_payment` (pagos autorizados de suscripciones)

**Nota:** Aunque estés en modo prueba, el webhook debe apuntar a tu URL de producción (Vercel) para que funcione.

---

### 4. Verificar Credenciales de Prueba

#### Obtener Access Token de Prueba:

1. Ve a: https://www.mercadopago.com.ar/developers/panel/app
2. Selecciona tu aplicación
3. Ve a **"Credenciales de prueba"**
4. Copia el **Access Token** (debe empezar con `TEST-`)

#### Obtener Public Key de Prueba:

1. En la misma sección de **"Credenciales de prueba"**
2. Copia el **Public Key** (debe empezar con `TEST-`)

---

## 🧪 Cómo Probar

### Paso 1: Verificar que las Variables Estén Configuradas

Puedes verificar en los logs de Vercel que el sistema detecte correctamente el modo prueba:

```bash
# En los logs deberías ver:
✅ Token de prueba detectado. Modo testing activado.
```

### Paso 2: Crear una Suscripción de Prueba

1. Inicia sesión como coach
2. Ve a **Perfil** → **Mi Suscripción**
3. Selecciona un plan de pago (Básico, Black o Premium)
4. Haz clic en **"Cambiar a este plan"**

**Resultado esperado:**
- ✅ Se crea una suscripción en Mercado Pago (modo sandbox)
- ✅ Se muestra un enlace de pago (`init_point` o `sandbox_init_point`)
- ✅ El plan se crea en la BD con `mercadopago_subscription_id`

### Paso 3: Completar el Pago de Prueba

1. Sigue el enlace de pago generado
2. Usa una tarjeta de prueba de Mercado Pago:
   - **Tarjeta aprobada**: `5031 7557 3453 0604`
   - **CVV**: `123`
   - **Fecha**: Cualquier fecha futura
   - **Titular**: `APRO` (para aprobado)

**Resultado esperado:**
- ✅ El pago se procesa en modo sandbox
- ✅ La suscripción queda autorizada
- ✅ El plan queda activo

### Paso 4: Probar el Webhook

El webhook recibirá notificaciones cuando:
- Se actualice la suscripción
- Se procese un pago recurrente
- Se cancele la suscripción

Puedes simular una notificación usando el MCP de Mercado Pago o esperar a que Mercado Pago envíe una notificación real.

---

## 🔍 Verificación

### Verificar en Logs de Vercel:

```bash
# Busca estos mensajes en los logs:
📅 Creando suscripción de Mercado Pago
✅ Suscripción creada exitosamente
📥 Webhook de suscripción recibido
✅ Plan renovado exitosamente
```

### Verificar en Supabase:

```sql
-- Ver suscripciones creadas
SELECT 
  id,
  coach_id,
  plan_type,
  status,
  mercadopago_subscription_id,
  started_at,
  expires_at
FROM planes_uso_coach
WHERE mercadopago_subscription_id IS NOT NULL
ORDER BY created_at DESC;
```

### Verificar en Mercado Pago Dashboard:

1. Ve a: https://www.mercadopago.com.ar/developers/panel/app
2. Selecciona tu aplicación
3. Ve a **"Suscripciones"** o **"Preapprovals"**
4. Deberías ver las suscripciones creadas en modo sandbox

---

## ⚠️ Troubleshooting

### Error: "Access Token inválido"

**Causa:** El token no es de prueba o está mal configurado

**Solución:**
1. Verifica que `MERCADOPAGO_ACCESS_TOKEN` empiece con `TEST-`
2. Obtén un nuevo token de prueba desde el panel de Mercado Pago
3. Actualiza la variable en Vercel
4. Redespliega la aplicación

### Error: "Webhook no recibe notificaciones"

**Causa:** URL del webhook incorrecta o no configurada

**Solución:**
1. Verifica que la URL del webhook sea: `https://omnia-app.vercel.app/api/payments/subscription-webhook`
2. Verifica que los topics estén configurados correctamente
3. Prueba el webhook manualmente usando el MCP

### Error: "No se puede crear suscripción"

**Causa:** Credenciales incorrectas o falta de permisos

**Solución:**
1. Verifica que todas las variables de entorno estén configuradas
2. Verifica que el Access Token sea válido
3. Verifica los logs de Vercel para más detalles

---

## ✅ Checklist Final

- [ ] Variables de entorno configuradas en Vercel (modo prueba)
- [ ] Migración SQL ejecutada en Supabase
- [ ] Webhook configurado en Mercado Pago
- [ ] Access Token de prueba verificado (empieza con `TEST-`)
- [ ] Public Key de prueba verificado (empieza con `TEST-`)
- [ ] URLs de producción configuradas (para webhooks)
- [ ] Aplicación redesplegada en Vercel
- [ ] Prueba de creación de suscripción exitosa
- [ ] Prueba de pago de prueba exitosa
- [ ] Webhook recibiendo notificaciones

---

## 📝 Notas Importantes

1. **Modo Prueba vs Producción:**
   - En modo prueba, todos los pagos son simulados
   - No se cobran fondos reales
   - Las suscripciones funcionan igual que en producción, pero en sandbox

2. **Webhooks:**
   - Los webhooks deben apuntar a tu URL de producción (Vercel)
   - Funcionan tanto en modo prueba como en producción
   - Mercado Pago envía notificaciones reales incluso en modo sandbox

3. **Credenciales:**
   - `MERCADOPAGO_ACCESS_TOKEN` y `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` deben ser de prueba
   - `MERCADOPAGO_CLIENT_ID` y `MERCADOPAGO_CLIENT_SECRET` pueden ser de producción (funcionan con cuentas de prueba)

