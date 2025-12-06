# 📝 Configuración Completa de .env.local para Mercado Pago

## ✅ Agrega estas líneas a tu .env.local

Copia y pega estas variables al final de tu archivo `.env.local`:

```env
# ============================================
# MERCADO PAGO - Configuración Híbrida
# ============================================

# ✅ Credenciales de PRUEBA (para pagos en sandbox - seguro)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-xxx
MERCADOPAGO_ACCESS_TOKEN=TEST-xxx

# ✅ Credenciales de PRODUCCIÓN (para OAuth - funciona con cuentas de prueba)
MERCADOPAGO_CLIENT_ID=xxx
MERCADOPAGO_CLIENT_SECRET=xxx

# URLs de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=http://localhost:3000/api/mercadopago/oauth/callback

# Clave de encriptación (para tokens OAuth)
ENCRYPTION_KEY=1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4
```

---

## 🔍 Dónde encontrar cada valor

### 1. Public Key de Prueba
- Ve a: Panel Mercado Pago → **"Credenciales de prueba"**
- Copia: **Public Key** (empieza con `TEST-`)

### 2. Access Token de Prueba
- Ve a: Panel Mercado Pago → **"Credenciales de prueba"**
- Copia: **Access Token** (empieza con `TEST-`)

### 3. Client ID (Producción)
- Ve a: Panel Mercado Pago → **"Credenciales de producción"**
- Copia: **Client ID**

### 4. Client Secret (Producción)
- Ve a: Panel Mercado Pago → **"Credenciales de producción"**
- Copia: **Client Secret**

### 5. ENCRYPTION_KEY
- ✅ Ya generada: `1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4`
- (No necesitas cambiarla)

---

## 📋 Ejemplo Completo

Tu `.env.local` debería verse así (con tus valores reales):

```env
# Supabase (ya deberías tener estas)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Bunny.net (si lo usas)
BUNNY_STREAM_API_KEY=tu_bunny_key
# ... otras variables de Bunny

# Mercado Pago (AGREGAR ESTAS)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-1234567890-abcdef
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-abcdef
MERCADOPAGO_CLIENT_ID=1234567890123456
MERCADOPAGO_CLIENT_SECRET=abcdef1234567890
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=http://localhost:3000/api/mercadopago/oauth/callback
ENCRYPTION_KEY=1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4
```

---

## ⚠️ Importante

1. **Reemplaza los valores**: Cambia `TEST-xxx` y `xxx` por tus credenciales reales
2. **No subas a GitHub**: El `.env.local` ya está en `.gitignore`
3. **Para producción en Vercel**: Agrega estas mismas variables en el dashboard de Vercel

---

## ✅ Checklist

- [ ] Agregué `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` (de prueba)
- [ ] Agregué `MERCADOPAGO_ACCESS_TOKEN` (de prueba)
- [ ] Agregué `MERCADOPAGO_CLIENT_ID` (de producción)
- [ ] Agregué `MERCADOPAGO_CLIENT_SECRET` (de producción)
- [ ] Agregué `NEXT_PUBLIC_APP_URL`
- [ ] Agregué `NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI`
- [ ] Agregué `ENCRYPTION_KEY` (ya generada)

---

## 🚀 Siguiente Paso

Una vez que agregues estas variables:
1. Reinicia el servidor de desarrollo (`npm run dev`)
2. Verifica que no haya errores
3. Continúa con las migraciones SQL















