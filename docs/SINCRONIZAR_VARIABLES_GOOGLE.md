# 🔄 Sincronizar Variables de Google desde Vercel

## 📋 Variables de Google Necesarias

Basado en el código, estas son las variables de Google que se utilizan:

### Variables Requeridas:
1. ✅ `GOOGLE_CLIENT_ID` - Client ID de OAuth 2.0
2. ✅ `GOOGLE_CLIENT_SECRET` - Client Secret de OAuth 2.0

### Variables Opcionales (si usas Service Account):
3. `GOOGLE_SA_EMAIL` - Email de Service Account
4. `GOOGLE_SA_PRIVATE_KEY` - Private Key de Service Account

### Variables de Configuración:
5. `NEXT_PUBLIC_APP_URL` - URL de la aplicación (ya deberías tenerla)
6. `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` - URI de redirección (opcional, se construye automáticamente)

---

## 🎯 Pasos para Sincronizar desde Vercel

### Paso 1: Obtener Variables desde Vercel

1. Ve a: **Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**

2. Busca y copia estas variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_SA_EMAIL` (si existe)
   - `GOOGLE_SA_PRIVATE_KEY` (si existe)
   - `NEXT_PUBLIC_APP_URL`

### Paso 2: Configurar en Localhost (.env.local)

Abre tu archivo `.env.local` y agrega/actualiza estas líneas:

```env
# ============================================
# GOOGLE OAUTH (Para Google Calendar y Meet)
# ============================================
GOOGLE_CLIENT_ID=tu_client_id_desde_vercel
GOOGLE_CLIENT_SECRET=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

# ============================================
# GOOGLE SERVICE ACCOUNT (Opcional)
# ============================================
# GOOGLE_SA_EMAIL=tu_service_account_email
# GOOGLE_SA_PRIVATE_KEY=tu_private_key

# ============================================
# CONFIGURACIÓN DE APP
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Opcional: Personalizar Redirect URI
# NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback
```

### Paso 3: Actualizar Client Secret en Vercel

**⚠️ IMPORTANTE**: Como compartiste el Client Secret aquí, deberías actualizarlo también en Vercel:

1. Ve a Vercel Dashboard → Tu proyecto → Settings → Environment Variables
2. Encuentra `GOOGLE_CLIENT_SECRET`
3. Haz clic en **Edit**
4. Actualiza el valor con: `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`
5. Guarda

### Paso 4: Verificar Configuración

Después de agregar las variables:

1. **Reinicia el servidor de desarrollo:**
   ```bash
   # Detén el servidor (Ctrl+C)
   npm run dev
   ```

2. **Verifica que las variables estén cargadas:**
   - El servidor debería iniciar sin errores
   - Intenta conectar Google Calendar desde el perfil

---

## 🔍 Cómo Encontrar las Variables en Vercel

### En Vercel Dashboard:

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto **omnia-app** (o el nombre de tu proyecto)
3. Ve a: **Settings** (Configuración) → **Environment Variables**
4. Busca las variables que comienzan con `GOOGLE_`
5. Haz clic en el valor para copiarlo (si está oculto, haz clic en "Reveal")

---

## ✅ Checklist de Verificación

- [ ] `GOOGLE_CLIENT_ID` está en Vercel y en `.env.local`
- [ ] `GOOGLE_CLIENT_SECRET` está actualizado en Vercel y en `.env.local`
- [ ] `NEXT_PUBLIC_APP_URL` está configurado (localhost para dev, Vercel para prod)
- [ ] Servidor reiniciado después de agregar variables
- [ ] Puedo conectarme a Google Calendar sin errores

---

## 🔒 Seguridad

**⚠️ IMPORTANTE**: 
- El Client Secret que compartiste (`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`) es información sensible
- Considera rotar este secret en Google Cloud Console por seguridad
- Nunca compartas credenciales en chats públicos o documentos sin protección

---

## 🆘 Si algo no funciona

1. **Verifica que las variables estén correctamente escritas** (sin espacios extra)
2. **Reinicia el servidor** después de cambiar `.env.local`
3. **Verifica los logs** del servidor para ver errores específicos
4. **Confirma que los valores coincidan** entre Vercel y localhost

---

¿Necesitas ayuda? Verifica que todas las variables estén configuradas correctamente.










