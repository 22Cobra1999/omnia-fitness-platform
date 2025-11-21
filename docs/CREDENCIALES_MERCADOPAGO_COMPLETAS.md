# 🔑 Credenciales de Mercado Pago - Completas

## ⚠️ IMPORTANTE: Seguridad

**NUNCA** commits estas credenciales directamente en el código. Siempre usa variables de entorno.

---

## 🧪 Credenciales de Prueba (Testing/Sandbox)

### Public Key
```
APP_USR-f5589935-8dea-4963-af32-b0f57a9ad7fb
```

### Access Token
```
APP_USR-8497664518687621-112020-b8d6314ad9be3f5f9b55182b157921c1-2995219181
```

**Uso**: Para desarrollo y pruebas. Los pagos son simulados.

**Configuración**:
- Variable de entorno: `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
- Variable de entorno: `MERCADOPAGO_ACCESS_TOKEN`

---

## 🚀 Credenciales de Producción

### Public Key
```
APP_USR-9ed1ca79-fa3c-4328-9b09-eee5dea88a8e
```

### Access Token
```
APP_USR-1806894141402209-111615-c8eb49a21685ec57eb24b443f0ac72ea-143028270
```

**Uso**: Para producción. Los pagos son reales.

**⚠️ ADVERTENCIA**: Estas credenciales procesan pagos reales. Úsalas solo en producción.

**Configuración**:
- Variable de entorno: `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
- Variable de entorno: `MERCADOPAGO_ACCESS_TOKEN`

---

## 📋 Configuración de Variables de Entorno

### Desarrollo Local (`.env.local`)

```env
# Mercado Pago - Credenciales de PRUEBA
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-f5589935-8dea-4963-af32-b0f57a9ad7fb
MERCADOPAGO_ACCESS_TOKEN=APP_USR-8497664518687621-112020-b8d6314ad9be3f5f9b55182b157921c1-2995219181

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=http://localhost:3000/api/mercadopago/oauth/callback
```

### Vercel - Testing/Staging

Usa las credenciales de **PRUEBA**:
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`: `APP_USR-f5589935-8dea-4963-af32-b0f57a9ad7fb`
- `MERCADOPAGO_ACCESS_TOKEN`: `APP_USR-8497664518687621-112020-b8d6314ad9be3f5f9b55182b157921c1-2995219181`

### Vercel - Producción

Usa las credenciales de **PRODUCCIÓN**:
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`: `APP_USR-9ed1ca79-fa3c-4328-9b09-eee5dea88a8e`
- `MERCADOPAGO_ACCESS_TOKEN`: `APP_USR-1806894141402209-111615-c8eb49a21685ec57eb24b443f0ac72ea-143028270`

---

## 🔄 Cómo Cambiar Entre Prueba y Producción

### Opción 1: Script Automático

```bash
# Actualizar credenciales de prueba en Vercel
./scripts/update-mercadopago-credentials.sh
```

### Opción 2: Vercel Dashboard

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Actualiza las variables:
   - `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
   - `MERCADOPAGO_ACCESS_TOKEN`
4. Selecciona el ambiente (Production, Preview, Development)
5. Guarda los cambios
6. Haz un nuevo deploy

### Opción 3: Vercel CLI

```bash
# Para producción
vercel env add MERCADOPAGO_ACCESS_TOKEN production
# Pega: APP_USR-1806894141402209-111615-c8eb49a21685ec57eb24b443f0ac72ea-143028270

vercel env add NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY production
# Pega: APP_USR-9ed1ca79-fa3c-4328-9b09-eee5dea88a8e

# Para preview/testing
vercel env add MERCADOPAGO_ACCESS_TOKEN preview
# Pega: APP_USR-8497664518687621-112020-b8d6314ad9be3f5f9b55182b157921c1-2995219181

vercel env add NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY preview
# Pega: APP_USR-f5589935-8dea-4963-af32-b0f57a9ad7fb
```

---

## ✅ Verificación de Credenciales

### Verificar en el Código

Las credenciales se usan en:

1. **Backend** (`app/api/mercadopago/checkout-pro/create-preference/route.ts`):
   ```typescript
   const coachAccessToken = decrypt(coachCredentials.access_token_encrypted);
   // O
   const marketplaceToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
   ```

2. **Frontend** (si se necesita):
   ```typescript
   const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
   ```

### Verificar en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Verifica que las variables estén configuradas correctamente
4. Verifica que el ambiente (Production/Preview) sea correcto

---

## 🔐 Seguridad

### ✅ Buenas Prácticas

- ✅ Usar variables de entorno (nunca hardcodear)
- ✅ No commitear credenciales en el código
- ✅ Usar credenciales de prueba en desarrollo
- ✅ Usar credenciales de producción solo en producción
- ✅ Rotar credenciales periódicamente
- ✅ Limitar acceso a las credenciales

### ❌ Evitar

- ❌ Hardcodear credenciales en el código
- ❌ Commitear credenciales en Git
- ❌ Compartir credenciales por email/chat
- ❌ Usar credenciales de producción en desarrollo
- ❌ Exponer credenciales en logs públicos

---

## 📚 Referencias

- [Documentación Oficial - Credenciales](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/credentials)
- [Documentación Oficial - Credenciales de Prueba](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/test/credentials)

---

## 📝 Notas

- Las credenciales de prueba empiezan con `APP_USR-` (igual que las de producción)
- Para distinguirlas, verifica en el panel de Mercado Pago Developers
- Las credenciales de prueba solo funcionan con cuentas de prueba
- Las credenciales de producción procesan pagos reales

---

**Última actualización**: Credenciales actualizadas según información proporcionada

