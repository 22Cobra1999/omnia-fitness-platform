# 🚀 Instrucciones: Configurar Mercado Pago Split Payment

## ✅ Lo que ya está hecho:

1. ✅ SDK instalado
2. ✅ Función de encriptación creada
3. ✅ Endpoints OAuth creados
4. ✅ Endpoint de preferencias creado
5. ✅ Webhook creado

---

## 📋 Pasos para completar la configuración:

### 1️⃣ Agregar Variables al .env.local

**Copia y pega esto al final de tu `.env.local`**:

```env
# ============================================
# MERCADO PAGO - Configuración Híbrida
# ============================================

# ✅ Credenciales de PRUEBA (para pagos en sandbox - seguro)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-cc6d31a8-ff84-4644-98dd-e05c6740d95e
MERCADOPAGO_ACCESS_TOKEN=TEST-1806894141402209-111615-607774a8d606f9a7200dc2e23b8e7b4d-143028270

# ✅ Credenciales de PRODUCCIÓN (para OAuth - funciona con cuentas de prueba)
MERCADOPAGO_CLIENT_ID=1806894141402209
MERCADOPAGO_CLIENT_SECRET=7dtInztF6aQwAGQCfWk2XGdMbWBd54QS

# URLs de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=http://localhost:3000/api/mercadopago/oauth/callback

# Clave de encriptación (para tokens OAuth)
ENCRYPTION_KEY=1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4
```

---

### 2️⃣ Ejecutar Migraciones SQL

Ve a **Supabase SQL Editor** y ejecuta en este orden:

1. **Primero**: Copia y ejecuta el contenido de `db/migrations/add-mercadopago-fields-to-banco.sql`
2. **Segundo**: Copia y ejecuta el contenido de `db/migrations/add-split-payment-tables.sql`

---

### 3️⃣ Configurar Redirect URI en Mercado Pago

1. Ve a tu panel de **Mercado Pago Developers**
2. Selecciona tu aplicación "Om Omnia in te"
3. Ve a **"Información general"**
4. Busca **"Redirect URI"** o **"URL de redirección"**
5. Agrega: `http://localhost:3000/api/mercadopago/oauth/callback`
6. **Para producción**, también agrega: `https://tu-app.vercel.app/api/mercadopago/oauth/callback`

---

### 4️⃣ Configurar Webhook en Mercado Pago

1. En el panel de Mercado Pago, ve a **"Webhooks"** o **"Notificaciones"**
2. Agrega la URL: `https://tu-app.vercel.app/api/payments/webhook`
3. Selecciona los eventos: `payment`

---

### 5️⃣ Reiniciar el servidor

```bash
npm run dev
```

---

## 🧪 Probar la integración

### Paso 1: Autorizar como Coach

1. Login como coach (usuario `ronaldinho` en cuenta de prueba)
2. Ve a la página de configuración del coach
3. Haz click en "Conectar con Mercado Pago"
4. Autoriza en Mercado Pago
5. Deberías ser redirigido de vuelta con `?mp_auth=success`

### Paso 2: Crear un pago

1. Login como cliente (usuario `totti1` en cuenta de prueba)
2. Busca una actividad del coach que autorizó
3. Haz click en "Comprar"
4. Deberías ser redirigido a Mercado Pago para pagar

### Paso 3: Verificar Split Payment

1. Después del pago, verifica en la tabla `banco`:
   - `marketplace_fee` debería tener la comisión de OMNIA
   - `seller_amount` debería tener el monto para el coach
   - `mercadopago_status` debería ser `approved`

---

## 📁 Archivos Creados

- `lib/utils/encryption.ts` - Encriptación de tokens
- `app/api/mercadopago/oauth/authorize/route.ts` - Inicia OAuth
- `app/api/mercadopago/oauth/callback/route.ts` - Callback OAuth
- `app/api/payments/create-preference/route.ts` - Crea preferencia con split
- `app/api/payments/webhook/route.ts` - Recibe notificaciones

---

## ⚠️ Importante

- Las credenciales de prueba (`TEST-xxx`) son seguras, no cobran dinero real
- El webhook solo funcionará en producción (Vercel)
- Para desarrollo, puedes probar el flujo OAuth y la creación de preferencias
- Los pagos de prueba no activarán el webhook automáticamente

---

## ❓ ¿Problemas?

Si algo no funciona:
1. Verifica que todas las variables estén en `.env.local`
2. Verifica que las migraciones SQL se ejecutaron correctamente
3. Verifica que el Redirect URI esté configurado en Mercado Pago
4. Revisa los logs del servidor para errores

---

## 📚 Documentación Adicional

- `docs/MERCADO_PAGO_SETUP_COMPLETO.md` - Guía completa
- `docs/MERCADO_PAGO_SPLIT_PAYMENT.md` - Documentación técnica
- `docs/MERCADO_PAGO_PASOS_INMEDIATOS.md` - Pasos detallados















