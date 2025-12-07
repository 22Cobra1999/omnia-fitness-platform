# 🔧 Solucionar Error: "OAuth client was not found"

## ❌ Error
```
Error 401: invalid_client
The OAuth client was not found.
```

## 🔍 Causas Posibles

1. **El Client ID no existe en Google Cloud Console**
2. **El Client ID está en un proyecto diferente**
3. **El proyecto de Google Cloud Console no está activo**
4. **El Client ID fue eliminado o deshabilitado**

## ✅ Solución Paso a Paso

### Paso 1: Verificar el Client ID en Google Cloud Console

1. Ve a: https://console.cloud.google.com/
2. **Selecciona el proyecto correcto** (el mismo que usas para Google Meet)
3. Ve a: **APIs & Services** → **Credentials**
4. Busca tu **OAuth 2.0 Client ID**
5. Verifica que el Client ID sea exactamente:
   ```
   839231165191-tuk2lnjn2e9upjfj42o4msrkv9tf9puf.apps.googleusercontent.com
   ```

### Paso 2: Si el Client ID NO existe

**Opción A: Crear un nuevo OAuth 2.0 Client ID**

1. En Google Cloud Console → **APIs & Services** → **Credentials**
2. Haz clic en **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Si te pide configurar la pantalla de consentimiento, hazlo
4. Selecciona **"Web application"** como tipo de aplicación
5. Configura:
   - **Name**: `Omnia Calendar OAuth` (o el nombre que prefieras)
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://omnia-app.vercel.app`
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/google/oauth/callback`
     - `https://omnia-app.vercel.app/api/google/oauth/callback`
6. Haz clic en **"CREATE"**
7. **Copia el Client ID** que se genera
8. **Copia el Client Secret** que se genera

**Opción B: Usar un Client ID existente (si ya tienes uno para Google Meet)**

1. Si ya tienes un OAuth 2.0 Client ID para Google Meet, puedes usar el mismo
2. Verifica que tenga los redirect URIs configurados correctamente
3. Usa ese Client ID y Client Secret

### Paso 3: Actualizar Variables de Entorno

**En Localhost (.env.local):**
```env
GOOGLE_CLIENT_ID=TU_NUEVO_CLIENT_ID_AQUI
GOOGLE_CLIENT_SECRET=TU_NUEVO_CLIENT_SECRET_AQUI
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**En Vercel (Producción):**
1. Ve a: Vercel Dashboard → Tu proyecto → **Settings** → **Environment Variables**
2. Actualiza o crea:
   - `GOOGLE_CLIENT_ID` = Tu nuevo Client ID
   - `GOOGLE_CLIENT_SECRET` = Tu nuevo Client Secret
   - `NEXT_PUBLIC_APP_URL` = `https://omnia-app.vercel.app`

### Paso 4: Reiniciar el Servidor

```bash
# Detener el servidor (Ctrl+C)
# Reiniciar
npm run dev
```

### Paso 5: Verificar que Funciona

1. Intenta conectar Google Calendar nuevamente
2. Deberías ver la pantalla de autorización de Google
3. Si sigue fallando, revisa los logs del servidor para ver el Client ID que se está usando

## 🔍 Verificar el Client ID Correcto

Para verificar qué Client ID se está usando, revisa los logs del servidor cuando intentas conectar. Deberías ver algo como:

```
🔵 [Google OAuth Authorize] Configuración: {
  clientId: '839231165191-tuk2lnjn2e9upjfj4...',
  ...
}
```

Compara este Client ID con el que tienes en Google Cloud Console.

## ⚠️ Notas Importantes

1. **El Client ID debe coincidir exactamente** con el de Google Cloud Console
2. **No debe tener espacios** al inicio o final
3. **Debe terminar en** `.apps.googleusercontent.com`
4. **Los redirect URIs deben coincidir exactamente** con los configurados en Google Cloud Console
5. **Puede tomar 5 minutos a varias horas** para que los cambios en Google Cloud Console surtan efecto

## 🆘 Si Nada Funciona

1. Verifica que estés usando el **proyecto correcto** en Google Cloud Console
2. Verifica que la **API de Google Calendar** esté habilitada en el proyecto
3. Intenta crear un **nuevo OAuth 2.0 Client ID** desde cero
4. Verifica que no haya **restricciones de dominio** en el Client ID

