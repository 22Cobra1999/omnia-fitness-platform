# 🧪 Guía de Testing - Mercado Pago Modo Prueba

## ✅ Estado Actual

- ✅ Variables `TEST_*` configuradas en Vercel
- ✅ Deploy realizado
- ✅ Código listo para usar modo prueba automáticamente

---

## 📋 Checklist Pre-Testing

Antes de probar, verifica que todo esté configurado:

### 1. ✅ Variables de Entorno en Vercel

Verifica en **Vercel Dashboard → Settings → Environment Variables** que existan:

- ✅ `TEST_MERCADOPAGO_ACCESS_TOKEN` (empieza con `TEST-`)
- ✅ `TEST_NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` (empieza con `TEST-`)
- ✅ `MERCADOPAGO_CLIENT_ID`
- ✅ `MERCADOPAGO_CLIENT_SECRET`
- ✅ `NEXT_PUBLIC_APP_URL` = `https://omnia-app.vercel.app`

### 2. ✅ Migración SQL Ejecutada

Verifica en **Supabase SQL Editor** que la columna existe:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'planes_uso_coach' 
AND column_name = 'mercadopago_subscription_id';
```

Debe retornar `mercadopago_subscription_id`.

### 3. ✅ Webhook Configurado en Mercado Pago

1. Ve a: https://www.mercadopago.com.ar/developers/panel/app
2. Selecciona tu aplicación
3. Ve a **"Webhooks"** o **"Notificaciones"**
4. Verifica que exista:
   - **URL**: `https://omnia-app.vercel.app/api/payments/subscription-webhook`
   - **Topics**: `subscription_preapproval`, `payment`

---

## 🚀 Flujo de Testing: Suscripción de Plan

### Paso 1: Seleccionar un Plan Pagado

1. Ve a: https://omnia-app.vercel.app
2. Inicia sesión como **coach**
3. Ve a **"Mi Perfil"** o **"Mi Suscripción"**
4. Selecciona un plan pagado:
   - **Básico** ($12,000 ARS/mes)
   - **Black** ($22,000 ARS/mes)
   - **Premium** ($35,000 ARS/mes)

### Paso 2: Redirección a Mercado Pago

1. Al seleccionar el plan, deberías ser redirigido a **Mercado Pago Sandbox**
2. La URL debería ser algo como: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...`
3. **✅ Verifica en los logs de Vercel** que aparezca:
   ```
   📅 Creando suscripción de Mercado Pago (MODO PRUEBA)
   ✅ Suscripción creada exitosamente
   mode: PRUEBA
   ```

### Paso 3: Probar Pago con Tarjeta de Prueba

En la página de Mercado Pago Sandbox:

#### Tarjetas de Prueba Aprobadas

| Tarjeta | Número | CVV | Fecha | Nombre |
|---------|--------|-----|-------|--------|
| **Visa** | `4509 9535 6623 3704` | `123` | Cualquier fecha futura | Cualquier nombre |
| **Mastercard** | `5031 7557 3453 0604` | `123` | Cualquier fecha futura | Cualquier nombre |
| **American Express** | `3753 651535 56885` | `1234` | Cualquier fecha futura | Cualquier nombre |

#### Información de Prueba

- **Email**: Cualquier email válido (ej: `test@test.com`)
- **DNI/CUIL**: Cualquier número (ej: `12345678`)
- **Nombre**: Cualquier nombre
- **Teléfono**: Cualquier número argentino (ej: `1123456789`)

#### Probar Pago Exitoso

1. Ingresa una de las tarjetas aprobadas
2. Completa todos los campos
3. Haz clic en **"Pagar"**
4. Deberías ver: **"¡Pago aprobado!"** (en sandbox)

### Paso 4: Verificar Redirección y Estado

1. Después del pago exitoso, deberías ser redirigido a:
   - `https://omnia-app.vercel.app/payment/subscription-success`
   
2. **✅ Verifica en Supabase**:
   ```sql
   SELECT 
     id, coach_id, plan_type, status, 
     mercadopago_subscription_id,
     started_at, expires_at
   FROM planes_uso_coach 
   WHERE coach_id = 'TU_COACH_ID'
   ORDER BY created_at DESC
   LIMIT 1;
   ```
   
   Debe mostrar:
   - `status` = `'active'`
   - `mercadopago_subscription_id` con un ID (ej: `2c9380849c3e4548019c3e1234567890`)
   - `started_at` y `expires_at` configurados

