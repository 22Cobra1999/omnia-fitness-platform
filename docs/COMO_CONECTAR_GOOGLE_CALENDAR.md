# 📅 Cómo Conectar Google Calendar - Guía Simple

## ✅ Lo que ya tienes configurado

Ya tienes Google Meet conectado, así que tienes estas variables de entorno:

- `GOOGLE_CLIENT_ID` - Tu Client ID de Google
- `GOOGLE_CLIENT_SECRET` - Tu Client Secret de Google

Estas variables ya están en Vercel (producción) y funcionan.

---

## 🎯 Paso 1: Verificar Variables de Entorno

### En Vercel (Producción):

1. Ve a: **Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**
2. Verifica que tengas estas variables:
   - ✅ `GOOGLE_CLIENT_ID`
   - ✅ `GOOGLE_CLIENT_SECRET`
   - ✅ `NEXT_PUBLIC_APP_URL` (debería ser `https://omnia-app.vercel.app`)

### En Localhost (Desarrollo):

En tu archivo `.env.local`, deberías tener:

```env
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🔑 Paso 2: Configurar Google Cloud Console

1. Ve a: https://console.cloud.google.com/
2. Selecciona tu proyecto (el mismo que usas para Google Meet)
3. Ve a: **APIs & Services** → **Credentials**
4. Encuentra tu **OAuth 2.0 Client ID** (el mismo que usas para Meet)
5. Haz clic en **Edit** (el lápiz)

### Agregar Redirect URI:

En la sección **"Authorized redirect URIs"**, agrega:

**Para Desarrollo (localhost):**
```
http://localhost:3000/api/google/oauth/callback
```

**Para Producción (Vercel):**
```
https://omnia-app.vercel.app/api/google/oauth/callback
```

6. Haz clic en **Save**

---

## 🚀 Paso 3: Verificar Scopes en Google Cloud Console

1. En la misma página de OAuth 2.0 Client, verifica que tengas estos scopes:
   - ✅ `https://www.googleapis.com/auth/calendar` (para calendario)
   - ✅ `https://www.googleapis.com/auth/calendar.events` (para eventos)

   Si no los tienes, se agregarán automáticamente cuando el usuario autorice.

---

## 📝 Paso 4: Variables de Entorno Adicionales (Opcional)

Puedes agregar estas variables si quieres personalizar el redirect URI:

```env
# Para desarrollo
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback

# Para producción (en Vercel)
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://omnia-app.vercel.app/api/google/oauth/callback
```

**Nota:** Si no las agregas, el código usará `NEXT_PUBLIC_APP_URL` + `/api/google/oauth/callback` automáticamente.

---

## ✅ Paso 5: Verificar que Todo Funciona

1. **En Vercel:**
   - Verifica que las variables estén configuradas
   - Hacer un nuevo deploy si agregaste variables nuevas

2. **En Localhost:**
   - Reinicia el servidor (`npm run dev`)
   - Verifica que no haya errores al iniciar

---

## 🎯 Resumen de lo que Necesitas

### En Google Cloud Console:
1. ✅ Tener un OAuth 2.0 Client ID configurado (ya lo tienes para Meet)
2. ✅ Agregar Redirect URI: `https://omnia-app.vercel.app/api/google/oauth/callback`
3. ✅ Agregar Redirect URI para localhost: `http://localhost:3000/api/google/oauth/callback`

### En Vercel:
1. ✅ Variable `GOOGLE_CLIENT_ID` (ya la tienes)
2. ✅ Variable `GOOGLE_CLIENT_SECRET` (ya la tienes)
3. ✅ Variable `NEXT_PUBLIC_APP_URL` = `https://omnia-app.vercel.app`

### En Localhost (.env.local):
1. ✅ `GOOGLE_CLIENT_ID=tu_client_id`
2. ✅ `GOOGLE_CLIENT_SECRET=tu_client_secret`
3. ✅ `NEXT_PUBLIC_APP_URL=http://localhost:3000`

---

## ⚠️ Importante

- Usa el **mismo Client ID** que ya usas para Google Meet
- Los scopes se pedirán automáticamente cuando el usuario autorice
- El Redirect URI debe coincidir exactamente con el configurado en Google Cloud Console

---

## 🧪 Próximos Pasos

Una vez que tengas esto configurado, podrás:
1. Conectar Google Calendar desde el calendario de Omnia
2. Ver eventos de Google Calendar en tu calendario de Omnia
3. Sincronizar eventos bidireccionalmente

---

¿Todo claro? Si tienes dudas, avísame y te ayudo 😊
























