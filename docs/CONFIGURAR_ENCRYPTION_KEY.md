# 🔐 Configurar ENCRYPTION_KEY

## ⚠️ Problema

Si ves el error `TOKEN_DECRYPTION_ERROR` al intentar crear una preferencia de pago, significa que la variable de entorno `ENCRYPTION_KEY` no está configurada.

## 📋 Solución

### 1. Generar una clave de encriptación

Ejecuta este comando en tu terminal para generar una clave segura:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Esto generará una clave hexadecimal de 64 caracteres (32 bytes).

### 2. Agregar a `.env.local`

Agrega esta línea a tu archivo `.env.local`:

```env
ENCRYPTION_KEY=TU_CLAVE_GENERADA_AQUI
```

**Ejemplo:**
```env
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### 3. Agregar a Vercel (Producción)

1. Ve a **Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**
2. Agrega una nueva variable:
   - **Key:** `ENCRYPTION_KEY`
   - **Value:** La misma clave que generaste (debe ser la misma en desarrollo y producción)
   - **Environment:** Production, Preview, Development (marca todas)

### 4. Reiniciar el servidor

Después de agregar la variable, reinicia tu servidor de desarrollo:

```bash
# Detener el servidor (Ctrl+C)
# Luego iniciar de nuevo
npm run dev
```

## ⚠️ Importante

- **NUNCA** compartas tu `ENCRYPTION_KEY` públicamente
- **USA LA MISMA CLAVE** en desarrollo y producción (si no, los tokens encriptados en desarrollo no funcionarán en producción)
- Si cambias la clave, todos los tokens encriptados existentes dejarán de funcionar y los coaches deberán reconectar sus cuentas

## 🔍 Verificar que está configurada

Puedes verificar que la variable esté configurada ejecutando:

```bash
node -e "console.log(process.env.ENCRYPTION_KEY ? '✅ Configurada' : '❌ No configurada')"
```

O simplemente intenta crear una preferencia de pago y verifica que no aparezca el error `TOKEN_DECRYPTION_ERROR`.