3. **✅ Verifica en los logs de Vercel**:
   - Debe aparecer un webhook recibido
   - El webhook debería procesar la suscripción correctamente

---

## 🔍 Verificar Webhook

### Ver Logs de Vercel

1. Ve a: **Vercel Dashboard → Deployments**
2. Selecciona el último deploy
3. Ve a **"Functions"** o **"Logs"**
4. Busca logs que contengan:
   ```
   📥 Webhook de suscripción recibido
   ✅ Info de suscripción de MP
   ✅ Estado del plan actualizado
   ```

### Probar Webhook Manualmente (Opcional)

Puedes simular un webhook usando el MCP de Mercado Pago:

1. Obtén el `subscription_id` de la suscripción creada
2. Usa la herramienta de simulación de webhook del MCP
3. Verifica que el webhook se procese correctamente

---

## 📊 Verificar Modo Prueba Activo

### En los Logs de Vercel

Busca en los logs de función estos mensajes:

```
📅 Creando suscripción de Mercado Pago (MODO PRUEBA)
✅ Suscripción creada exitosamente:
{
  id: "...",
  status: "pending",
  init_point: "...",
  mode: "PRUEBA"
}
```

Si ves `MODO PRUEBA` o `PRUEBA`, significa que está funcionando correctamente.

### En el Código

El código detecta automáticamente modo prueba si:
- Existe `TEST_MERCADOPAGO_ACCESS_TOKEN` O
- El `accessToken` empieza con `TEST-`

---

## 🐛 Solución de Problemas

### Problema: "No se redirige a Mercado Pago"

**Solución:**
1. Verifica que las variables `TEST_*` estén configuradas en Vercel
2. Verifica que el deploy esté completo
3. Revisa los logs de Vercel para ver errores

### Problema: "Error creando suscripción"

**Solución:**
1. Verifica en los logs de Vercel el error específico
2. Asegúrate de que `TEST_MERCADOPAGO_ACCESS_TOKEN` sea válido
3. Verifica que el email del coach esté configurado

### Problema: "Webhook no se recibe"

**Solución:**
1. Verifica que el webhook esté configurado en Mercado Pago
2. La URL debe ser: `https://omnia-app.vercel.app/api/payments/subscription-webhook`
3. Los topics deben incluir: `subscription_preapproval`, `payment`

### Problema: "Plan no se actualiza después del pago"

**Solución:**
1. Verifica que el webhook se esté recibiendo (logs de Vercel)
2. Verifica que `mercadopago_subscription_id` esté guardado en la base de datos
3. Verifica que el webhook esté procesando correctamente la actualización

---

## ✅ Checklist de Testing Completo

- [ ] Variables `TEST_*` configuradas en Vercel
- [ ] Deploy completado sin errores
- [ ] Migración SQL ejecutada
- [ ] Webhook configurado en Mercado Pago
- [ ] Redirección a Mercado Pago Sandbox funciona
- [ ] Pago con tarjeta de prueba exitoso
- [ ] Plan creado en base de datos con `mercadopago_subscription_id`
- [ ] Webhook recibido y procesado correctamente
- [ ] Estado del plan actualizado a `active`
- [ ] Logs muestran "MODO PRUEBA"

---

## 📝 Notas Importantes

1. **Modo Prueba vs Producción:**
   - Con variables `TEST_*` configuradas, siempre usará modo prueba
   - Los pagos son **simulados** (no se cobran dinero real)
   - Puedes probar sin miedo

2. **Tarjetas de Prueba:**
   - Solo funcionan en **sandbox** de Mercado Pago
   - No funcionan en producción
   - Son específicas para testing

3. **Webhooks:**
   - Los webhooks de prueba pueden tener pequeñas diferencias con producción
   - Los tiempos de respuesta pueden variar
   - Verifica siempre en los logs

---

## 🎯 Próximos Pasos

Después de verificar que todo funciona en modo prueba:

1. ✅ Probar diferentes planes (Básico, Black, Premium)
2. ✅ Probar diferentes tarjetas (Visa, Mastercard, Amex)
3. ✅ Verificar renovación mensual automática
4. ✅ Probar cancelación de suscripción
5. ✅ Verificar webhooks en diferentes escenarios

---

**¡Listo para probar! 🚀**

