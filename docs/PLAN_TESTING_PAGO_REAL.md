# 🧪 Plan de Testing: Pago Real con Mercado Pago

## ✅ Pre-requisitos (Verificar ANTES de probar)

### 1. Migraciones SQL Ejecutadas
- [ ] `make-enrollment-optional-in-banco.sql` - Ejecutada
- [ ] `fill-missing-banco-data.sql` - Ejecutada (si hay registros antiguos)

### 2. Variables de Entorno en Vercel
- [ ] `MERCADOPAGO_CLIENT_ID` - Configurada
- [ ] `MERCADOPAGO_CLIENT_SECRET` - Configurada
- [ ] `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` - Configurada (producción)
- [ ] `MERCADOPAGO_ACCESS_TOKEN` - Configurada (producción)
- [ ] `NEXT_PUBLIC_APP_URL` - `https://omnia-app.vercel.app`
- [ ] `NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI` - Configurada
- [ ] `ENCRYPTION_KEY` - Configurada

### 3. Configuración en Mercado Pago
- [ ] Redirect URI configurado: `https://omnia-app.vercel.app/api/mercadopago/oauth/callback`
- [ ] Webhook configurado: `https://omnia-app.vercel.app/api/payments/webhook`
- [ ] Topic `payment` seleccionado

---

## 🧪 Testing Paso a Paso

### Paso 1: Conectar Cuenta del Coach

1. **Login como Coach**:
   - Ir a: `https://omnia-app.vercel.app`
   - Iniciar sesión con cuenta de coach

2. **Conectar Mercado Pago**:
   - Ir a Perfil (tab de perfil)
   - Buscar sección "Cobros y Cuenta de MP"
   - Hacer clic en "Conectar con Mercado Pago"
   - Debe abrirse ventana de Mercado Pago
   - Iniciar sesión con cuenta REAL de Mercado Pago del coach
   - Autorizar a OMNIA

3. **Verificar Conexión**:
   - Debe redirigir a Omnia con `?mp_auth=success`
   - Debe mostrar información del coach (nombre, email, ID)
   - Debe mostrar estadísticas de pagos (si hay)

**✅ Verificación**:
- [ ] Se guardó en `coach_mercadopago_credentials`
- [ ] `oauth_authorized = true`
- [ ] Se muestra información del coach en la UI

---

### Paso 2: Crear/Verificar Actividad

1. **Verificar que existe una actividad**:
   - El coach debe tener al menos una actividad creada
   - La actividad debe tener un precio configurado

2. **Verificar que la actividad es pública**:
   - `is_public = true` en la tabla `activities`

**✅ Verificación**:
- [ ] Existe actividad con precio > 0
- [ ] Actividad es pública

---

### Paso 3: Compra como Cliente

1. **Login como Cliente**:
   - Cerrar sesión del coach
   - Iniciar sesión con cuenta de cliente

2. **Seleccionar Actividad**:
   - Buscar la actividad del coach conectado
   - Hacer clic en "Comprar" o ver detalles

3. **Seleccionar Mercado Pago**:
   - Debe aparecer solo Mercado Pago como opción
   - Hacer clic en "Comprar con Mercado Pago"

4. **Verificar Redirección**:
   - Debe redirigir a Mercado Pago
   - URL debe ser `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...`

**✅ Verificación**:
- [ ] Se creó registro en `banco` con:
  - `activity_id` ✅
  - `client_id` ✅
  - `enrollment_id = null` ✅
  - `mercadopago_preference_id` ✅
  - `payment_status = 'pending'` ✅
  - `marketplace_fee` calculado ✅
  - `seller_amount` calculado ✅

---

### Paso 4: Completar Pago en Mercado Pago

1. **En Mercado Pago**:
   - Completar el pago con tarjeta real
   - O usar método de pago disponible
   - Confirmar el pago

2. **Verificar Redirección**:
   - Debe redirigir a `/payment/success` o `/payment/failure`
   - Verificar que la URL tiene los parámetros correctos

**✅ Verificación**:
- [ ] Cliente es redirigido correctamente
- [ ] Se muestra mensaje de éxito/fallo

---

### Paso 5: Verificar Webhook

1. **Esperar Webhook** (puede tardar unos segundos):
   - Mercado Pago enviará webhook a `/api/payments/webhook`

2. **Verificar Logs de Vercel**:
   - Ir a: Vercel Dashboard → Proyecto → Deployments → Logs
   - Buscar logs con "📥 Webhook recibido"
   - Verificar que se procesó correctamente

