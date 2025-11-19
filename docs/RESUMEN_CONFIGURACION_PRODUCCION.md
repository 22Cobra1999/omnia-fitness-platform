# 📋 Resumen: Configuración de Mercado Pago para Producción

## ⚠️ ACCIONES REQUERIDAS ANTES DE PROBAR EN PRODUCCIÓN

### 1. 🔴 CRÍTICO: Ejecutar Migraciones SQL

Ejecuta estas migraciones en Supabase SQL Editor **EN ESTE ORDEN**:

1. **`make-enrollment-optional-in-banco.sql`**:
   - Hace `enrollment_id` nullable en `banco`
   - Agrega `activity_id` y `client_id` a `banco`

2. **`fill-missing-banco-data.sql`** (opcional, solo si hay registros antiguos):
   - Rellena datos faltantes en registros existentes

### 2. 🔴 CRÍTICO: Variables de Entorno en Vercel

Verifica que estas variables estén configuradas en **Vercel → Settings → Environment Variables**:

```env
# PRODUCCIÓN (obligatorias)
MERCADOPAGO_CLIENT_ID=1806894141402209
MERCADOPAGO_CLIENT_SECRET=7dtInztF6aQwAGQCfWk2XGdMbWBd54QS
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-9ed1ca79-fa3c-4328-9b09-eee5dea88a8e
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1806894141402209-111615-c8eb49a21685ec57eb24b443f0ac72ea-143028270

# URLs de Producción
NEXT_PUBLIC_APP_URL=https://omnia-app.vercel.app
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=https://omnia-app.vercel.app/api/mercadopago/oauth/callback

# Encriptación
ENCRYPTION_KEY=1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4
```

⚠️ **IMPORTANTE**: 
- Todas las credenciales deben ser de **PRODUCCIÓN** (empiezan con `APP_USR-`)
- NO mezclar credenciales de prueba con producción

### 3. 🔴 CRÍTICO: Configurar en Mercado Pago Developers

#### A. Redirect URI:
1. Ve a: https://www.mercadopago.com.ar/developers/panel/app
2. Selecciona tu aplicación "Om Omnia in te"
3. Ve a **"Información general"**
4. En **"Redirect URI"**, agrega:
   ```
   https://omnia-app.vercel.app/api/mercadopago/oauth/callback
   ```
5. Guarda los cambios

#### B. Webhook:
1. En el mismo panel, ve a **"Webhooks"** o **"Notificaciones"**
2. Configura la URL:
   ```
   https://omnia-app.vercel.app/api/payments/webhook
   ```
3. Selecciona el topic: **`payment`**
4. Guarda los cambios

### 4. 🟡 IMPORTANTE: Verificar Código

#### Problema detectado en `create-with-mercadopago/route.ts`:

En la línea 168, el `external_reference` todavía usa `enrollment_${enrollment.id}`, pero ahora NO se crea el enrollment hasta que el pago sea aprobado.

**Solución**: Ya está corregido en el código actual (usa `pending_${activityId}_${clientId}_${Date.now()}`).

### 5. 🟡 IMPORTANTE: Verificar Flujo Completo

#### Flujo Esperado:

1. **Cliente compra**:
   - Cliente selecciona actividad → Mercado Pago
   - Se crea preferencia con split payment
   - Se guarda en `banco` con `activity_id` y `client_id` (sin `enrollment_id`)
   - Cliente es redirigido a Mercado Pago

2. **Cliente paga**:
   - Cliente completa el pago en Mercado Pago
   - Mercado Pago redirige a `/payment/success` o `/payment/failure`

3. **Webhook procesa**:
   - Mercado Pago envía webhook a `/api/payments/webhook`
   - Si pago aprobado: se crea `activity_enrollments` con status `activa`
   - Se actualiza `banco` con `enrollment_id`
   - Si es programa: se duplican los detalles

4. **Cliente accede**:
   - Cliente puede ver su actividad en "Mis Actividades"
   - Cliente puede comenzar la actividad

