# 🔧 Solucionar Error "invalid_client" de Google OAuth

## ❌ Error que estás viendo

```
Error 401: invalid_client
The OAuth client was not found.
```

## 🔍 Causas Posibles

Este error significa que Google no reconoce el `GOOGLE_CLIENT_ID` que estás usando. Puede ser por:

1. **El Client ID no está configurado en Vercel** (producción)
2. **El Client ID no coincide** con el de Google Cloud Console
3. **Faltan los Redirect URIs** en Google Cloud Console

---

## ✅ Solución Paso a Paso

### Paso 1: Verificar Client ID en Google Cloud Console

1. Ve a: https://console.cloud.google.com/
2. Selecciona tu proyecto
3. Ve a: **APIs & Services** → **Credentials**
4. Busca tu **OAuth 2.0 Client ID**
5. Haz clic en el Client ID para ver los detalles
6. **Copia el Client ID completo** (debe terminar en `.apps.googleusercontent.com`)

### Paso 2: Verificar Client ID en Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto **omnia-app**
3. Ve a: **Settings** → **Environment Variables**
4. Busca `GOOGLE_CLIENT_ID`
5. Haz clic en "Reveal" para ver el valor
6. **Compara** con el Client ID de Google Cloud Console

**⚠️ IMPORTANTE:** Deben ser **exactamente iguales**

### Paso 3: Configurar Redirect URIs en Google Cloud Console

**Esto es CRÍTICO y probablemente es lo que falta:**

1. En Google Cloud Console, en la página de tu OAuth 2.0 Client ID
2. Haz clic en **Edit** (el lápiz)
3. Busca la sección **"Authorized redirect URIs"** (NO "Authorized JavaScript origins")
4. Agrega estas URLs:

```
http://localhost:3000/api/google/oauth/callback
https://omnia-app.vercel.app/api/google/oauth/callback
```

5. Haz clic en **Save**

### Paso 4: Verificar que el Client ID esté en Vercel

Si el Client ID no está en Vercel o es diferente:

1. Ve a Vercel Dashboard → Settings → Environment Variables
2. Busca `GOOGLE_CLIENT_ID`
3. Si no existe, haz clic en **Add New**
4. Agrega:
   - **Key:** `GOOGLE_CLIENT_ID`
   - **Value:** El Client ID completo de Google Cloud Console
   - **Environment:** Production, Preview, Development (marca todos)
5. Haz clic en **Save**

### Paso 5: Hacer un nuevo deploy

Después de cambiar variables de entorno en Vercel:

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a la pestaña **Deployments**
4. Haz clic en los **3 puntos** del último deployment
5. Selecciona **Redeploy**
6. Espera a que termine el deploy

---

## 🔍 Verificar la Configuración

### En Google Cloud Console debe tener:

✅ **Authorized JavaScript origins:**
- `https://omnia-app.vercel.app`
- `http://localhost:3000`

✅ **Authorized redirect URIs:**
- `https://omnia-app.vercel.app/api/google/oauth/callback`
- `http://localhost:3000/api/google/oauth/callback`

### En Vercel debe tener:

✅ **Environment Variables:**
- `GOOGLE_CLIENT_ID` = (el Client ID completo de Google Cloud Console)
- `GOOGLE_CLIENT_SECRET` = (el Client Secret)
- `NEXT_PUBLIC_APP_URL` = `https://omnia-app.vercel.app`

---

## 🧪 Probar de Nuevo

1. Después de hacer los cambios, espera 1-2 minutos
2. Intenta conectar Google Calendar nuevamente
3. Si sigue fallando, revisa los logs de Vercel:
   - Ve a: Vercel Dashboard → Tu proyecto → Deployments
   - Haz clic en el último deployment
   - Ve a la pestaña **Functions**
   - Busca logs que empiecen con `🔵 [Google OAuth Authorize]`

---

## ⚠️ Errores Comunes

### Error: "redirect_uri_mismatch"
- **Causa:** El redirect URI no está en la lista de Google Cloud Console
- **Solución:** Agrega el redirect URI exacto en Google Cloud Console

### Error: "invalid_client"
- **Causa:** El Client ID no coincide o no está configurado
- **Solución:** Verifica que el Client ID en Vercel sea exactamente igual al de Google Cloud Console

### Error: "access_denied"
- **Causa:** El usuario canceló la autorización
- **Solución:** Intenta de nuevo y acepta los permisos

---

## 📞 Si Sigue Fallando

1. Verifica los logs de Vercel para ver qué Client ID se está usando
2. Compara el Client ID en los logs con el de Google Cloud Console
3. Asegúrate de que el redirect URI sea exactamente igual (sin espacios, sin trailing slash)

