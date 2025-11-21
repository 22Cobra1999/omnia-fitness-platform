# ✅ Configuración de Credenciales - Actualizada

## 🔑 Credenciales de Prueba (Argentina)

### Public Key
```
APP_USR-f5589935-8dea-4963-af32-b0f57a9ad7fb
```

### Access Token
```
APP_USR-8497664518687621-112020-b8d6314ad9be3f5f9b55182b157921c1-2995219181
```

---

## 📋 Configuración Rápida

### 1. Variables de Entorno en `.env.local` (Desarrollo)

Agrega estas líneas a tu archivo `.env.local`:

```env
# Mercado Pago - Credenciales de Prueba (Argentina)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-f5589935-8dea-4963-af32-b0f57a9ad7fb
MERCADOPAGO_ACCESS_TOKEN=APP_USR-8497664518687621-112020-b8d6314ad9be3f5f9b55182b157921c1-2995219181

# URLs de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=http://localhost:3000/api/mercadopago/oauth/callback

# Clave de encriptación (para tokens OAuth)
ENCRYPTION_KEY=1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4
```

### 2. Variables de Entorno en Vercel (Producción/Testing)

Configura estas variables en Vercel Dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-f5589935-8dea-4963-af32-b0f57a9ad7fb
MERCADOPAGO_ACCESS_TOKEN=APP_USR-8497664518687621-112020-b8d6314ad9be3f5f9b55182b157921c1-2995219181
NEXT_PUBLIC_APP_URL=https://omnia-app.vercel.app
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=https://omnia-app.vercel.app/api/mercadopago/oauth/callback
ENCRYPTION_KEY=1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4
```

**O usa el script automatizado**:
```bash
bash scripts/setup-vercel-env-testing.sh
```

---

## 🔍 Dónde se Usan Estas Credenciales

### 1. **MERCADOPAGO_ACCESS_TOKEN** (Backend)
- ✅ `/api/mercadopago/webhook/route.ts` - Consultar detalles de pagos
- ✅ `/api/enrollments/create-with-mercadopago/route.ts` - Fallback si no hay token del coach
- ✅ `/api/mercadopago/transactions/route.ts` - Consultar transacciones

**Nota**: En Checkout Pro con Split Payment, normalmente se usa el `access_token` del coach (obtenido vía OAuth), pero el token del marketplace se usa como fallback.

### 2. **NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY** (Frontend)
- Actualmente no se usa en Checkout Pro (solo en Checkout API/Bricks)
- Se puede usar para validaciones o futuras integraciones

---

## ⚠️ Importante

1. **Estas son credenciales de PRODUCCIÓN para cuenta de PRUEBA**:
   - Empiezan con `APP_USR-` (no `TEST-`)
   - Son seguras para usar en pruebas
   - No procesan pagos reales

2. **User ID del Access Token**:
   - El Access Token contiene el User ID: `2995219181`
   - Este es el ID de la cuenta de prueba del marketplace/vendedor

3. **Para Split Payment**:
   - Los coaches necesitan autorizar OAuth para que OMNIA pueda usar sus tokens
   - El token del marketplace se usa como fallback o para consultas

---

## ✅ Verificación

Para verificar que las credenciales están configuradas correctamente:

1. **Reinicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

2. **Verifica los logs**:
   - Al crear una preferencia, deberías ver logs sin errores
   - Si hay errores de autenticación, verifica las credenciales

3. **Prueba crear una preferencia**:
   - Intenta comprar una actividad
   - Debería redirigir a Mercado Pago sin errores

---

## 📚 Archivos Actualizados

- ✅ `scripts/setup-vercel-env-testing.sh` - Script actualizado con nuevas credenciales
- ✅ `docs/CREDENCIALES_MERCADOPAGO_ACTUALES.md` - Documentación de credenciales
- ✅ `docs/CONFIGURACION_CREDENCIALES_ACTUALIZADA.md` - Este archivo

---

## 🚀 Próximos Pasos

1. **Configurar variables en `.env.local`** (si trabajas localmente)
2. **Configurar variables en Vercel** (para producción/testing)
3. **Reiniciar el servidor** para cargar las nuevas variables
4. **Probar el flujo de pago** completo

