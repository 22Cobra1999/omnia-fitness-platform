# ✅ Configuración Completa de Mercado Pago Split Payment

## 🎯 Estado Actual

### ✅ Completado:
1. ✅ SDK instalado (`mercadopago` y `@mercadopago/sdk-react`)
2. ✅ Función de encriptación creada (`lib/utils/encryption.ts`)
3. ✅ Endpoints OAuth creados:
   - `GET /api/mercadopago/oauth/authorize` - Inicia flujo OAuth
   - `GET /api/mercadopago/oauth/callback` - Callback OAuth
4. ✅ Endpoint de preferencias creado:
   - `POST /api/payments/create-preference` - Crea preferencia con split payment
5. ✅ Webhook creado:
   - `POST /api/payments/webhook` - Recibe notificaciones de Mercado Pago

---

## 📋 Próximos Pasos

### 1️⃣ Agregar Variables al .env.local

Agrega estas líneas a tu `.env.local`:

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

En Supabase SQL Editor, ejecuta en este orden:

1. **Primero**: `db/migrations/add-mercadopago-fields-to-banco.sql`
2. **Segundo**: `db/migrations/add-split-payment-tables.sql`

---

### 3️⃣ Configurar Redirect URI en Mercado Pago

En el panel de Mercado Pago Developers:
1. Ve a **"Información general"** de tu aplicación
2. Busca **"Redirect URI"** o **"URL de redirección"**
3. Agrega: `http://localhost:3000/api/mercadopago/oauth/callback`
4. Para producción, también agrega: `https://tu-app.vercel.app/api/mercadopago/oauth/callback`

---

### 4️⃣ Configurar Webhook en Mercado Pago

En el panel de Mercado Pago Developers:
1. Ve a **"Webhooks"** o **"Notificaciones"**
2. Agrega la URL: `https://tu-app.vercel.app/api/payments/webhook`
3. Selecciona los eventos: `payment`

---

### 5️⃣ Crear UI para Autorización OAuth

Necesitas crear un componente para que los coaches autoricen Mercado Pago.

**Ejemplo de botón**:
```tsx
<button onClick={() => {
  window.location.href = `/api/mercadopago/oauth/authorize?coach_id=${coachId}`;
}}>
  Conectar con Mercado Pago
</button>
```

---

## 🔄 Flujo Completo

### 1. Coach autoriza OMNIA (OAuth)
```
Coach → Click "Conectar Mercado Pago"
  ↓
GET /api/mercadopago/oauth/authorize?coach_id=xxx
  ↓
Redirige a Mercado Pago
  ↓
Coach autoriza
  ↓
GET /api/mercadopago/oauth/callback?code=xxx&state=coach_id
  ↓
Guarda credenciales en coach_mercadopago_credentials
  ↓
Redirige a /coach/settings?mp_auth=success
```

### 2. Cliente compra actividad
```
Cliente → Click "Comprar"
  ↓
POST /api/payments/create-preference
  {
    enrollmentId: 123,
    activityId: 456
  }
  ↓
Crea preferencia con marketplace_fee
  ↓
Retorna initPoint (URL de checkout)
  ↓
Cliente redirigido a Mercado Pago
  ↓
Cliente paga
  ↓
Mercado Pago divide automáticamente:
  - Comisión → OMNIA
  - Resto → Coach
```

### 3. Webhook notifica
```
Mercado Pago → POST /api/payments/webhook
  ↓
Actualiza banco con estado del pago
  ↓
Si aprobado → Activa enrollment
```

---

## 📝 Archivos Creados

1. `lib/utils/encryption.ts` - Encriptación de tokens
2. `app/api/mercadopago/oauth/authorize/route.ts` - Inicia OAuth
3. `app/api/mercadopago/oauth/callback/route.ts` - Callback OAuth
4. `app/api/payments/create-preference/route.ts` - Crea preferencia
5. `app/api/payments/webhook/route.ts` - Webhook

---

## ⚠️ Importante

1. **Variables de entorno**: Agrega todas las variables al `.env.local`
2. **Migraciones SQL**: Ejecuta las migraciones en Supabase
3. **Redirect URI**: Configura en Mercado Pago
4. **Webhook**: Configura en Mercado Pago (producción)
5. **UI**: Crea botón para que coaches autoricen

---

## 🧪 Probar con Cuentas de Prueba

### Cuentas disponibles:
- **ronaldinho** (Vendedor/Coach) - User ID: `2995219181`
- **totti1** (Comprador/Cliente) - User ID: `2992707264`
- **omniav1** (Integrador/OMNIA) - User ID: `2995219179`

### Flujo de prueba:
1. Login como coach (`ronaldinho`)
2. Autorizar Mercado Pago (OAuth)
3. Login como cliente (`totti1`)
4. Comprar actividad
5. Verificar split payment en banco

---

## ✅ Checklist Final

- [ ] Variables agregadas a `.env.local`
- [ ] Migraciones SQL ejecutadas
- [ ] Redirect URI configurado en Mercado Pago
- [ ] Webhook configurado en Mercado Pago (producción)
- [ ] UI creada para autorización OAuth
- [ ] Probado con cuentas de prueba















