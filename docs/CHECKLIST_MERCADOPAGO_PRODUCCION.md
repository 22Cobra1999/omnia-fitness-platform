# ✅ Checklist Completo: Mercado Pago en Producción

## 🎯 Objetivo
Verificar que todo esté configurado correctamente para procesar pagos reales con Mercado Pago, incluyendo split payment, webhooks, y redirecciones.

---

## 1️⃣ Variables de Entorno (Producción)

### ✅ Variables Requeridas en Vercel/Producción:

```env
# Credenciales de PRODUCCIÓN (obligatorias para pagos reales)
MERCADOPAGO_CLIENT_ID=1806894141402209
MERCADOPAGO_CLIENT_SECRET=7dtInztF6aQwAGQCfWk2XGdMbWBd54QS
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-9ed1ca79-fa3c-4328-9b09-eee5dea88a8e
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1806894141402209-111615-c8eb49a21685ec57eb24b443f0ac72ea-143028270

# URLs de Producción
NEXT_PUBLIC_APP_URL=https://omnia-app.vercel.app
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=https://omnia-app.vercel.app/api/mercadopago/oauth/callback

# Clave de encriptación (debe ser la misma en todos los entornos)
ENCRYPTION_KEY=1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4
```

### ⚠️ Verificaciones:
- [ ] Todas las variables están configuradas en Vercel (Settings → Environment Variables)
- [ ] `MERCADOPAGO_ACCESS_TOKEN` es de PRODUCCIÓN (empieza con `APP_USR-`)
- [ ] `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` es de PRODUCCIÓN (empieza con `APP_USR-`)
- [ ] `NEXT_PUBLIC_APP_URL` apunta a la URL de producción (HTTPS)
- [ ] `NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI` coincide con la URL configurada en Mercado Pago

---

## 2️⃣ Configuración en Mercado Pago Developers

### ✅ Panel de Mercado Pago:

1. **Aplicación "Om Omnia in te"**:
   - [ ] La aplicación está en modo **PRODUCCIÓN**
   - [ ] Tipo de aplicación: **Marketplace** o **Checkout API**

2. **Redirect URI**:
   - [ ] URL configurada: `https://omnia-app.vercel.app/api/mercadopago/oauth/callback`
   - [ ] La URL está en la lista de Redirect URIs permitidas
   - [ ] La URL usa HTTPS (obligatorio en producción)

3. **Webhooks**:
   - [ ] URL del webhook configurada: `https://omnia-app.vercel.app/api/payments/webhook`
   - [ ] Topics suscritos: `payment` (obligatorio)
   - [ ] El webhook está activo

4. **Credenciales de Producción**:
   - [ ] Public Key copiada (empieza con `APP_USR-`)
   - [ ] Access Token copiado (empieza con `APP_USR-`)
   - [ ] Client ID copiado
   - [ ] Client Secret copiado

---

## 3️⃣ Base de Datos (Supabase)

### ✅ Tablas Requeridas:

#### Tabla `banco`:
- [ ] Existe la tabla `banco`
- [ ] Tiene columna `enrollment_id` (nullable)
- [ ] Tiene columnas `activity_id` y `client_id`
- [ ] Tiene columnas de Mercado Pago:
  - `mercadopago_payment_id`
  - `mercadopago_preference_id`
  - `mercadopago_status`
  - `marketplace_fee`
  - `seller_amount`
  - `coach_mercadopago_user_id`
  - `coach_access_token_encrypted`
- [ ] Ejecutada migración: `make-enrollment-optional-in-banco.sql`

#### Tabla `coach_mercadopago_credentials`:
- [ ] Existe la tabla
- [ ] Tiene columnas:
  - `coach_id` (UUID, FK a auth.users)
  - `mercadopago_user_id` (TEXT)
  - `access_token_encrypted` (TEXT)
  - `refresh_token_encrypted` (TEXT)
  - `oauth_authorized` (BOOLEAN)
  - `token_expires_at` (TIMESTAMPTZ)
- [ ] Ejecutada migración: `add-split-payment-tables.sql`

#### Tabla `activity_enrollments`:
- [ ] Existe la tabla
- [ ] Tiene columnas: `id`, `activity_id`, `client_id`, `status`
- [ ] Status puede ser: `pendiente`, `activa`, `finalizada`, `pausada`, `cancelada`

