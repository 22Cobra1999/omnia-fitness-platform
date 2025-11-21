# Template de .env.local para Mercado Pago

## 📋 Variables Necesarias

Copia este template y reemplaza los valores con tus credenciales reales:

```env
# ============================================
# SUPABASE (Ya deberías tener estas)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# ============================================
# MERCADO PAGO - Configuración Híbrida
# ============================================

# ✅ Credenciales de PRUEBA (para pagos en sandbox)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-xxx
MERCADOPAGO_ACCESS_TOKEN=TEST-xxx

# ✅ Credenciales de PRODUCCIÓN (para OAuth - funciona con cuentas de prueba)
MERCADOPAGO_CLIENT_ID=xxx
MERCADOPAGO_CLIENT_SECRET=xxx

# URLs de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=http://localhost:3000/api/mercadopago/oauth/callback

# Clave de encriptación (ya generada)
ENCRYPTION_KEY=1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4

# ============================================
# BUNNY.NET (Si lo usas)
# ============================================
BUNNY_STORAGE_ZONE_NAME=omnia-videos
BUNNY_STORAGE_API_KEY=tu_bunny_storage_key
BUNNY_STORAGE_REGION=br
BUNNY_PULL_ZONE_URL=https://omnia-videos.b-cdn.net
BUNNY_PULL_ZONE_ID=tu_pull_zone_id
BUNNY_STREAM_API_KEY=tu_bunny_stream_key
BUNNY_STREAM_LIBRARY_ID=tu_library_id
BUNNY_STREAM_CDN_URL=https://vz-xxx.b-cdn.net
NEXT_PUBLIC_BUNNY_LIBRARY_ID=tu_library_id
NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID=tu_library_id

# ============================================
# GOOGLE (Si lo usas para OAuth)
# ============================================
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_SA_EMAIL=tu_service_account_email
GOOGLE_SA_PRIVATE_KEY=tu_private_key
```

---

## 🔍 Dónde encontrar cada valor

### Mercado Pago:

1. **Public Key de Prueba**:
   - Panel MP → "Credenciales de prueba" → Public Key

2. **Access Token de Prueba**:
   - Panel MP → "Credenciales de prueba" → Access Token

3. **Client ID (Producción)**:
   - Panel MP → "Credenciales de producción" → Client ID

4. **Client Secret (Producción)**:
   - Panel MP → "Credenciales de producción" → Client Secret

### Supabase:
- Ya deberías tenerlas en tu `.env.local` actual

### URLs:
- `NEXT_PUBLIC_APP_URL`: `http://localhost:3000` (desarrollo)
- `NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI`: `http://localhost:3000/api/mercadopago/oauth/callback`

### ENCRYPTION_KEY:
- Ya generada: `1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4`