3. **Verificar Base de Datos**:
   - Verificar que se actualizó `banco`:
     - `mercadopago_payment_id` ✅
     - `mercadopago_status = 'approved'` ✅
     - `payment_status = 'completed'` ✅
     - `enrollment_id` asignado ✅
   - Verificar que se creó `activity_enrollments`:
     - `status = 'activa'` ✅
     - `activity_id` correcto ✅
     - `client_id` correcto ✅

**✅ Verificación**:
- [ ] Webhook recibido (ver logs)
- [ ] `banco` actualizado correctamente
- [ ] `activity_enrollments` creado
- [ ] Si es programa: detalles duplicados

---

### Paso 6: Verificar Split Payment

1. **Verificar en Cuenta del Coach**:
   - Login en cuenta de Mercado Pago del coach
   - Verificar que recibió el dinero
   - Monto debe ser: `seller_amount` (precio - comisión)

2. **Verificar en Cuenta de OMNIA**:
   - Login en cuenta de Mercado Pago de OMNIA
   - Verificar que recibió la comisión
   - Monto debe ser: `marketplace_fee`

**✅ Verificación**:
- [ ] Coach recibió `seller_amount`
- [ ] OMNIA recibió `marketplace_fee`
- [ ] Montos coinciden con los calculados

---

### Paso 7: Verificar Acceso del Cliente

1. **Cliente accede a su actividad**:
   - Login como cliente
   - Ir a "Mis Actividades" o similar
   - Verificar que la actividad comprada aparece
   - Verificar que puede acceder a ella

2. **Verificar Estado**:
   - La actividad debe estar "activa"
   - El cliente debe poder comenzar la actividad

**✅ Verificación**:
- [ ] Actividad aparece en "Mis Actividades"
- [ ] Cliente puede acceder a la actividad
- [ ] Estado es "activa"

---

## 🔍 Verificaciones Adicionales

### Verificar con MCP Mercado Pago

1. **Historial de Notificaciones**:
   ```bash
   # Usar MCP para verificar historial
   mcp_mercadopago-mcp-server-test_notifications_history
   ```

2. **Simular Webhook** (si es necesario):
   ```bash
   # Simular webhook con payment_id real
   mcp_mercadopago-mcp-server-test_simulate_webhook
   ```

### Verificar en Base de Datos

```sql
-- Verificar registro en banco
SELECT * FROM banco 
WHERE mercadopago_payment_id IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar enrollment creado
SELECT ae.*, a.title, a.price 
FROM activity_enrollments ae
JOIN activities a ON ae.activity_id = a.id
WHERE ae.status = 'activa'
ORDER BY ae.created_at DESC
LIMIT 5;

-- Verificar split payment
SELECT 
  id,
  amount_paid,
  marketplace_fee,
  seller_amount,
  payment_status,
  mercadopago_status
FROM banco
WHERE payment_status = 'completed'
ORDER BY created_at DESC
LIMIT 5;
```

---

## ⚠️ Problemas Comunes y Soluciones

### Problema: Webhook no se recibe
**Solución**:
1. Verificar que el webhook esté configurado en Mercado Pago
2. Verificar que la URL sea accesible públicamente
3. Verificar logs de Vercel
4. Usar "Simular notificación" en Mercado Pago

### Problema: Enrollment no se crea
**Solución**:
1. Verificar logs del webhook
2. Verificar que `activity_id` y `client_id` estén en `banco`
3. Verificar que el pago fue aprobado (`mercadopago_status = 'approved'`)
4. Ejecutar `fill-missing-banco-data.sql` si es necesario

### Problema: Split payment no funciona
**Solución**:
1. Verificar que el coach tenga Mercado Pago conectado
2. Verificar que se use el `access_token` del coach
3. Verificar que `marketplace_fee` se calculó correctamente
4. Verificar que todas las credenciales sean de producción

---

## 📊 Checklist Final

- [ ] Coach conectó su cuenta de Mercado Pago
- [ ] Cliente puede seleccionar Mercado Pago como método de pago
- [ ] Cliente es redirigido a Mercado Pago
- [ ] Cliente completa el pago
- [ ] Cliente es redirigido de vuelta a Omnia
- [ ] Webhook se recibe y procesa correctamente
- [ ] Enrollment se crea en la base de datos
- [ ] Cliente puede acceder a su actividad
- [ ] Coach recibe el dinero (seller_amount)
- [ ] OMNIA recibe la comisión (marketplace_fee)

---

## 🎯 Resultado Esperado

Al completar este testing, deberías tener:
- ✅ Un pago real procesado exitosamente
- ✅ Enrollment creado automáticamente
- ✅ Split payment funcionando correctamente
- ✅ Cliente con acceso a su actividad
- ✅ Coach recibiendo su dinero
- ✅ OMNIA recibiendo su comisión

---

**Fecha de Testing**: ___________  
**Resultado**: ___________  
**Notas**: ___________