### ✅ Funciones SQL:
- [ ] Existe función `calculate_marketplace_commission`
- [ ] Existe función `duplicate_program_details_on_enrollment` (si usas programas)

---

## 4️⃣ Endpoints API

### ✅ Endpoints Requeridos:

1. **OAuth - Autorización**:
   - [ ] `GET /api/mercadopago/oauth/authorize`
   - [ ] Recibe `coach_id` como query param
   - [ ] Redirige a Mercado Pago con `prompt=login` y `force_login=true`

2. **OAuth - Callback**:
   - [ ] `GET /api/mercadopago/oauth/callback`
   - [ ] Intercambia código por tokens
   - [ ] Encripta y guarda tokens en `coach_mercadopago_credentials`
   - [ ] Redirige a `/?tab=profile&mp_auth=success`

3. **Crear Preferencia**:
   - [ ] `POST /api/enrollments/create-with-mercadopago`
   - [ ] Verifica que el coach tenga Mercado Pago configurado
   - [ ] Calcula comisión de marketplace
   - [ ] Crea preferencia con `marketplace_fee`
   - [ ] Guarda en `banco` con `activity_id` y `client_id` (sin `enrollment_id`)
   - [ ] Retorna `initPoint` para redirigir al cliente

4. **Webhook**:
   - [ ] `POST /api/payments/webhook`
   - [ ] Recibe notificaciones de Mercado Pago
   - [ ] Actualiza `banco` con datos del pago
   - [ ] Si pago aprobado: crea `activity_enrollments` y duplica detalles del programa
   - [ ] Si pago rechazado: no crea enrollment

5. **User Info**:
   - [ ] `GET /api/mercadopago/user-info`
   - [ ] Retorna información del coach conectado

6. **Disconnect**:
   - [ ] `POST /api/mercadopago/disconnect`
   - [ ] Desconecta la cuenta de Mercado Pago del coach

---

## 5️⃣ Flujo de Compra Completo

### ✅ Flujo Cliente:

1. **Selección de Producto**:
   - [ ] Cliente selecciona una actividad
   - [ ] Modal de compra muestra solo Mercado Pago como opción
   - [ ] Cliente hace clic en "Comprar"

2. **Creación de Preferencia**:
   - [ ] Se llama a `/api/enrollments/create-with-mercadopago`
   - [ ] Se verifica que el coach tenga Mercado Pago configurado
   - [ ] Se crea la preferencia con split payment
   - [ ] Se guarda en `banco` (sin `enrollment_id` todavía)

3. **Redirección a Mercado Pago**:
   - [ ] Cliente es redirigido a `initPoint` de Mercado Pago
   - [ ] Cliente completa el pago en Mercado Pago
   - [ ] Mercado Pago redirige a `/payment/success`, `/payment/failure`, o `/payment/pending`

4. **Webhook**:
   - [ ] Mercado Pago envía webhook a `/api/payments/webhook`
   - [ ] Si pago aprobado: se crea `activity_enrollments` con status `activa`
   - [ ] Se actualiza `banco` con `enrollment_id`
   - [ ] Si es programa: se duplican los detalles

5. **Confirmación**:
   - [ ] Cliente ve página de éxito
   - [ ] Cliente puede acceder a su actividad comprada

### ✅ Flujo Coach:

1. **Conexión de Cuenta**:
   - [ ] Coach va a su perfil
   - [ ] Hace clic en "Conectar con Mercado Pago"
   - [ ] Se abre ventana de Mercado Pago
   - [ ] Coach autoriza a OMNIA
   - [ ] Se guardan credenciales encriptadas

2. **Recepción de Pagos**:
   - [ ] Coach recibe el dinero en su cuenta de Mercado Pago
   - [ ] OMNIA recibe la comisión (`marketplace_fee`)
   - [ ] Coach puede ver transacciones en su perfil

---

## 6️⃣ Split Payment

### ✅ Configuración:

- [ ] La preferencia se crea con `marketplace_fee` (comisión de OMNIA)
- [ ] El `seller_amount` se calcula como `totalAmount - marketplaceFee`
- [ ] El coach usa su propio `access_token` para crear la preferencia
- [ ] OMNIA usa su `MERCADOPAGO_ACCESS_TOKEN` como marketplace

