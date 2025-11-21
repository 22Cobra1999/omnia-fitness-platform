# 🛠️ Configurar Ambiente de Desarrollo - Mercado Pago

## 📋 Pasos Según Documentación Oficial

Esta guía sigue los pasos oficiales de Mercado Pago para configurar el ambiente de desarrollo con Checkout Pro.

---

## ✅ Paso 1: Verificar Instalación del SDK

### Estado Actual

El SDK de Mercado Pago **ya está instalado** en el proyecto:

```json
// package.json
{
  "dependencies": {
    "mercadopago": "^2.10.0"  // ✅ SDK de backend (Node.js/TypeScript)
  }
}
```

### Si necesitas reinstalar:

```bash
npm install mercadopago
```

---

## ✅ Paso 2: Obtener Credenciales de Prueba

### En el Panel de Mercado Pago Developers:

1. Ve a **Mercado Pago Developers**: https://www.mercadopago.com.ar/developers
2. Selecciona tu aplicación **"Om Omnia in te"**
3. En el menú lateral, ve a **"Credenciales"** → **"Credenciales de prueba"**
4. Copia las siguientes credenciales:
   - **Public Key** (para frontend): `TEST-xxx` o `APP_USR-xxx`
   - **Access Token** (para backend): `TEST-xxx` o `APP_USR-xxx`

### Credenciales Actuales (según configuración):

```
Public Key: APP_USR-f5589935-8dea-4963-af32-b0f57a9ad7fb
Access Token: APP_USR-8497664518687621-112020-b8d6314ad9be3f5f9b55182b157921c1-2995219181
```

---

## ✅ Paso 3: Configurar Variables de Entorno

### Archivo `.env.local` (desarrollo local):

```env
# Mercado Pago - Credenciales de Prueba
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-f5589935-8dea-4963-af32-b0f57a9ad7fb
MERCADOPAGO_ACCESS_TOKEN=APP_USR-8497664518687621-112020-b8d6314ad9be3f5f9b55182b157921c1-2995219181

# URLs de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=http://localhost:3000/api/mercadopago/oauth/callback

# Clave de encriptación (para tokens OAuth)
ENCRYPTION_KEY=1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4
```

### Vercel (producción/testing):

Las credenciales ya están configuradas en Vercel. Para actualizarlas:

```bash
# Usar el script de actualización
./scripts/update-mercadopago-credentials.sh
```

O manualmente en Vercel Dashboard:
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Actualiza las variables necesarias

---

## ✅ Paso 4: Inicializar Biblioteca de Mercado Pago

### Patrón Actual en el Proyecto

El SDK se inicializa en cada endpoint según el token necesario:

```typescript
// app/api/mercadopago/checkout-pro/create-preference/route.ts
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Obtener el access token (del coach o del marketplace)
const coachAccessToken = decrypt(coachCredentials.access_token_encrypted);

// Inicializar cliente de Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: coachAccessToken,  // Token del coach o marketplace
  options: { timeout: 5000 }
});

// Crear instancia de Preference
const preference = new Preference(client);
```

### Estructura de Inicialización

```typescript
// 1. Importar SDK
import { MercadoPagoConfig, Preference } from 'mercadopago';

// 2. Obtener Access Token
// - Del coach (si es split payment): decrypt(coachCredentials.access_token_encrypted)
// - Del marketplace: process.env.MERCADOPAGO_ACCESS_TOKEN

// 3. Crear cliente
const client = new MercadoPagoConfig({
  accessToken: 'TEST_ACCESS_TOKEN',  // Reemplazar con tu token
  options: { timeout: 5000 }  // Timeout opcional
});

// 4. Crear instancia del recurso necesario
const preference = new Preference(client);
const payment = new Payment(client);
const preApproval = new PreApproval(client);
```

---

## 📍 Ubicación de la Configuración

### Endpoints que usan Mercado Pago:

1. **`app/api/mercadopago/checkout-pro/create-preference/route.ts`**
   - Crea preferencias de pago con Checkout Pro
   - Usa token del coach (split payment)

2. **`app/api/mercadopago/webhook/route.ts`**
   - Recibe notificaciones de Mercado Pago
   - Usa token del coach o marketplace según el caso

3. **`app/api/mercadopago/transactions/route.ts`**
   - Obtiene detalles de transacciones
   - Usa token según el tipo de cuenta

4. **`lib/mercadopago/subscriptions.ts`**
   - Maneja suscripciones
   - Usa token del marketplace

---

## ✅ Verificación de Configuración

### Test 1: Verificar SDK Instalado

```bash
npm list mercadopago
```

Debería mostrar: `mercadopago@2.10.0`

### Test 2: Verificar Variables de Entorno

```bash
# En desarrollo local
cat .env.local | grep MERCADOPAGO

# Debería mostrar:
# NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=...
# MERCADOPAGO_ACCESS_TOKEN=...
```

### Test 3: Probar Creación de Preferencia

1. Inicia el servidor: `npm run dev`
2. Intenta crear una preferencia desde la aplicación
3. Revisa los logs en la consola del servidor
4. Verifica que no haya errores de autenticación

---

## 🔍 Troubleshooting

### Error: "Invalid access token"

**Causa**: El Access Token no es válido o está mal configurado.

**Solución**:
1. Verifica que el token en `.env.local` sea correcto
2. Asegúrate de usar credenciales de **prueba** (empiezan con `TEST-` o `APP_USR-`)
3. Verifica que no haya espacios extra en el token

### Error: "Timeout"

**Causa**: La conexión a Mercado Pago está tardando demasiado.

**Solución**:
1. Aumenta el timeout en la configuración:
   ```typescript
   const client = new MercadoPagoConfig({
     accessToken: token,
     options: { timeout: 10000 }  // 10 segundos
   });
   ```

### Error: "Cannot find module 'mercadopago'"

**Causa**: El SDK no está instalado.

**Solución**:
```bash
npm install mercadopago
```

---

## 📚 Referencias

- [Documentación Oficial - Instalar SDK](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/your-integrations/sdk)
- [Documentación Oficial - Credenciales](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/credentials)
- [SDK de Node.js en GitHub](https://github.com/mercadopago/sdk-nodejs)

---

## ✅ Checklist de Configuración

- [x] SDK instalado (`mercadopago@2.10.0`)
- [x] Credenciales de prueba obtenidas
- [x] Variables de entorno configuradas (`.env.local` y Vercel)
- [x] SDK inicializado correctamente en los endpoints
- [x] Timeout configurado (5000ms)
- [x] Logs de debugging habilitados

---

## 🚀 Próximos Pasos

Después de configurar el ambiente de desarrollo:

1. ✅ **Realizar integración** - Crear preferencias de pago
2. ✅ **Probar la integración** - Usar cuentas de prueba
3. ⏳ **Salir a producción** - Cambiar a credenciales de producción

---

**Última actualización**: Basado en documentación oficial de Mercado Pago y configuración actual del proyecto

