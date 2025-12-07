# 🔍 Verificar Client ID de Google OAuth

## ❌ Error Actual
```
Error 401: invalid_client
The OAuth client was not found.
Token exchange failed: 401 Unauthorized
```

## 🔍 Verificación en Google Cloud Console

### Paso 1: Acceder a Google Cloud Console
1. Ve a: https://console.cloud.google.com/
2. **Selecciona el proyecto correcto** (el mismo que usas para Google Meet)

### Paso 2: Verificar que el Client ID Exista
1. Ve a: **APIs & Services** → **Credentials**
2. Busca el OAuth 2.0 Client ID que estás usando (debe terminar en `.apps.googleusercontent.com`)
3. **Si NO existe:**
   - Haz clic en **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
   - Tipo: **"Web application"**
   - Name: `Omnia Calendar OAuth`
   - **Authorized JavaScript origins:**
     - `http://localhost:3000`
     - `https://omnia-app.vercel.app`
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/google/oauth/callback`
     - `https://omnia-app.vercel.app/api/google/oauth/callback`
   - Haz clic en **"CREATE"**
   - **Copia el nuevo Client ID y Client Secret**

4. **Si existe:**
   - Haz clic en el Client ID para editarlo
   - Verifica que esté **habilitado** (no deshabilitado)
   - Verifica que los **Redirect URIs** estén configurados correctamente
   - Verifica que el **Client Secret** sea el correcto

### Paso 3: Verificar Client Secret
1. En la página del OAuth 2.0 Client ID
2. Haz clic en **"Reveal"** para ver el Client Secret
3. Verifica que coincida con el que tienes en Vercel
4. **Si es diferente:**
   - Actualiza la variable `GOOGLE_CLIENT_SECRET` en Vercel con el valor correcto
   - Actualiza también en `.env.local` para desarrollo

### Paso 4: Verificar que la API de Google Calendar esté Habilitada
1. Ve a: **APIs & Services** → **Library**
2. Busca **"Google Calendar API"**
3. Verifica que esté **habilitada**
4. Si no está habilitada, haz clic en **"ENABLE"**

## ✅ Verificación de Variables de Entorno

### En Vercel (Producción):
- ✅ `GOOGLE_CLIENT_ID` = Debe coincidir con el de Google Cloud Console
- ✅ `GOOGLE_CLIENT_SECRET` = Debe coincidir con el de Google Cloud Console

### En Localhost (.env.local):
- ✅ `GOOGLE_CLIENT_ID` = Debe coincidir con el de Google Cloud Console
- ✅ `GOOGLE_CLIENT_SECRET` = Debe coincidir con el de Google Cloud Console

## 🔧 Si el Client ID No Existe

Si el Client ID no existe en Google Cloud Console, necesitas crearlo:

1. **Crear nuevo OAuth 2.0 Client ID:**
   - Ve a: APIs & Services → Credentials
   - "+ CREATE CREDENTIALS" → "OAuth client ID"
   - Tipo: "Web application"
   - Configura los Redirect URIs y JavaScript Origins como se muestra arriba

2. **Actualizar variables de entorno:**
   - En Vercel: Actualiza `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
   - En `.env.local`: Actualiza con los nuevos valores
   - Reinicia el servidor local

## ⚠️ Notas Importantes

- El Client ID y Client Secret **deben coincidir exactamente** entre Google Cloud Console, Vercel y `.env.local`
- Los Redirect URIs **deben coincidir exactamente** (incluyendo http/https, con/sin trailing slash)
- Puede tomar **5 minutos a varias horas** para que los cambios en Google Cloud Console surtan efecto
- Si cambias el Client ID, necesitas actualizar las variables en **todos los ambientes** (Vercel y local)