### ⚠️ Importante:
- En producción, **todas las partes** (coach, marketplace, comprador) deben usar credenciales de **PRODUCCIÓN**
- No mezclar credenciales de prueba con producción

---

## 7️⃣ Seguridad

### ✅ Verificaciones:

- [ ] Los tokens OAuth están encriptados en la base de datos
- [ ] `ENCRYPTION_KEY` está configurada y es segura
- [ ] Los endpoints de OAuth verifican que el `coach_id` coincida con el usuario autenticado
- [ ] El webhook valida que el pago existe en Mercado Pago antes de procesarlo
- [ ] Las variables de entorno sensibles no están en el código

---

## 8️⃣ Testing en Producción

### ✅ Checklist de Prueba:

1. **Conexión de Coach**:
   - [ ] Coach puede conectar su cuenta de Mercado Pago
   - [ ] Se guardan las credenciales correctamente
   - [ ] Se muestra la información del coach en el perfil

2. **Compra de Cliente**:
   - [ ] Cliente puede seleccionar Mercado Pago como método de pago
   - [ ] Se crea la preferencia correctamente
   - [ ] Cliente es redirigido a Mercado Pago
   - [ ] Cliente puede completar el pago
   - [ ] Cliente es redirigido de vuelta a Omnia

3. **Webhook**:
   - [ ] El webhook recibe la notificación de Mercado Pago
   - [ ] Se crea el enrollment cuando el pago es aprobado
   - [ ] Se actualiza `banco` con los datos del pago
   - [ ] El cliente puede acceder a su actividad

4. **Split Payment**:
   - [ ] El coach recibe el dinero en su cuenta de Mercado Pago
   - [ ] OMNIA recibe la comisión
   - [ ] Los montos son correctos

---

## 9️⃣ Migraciones SQL Pendientes

### ⚠️ Ejecutar en Supabase SQL Editor:

1. **Hacer enrollment_id opcional**:
   ```sql
   -- Ejecutar: db/migrations/make-enrollment-optional-in-banco.sql
   ```

2. **Rellenar datos faltantes** (si hay registros antiguos):
   ```sql
   -- Ejecutar: db/migrations/fill-missing-banco-data.sql
   ```

---

## 🔟 Documentación MCP Mercado Pago

### ✅ Verificaciones con MCP:

- [ ] Usar `mcp_mercadopago-mcp-server-test_quality_checklist` para verificar calidad
- [ ] Usar `mcp_mercadopago-mcp-server-test_notifications_history` para verificar webhooks
- [ ] Usar `mcp_mercadopago-mcp-server-test_save_webhook` para configurar webhook
- [ ] Usar `mcp_mercadopago-mcp-server-test_simulate_webhook` para probar webhooks

---

## 📋 Resumen de URLs Importantes

### Producción:
- **App URL**: `https://omnia-app.vercel.app`
- **OAuth Redirect**: `https://omnia-app.vercel.app/api/mercadopago/oauth/callback`
- **Webhook URL**: `https://omnia-app.vercel.app/api/payments/webhook`
- **Success Page**: `https://omnia-app.vercel.app/payment/success`
- **Failure Page**: `https://omnia-app.vercel.app/payment/failure`
- **Pending Page**: `https://omnia-app.vercel.app/payment/pending`

---

## ⚠️ Problemas Comunes y Soluciones

### Error: "Una de las partes con la que intentás hacer el pago es de prueba"
- **Causa**: Mezcla de credenciales de prueba y producción
- **Solución**: Asegurarse de que todas las credenciales sean de producción

### Error: "La aplicación no está preparada para conectarse a Mercado Pago"
- **Causa**: Redirect URI no configurado en Mercado Pago
- **Solución**: Agregar la URL en el panel de Mercado Pago Developers

### Error: Webhook no recibe notificaciones
- **Causa**: URL del webhook no configurada o incorrecta
- **Solución**: Configurar webhook en Mercado Pago y verificar que la URL sea accesible

### Error: Enrollment no se crea después del pago
- **Causa**: Webhook no procesa correctamente o falta `activity_id`/`client_id` en `banco`
- **Solución**: Verificar logs del webhook y ejecutar `fill-missing-banco-data.sql`

---

## ✅ Estado Final

Una vez completado este checklist, el sistema debería estar listo para procesar pagos reales en producción.

**Última verificación**: ___________ (fecha)
**Verificado por**: ___________ (nombre)