---

## ✅ Lo que YA está implementado:

1. ✅ Endpoints OAuth (authorize, callback)
2. ✅ Endpoint de creación de preferencia con split payment
3. ✅ Webhook para procesar pagos
4. ✅ Encriptación de tokens OAuth
5. ✅ Páginas de éxito/fallo/pendiente
6. ✅ Componente de conexión de Mercado Pago para coaches
7. ✅ Flujo de compra con redirección a Mercado Pago
8. ✅ Creación de enrollment solo cuando el pago es aprobado

---

## 🧪 Testing en Producción

### Pasos para Probar:

1. **Conectar cuenta de coach**:
   - Login como coach
   - Ir a perfil → "Conectar con Mercado Pago"
   - Autorizar con cuenta real de Mercado Pago
   - Verificar que se guardan las credenciales

2. **Comprar como cliente**:
   - Login como cliente
   - Seleccionar actividad del coach conectado
   - Seleccionar Mercado Pago como método de pago
   - Completar el pago en Mercado Pago
   - Verificar redirección a página de éxito

3. **Verificar webhook**:
   - Revisar logs de Vercel para ver si el webhook se recibió
   - Verificar que se creó el enrollment en la base de datos
   - Verificar que el cliente puede acceder a la actividad

4. **Verificar split payment**:
   - Revisar cuenta de Mercado Pago del coach (debe recibir `seller_amount`)
   - Revisar cuenta de Mercado Pago de OMNIA (debe recibir `marketplace_fee`)

---

## 🔍 Verificaciones con MCP Mercado Pago

### Usar estas herramientas:

1. **`mcp_mercadopago-mcp-server-test_save_webhook`**:
   - Configurar webhook en producción
   - URL: `https://omnia-app.vercel.app/api/payments/webhook`
   - Topics: `["payment"]`

2. **`mcp_mercadopago-mcp-server-test_notifications_history`**:
   - Verificar historial de notificaciones
   - Detectar problemas de entrega

3. **`mcp_mercadopago-mcp-server-test_simulate_webhook`**:
   - Simular webhook para testing
   - Verificar que el endpoint responde correctamente

---

## ⚠️ Problemas Conocidos y Soluciones

### Error: "Una de las partes con la que intentás hacer el pago es de prueba"
**Causa**: Mezcla de credenciales de prueba y producción  
**Solución**: Asegurarse de que TODAS las credenciales sean de producción

### Error: "La aplicación no está preparada para conectarse a Mercado Pago"
**Causa**: Redirect URI no configurado  
**Solución**: Agregar la URL en el panel de Mercado Pago Developers

### Error: Webhook no recibe notificaciones
**Causa**: URL del webhook no configurada o incorrecta  
**Solución**: 
1. Configurar webhook en Mercado Pago
2. Verificar que la URL sea accesible públicamente
3. Verificar logs de Vercel

### Error: Enrollment no se crea después del pago
**Causa**: 
- Webhook no procesa correctamente
- Falta `activity_id` o `client_id` en `banco`
- Error al crear el enrollment

**Solución**: 
1. Verificar logs del webhook en Vercel
2. Ejecutar `fill-missing-banco-data.sql` si hay registros antiguos
3. Verificar que el webhook recibe y procesa correctamente

---

## 📝 Checklist Final

Antes de probar en producción, verifica:

- [ ] Migraciones SQL ejecutadas
- [ ] Variables de entorno configuradas en Vercel
- [ ] Redirect URI configurado en Mercado Pago
- [ ] Webhook configurado en Mercado Pago
- [ ] Todas las credenciales son de producción
- [ ] Coach tiene cuenta de Mercado Pago conectada
- [ ] URLs de producción son correctas (HTTPS)

---

## 🚀 Siguiente Paso

Una vez completado este checklist, puedes probar el flujo completo en producción con una compra real.

**Fecha de verificación**: ___________  
**Verificado por**: ___________

