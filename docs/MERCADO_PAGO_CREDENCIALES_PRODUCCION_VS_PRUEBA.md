# Credenciales de Producción vs Prueba en Mercado Pago

## 🎯 Tu Situación Actual

### ✅ Lo que tienes:
- **Credenciales de Prueba**:
  - Public Key (prueba)
  - Access Token (prueba)

- **Credenciales de Producción**:
  - Client ID (producción)
  - Client Secret (producción)

---

## ⚠️ ¿Puedo usar credenciales de producción en desarrollo?

### Respuesta corta: **SÍ, pero con precaución**

**Puedes usar Client ID y Client Secret de producción en desarrollo** porque:
- OAuth funciona con credenciales de producción incluso en sandbox
- Las cuentas de prueba pueden autorizar usando OAuth de producción
- Es común usar credenciales de producción para OAuth en desarrollo

**⚠️ IMPORTANTE**:
- **NO mezcles** Public Key/Access Token de prueba con Client ID/Client Secret de producción en el mismo flujo
- Usa **todo de prueba** O **todo de producción** para consistencia
- O usa **híbrido** (OAuth de producción + pagos de prueba) si es necesario

---

## 🔧 Configuración Recomendada

### Opción 1: Todo en Prueba (Ideal para desarrollo)

```env
# Credenciales de PRUEBA
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-xxx (de prueba)
MERCADOPAGO_ACCESS_TOKEN=TEST-xxx (de prueba)
MERCADOPAGO_CLIENT_ID=xxx (de prueba - si lo tienes)
MERCADOPAGO_CLIENT_SECRET=xxx (de prueba - si lo tienes)
```

**Ventajas**:
- ✅ Todo en sandbox
- ✅ No hay riesgo de cobros reales
- ✅ Ideal para desarrollo

**Desventajas**:
- ❌ Puede que no tengas Client ID/Secret de prueba

---

### Opción 2: Híbrido (OAuth Producción + Pagos Prueba)

```env
# Credenciales de PRUEBA para pagos
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-xxx (de prueba)
MERCADOPAGO_ACCESS_TOKEN=TEST-xxx (de prueba)

# Credenciales de PRODUCCIÓN para OAuth
MERCADOPAGO_CLIENT_ID=xxx (de producción)
MERCADOPAGO_CLIENT_SECRET=xxx (de producción)
```

**Ventajas**:
- ✅ OAuth funciona (necesario para split payment)
- ✅ Pagos siguen en sandbox (seguro)

**Desventajas**:
- ⚠️ Mezcla de entornos (pero funciona)

**⚠️ IMPORTANTE**: 
- Las cuentas de prueba pueden autorizar con OAuth de producción
- Los pagos seguirán siendo de prueba si usas Access Token de prueba

---

### Opción 3: Todo en Producción (Solo para producción real)

```env
# Credenciales de PRODUCCIÓN
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxx (de producción)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx (de producción)
MERCADOPAGO_CLIENT_ID=xxx (de producción)
MERCADOPAGO_CLIENT_SECRET=xxx (de producción)
```

**⚠️ SOLO usar en producción real**, no en desarrollo.

---

## 🎯 Recomendación para OMNIA

### Para Desarrollo (AHORA):

Usa **Opción 2: Híbrido**:

```env
# .env.local - Desarrollo
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-xxx (de prueba)
MERCADOPAGO_ACCESS_TOKEN=TEST-xxx (de prueba)

# OAuth de producción (funciona con cuentas de prueba)
MERCADOPAGO_CLIENT_ID=xxx (de producción)
MERCADOPAGO_CLIENT_SECRET=xxx (de producción)

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=http://localhost:3000/api/mercadopago/oauth/callback

# Encriptación
ENCRYPTION_KEY=tu_clave_32_bytes
```

**Por qué funciona**:
- ✅ OAuth de producción puede autorizar cuentas de prueba
- ✅ Pagos siguen siendo de prueba (seguro)
- ✅ Puedes probar split payment completo

---

## 📋 Checklist de Configuración

### Para Desarrollo:
- [x] Public Key de prueba ✅
- [x] Access Token de prueba ✅
- [x] Client ID de producción ✅
- [x] Client Secret de producción ✅
- [ ] Configurar `.env.local` con valores híbridos
- [ ] Configurar Redirect URI en Mercado Pago
- [ ] Ejecutar migraciones SQL
- [ ] Instalar SDK

---

## 🔍 Cómo Identificar Credenciales

### Credenciales de Prueba:
- Public Key: Empieza con `TEST-`
- Access Token: Empieza con `TEST-`

### Credenciales de Producción:
- Public Key: Empieza con `APP_USR-`
- Access Token: Empieza con `APP_USR-`
- Client ID: No tiene prefijo específico
- Client Secret: No tiene prefijo específico

---

## ⚠️ Precauciones

1. **Nunca commits credenciales**:
   - Usa `.env.local` (ya está en `.gitignore`)
   - No subas credenciales a GitHub

2. **Separar entornos**:
   - Desarrollo: `.env.local`
   - Producción: Variables de entorno del servidor

3. **Verificar antes de usar**:
   - En desarrollo, verifica que los pagos sean de prueba
   - Revisa que los IDs empiecen con `TEST-` para pagos

---

## 🚀 Próximos Pasos

1. **Configura `.env.local`** con la opción híbrida:
   ```env
   NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-xxx
   MERCADOPAGO_ACCESS_TOKEN=TEST-xxx
   MERCADOPAGO_CLIENT_ID=xxx (producción)
   MERCADOPAGO_CLIENT_SECRET=xxx (producción)
   ```

2. **Configura Redirect URI** en Mercado Pago:
   - Ve a "Información general" de tu aplicación
   - Agrega: `http://localhost:3000/api/mercadopago/oauth/callback`

3. **Ejecuta migraciones SQL**

4. **Instala SDK**: `npm install mercadopago @mercadopago/sdk-react`

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo usar Client ID/Secret de producción con Access Token de prueba?**
R: Sí, funciona. OAuth de producción puede autorizar cuentas de prueba.

**P: ¿Los pagos serán reales o de prueba?**
R: Depende del Access Token. Si usas `TEST-xxx`, los pagos son de prueba.

**P: ¿Necesito credenciales de prueba para OAuth?**
R: No necesariamente. Puedes usar las de producción en desarrollo.

**P: ¿Es seguro usar credenciales de producción en desarrollo?**
R: Sí, siempre que:
- No las subas a GitHub
- Uses Access Token de prueba para pagos
- Solo uses OAuth de producción para autorización

---

## 📝 Resumen

**Tu configuración ideal para desarrollo**:
- ✅ Public Key de prueba
- ✅ Access Token de prueba  
- ✅ Client ID de producción (para OAuth)
- ✅ Client Secret de producción (para OAuth)

**Esto te permite**:
- Probar pagos en sandbox (seguro)
- Probar OAuth completo (split payment)
- No necesitas credenciales de prueba para OAuth








