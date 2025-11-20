# ⚙️ Configurar Variables de Entorno Separadas (Prueba vs Producción)

## 🎯 Estrategia: Variables Separadas por Entorno

Vercel permite tener variables de entorno diferentes para cada ambiente:
- **Development** → Variables de prueba (TEST-)
- **Preview** → Variables de prueba (TEST-)
- **Production** → Variables de producción (APP_USR-)

Esto permite mantener ambos conjuntos de credenciales y usarlas según el entorno.

---

## 📋 Variables a Configurar

### 🔵 Development & Preview (MODO PRUEBA)

Para entornos **Development** y **Preview**, usa credenciales de **PRUEBA**:

#### MERCADOPAGO_ACCESS_TOKEN (Development & Preview)
```
TEST-1806894141402209-111615-607774a8d606f9a7200dc2e23b8e7b4d-143028270
```
⚠️ **DEBE empezar con TEST-** (modo prueba)

#### NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY (Development & Preview)
```
TEST-cc6d31a8-ff84-4644-98dd-e05c6740d95e
```
⚠️ **DEBE empezar con TEST-** (modo prueba)

#### NEXT_PUBLIC_APP_URL (Development & Preview)
```
https://omnia-app.vercel.app
```

#### NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI (Development & Preview)
```
https://omnia-app.vercel.app/api/mercadopago/oauth/callback
```

---

### 🔴 Production (MODO PRODUCCIÓN)

Para entorno **Production**, mantén las credenciales de **PRODUCCIÓN** (ya configuradas):

#### MERCADOPAGO_ACCESS_TOKEN (Production)
```
APP_USR-1806894141402209-111615-c8eb49a21685ec57eb24b443f0ac72ea-143028270
```
⚠️ **DEBE empezar con APP_USR-** (modo producción)

#### NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY (Production)
```
APP_USR-9ed1ca79-fa3c-4328-9b09-eee5dea88a8e
```
⚠️ **DEBE empezar con APP_USR-** (modo producción)

#### NEXT_PUBLIC_APP_URL (Production)
```
https://omnia-app.vercel.app
```

#### NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI (Production)
```
https://omnia-app.vercel.app/api/mercadopago/oauth/callback
```

---

## 🔧 Pasos para Configurar en Vercel

### 1. Ir al Dashboard

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto: **omnia-app**
3. Ve a: **Settings** → **Environment Variables**

---

### 2. Configurar Variables para Development (Prueba)

Para cada variable, sigue estos pasos:

1. Haz clic en **Add** o busca la variable
2. Ingresa el **Name** (ej: `MERCADOPAGO_ACCESS_TOKEN`)
3. Ingresa el **Value** (ej: `TEST-1806894141402209-...`)
4. **IMPORTANTE:** Selecciona **solo** el entorno **Development**
5. Haz clic en **Save**

**Repite para:**
- ✅ `MERCADOPAGO_ACCESS_TOKEN` = `TEST-1806894141402209-111615-607774a8d606f9a7200dc2e23b8e7b4d-143028270` (Development)
- ✅ `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` = `TEST-cc6d31a8-ff84-4644-98dd-e05c6740d95e` (Development)
- ✅ `NEXT_PUBLIC_APP_URL` = `https://omnia-app.vercel.app` (Development)
- ✅ `NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI` = `https://omnia-app.vercel.app/api/mercadopago/oauth/callback` (Development)

---

### 3. Configurar Variables para Preview (Prueba)

Para cada variable, sigue estos pasos:

1. Haz clic en **Add** o busca la variable
2. Ingresa el **Name** (ej: `MERCADOPAGO_ACCESS_TOKEN`)
3. Ingresa el **Value** (ej: `TEST-1806894141402209-...`)
4. **IMPORTANTE:** Selecciona **solo** el entorno **Preview**
5. Haz clic en **Save**

**Repite para:**
- ✅ `MERCADOPAGO_ACCESS_TOKEN` = `TEST-1806894141402209-111615-607774a8d606f9a7200dc2e23b8e7b4d-143028270` (Preview)
- ✅ `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` = `TEST-cc6d31a8-ff84-4644-98dd-e05c6740d95e` (Preview)
- ✅ `NEXT_PUBLIC_APP_URL` = `https://omnia-app.vercel.app` (Preview)
- ✅ `NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI` = `https://omnia-app.vercel.app/api/mercadopago/oauth/callback` (Preview)

---

### 4. Verificar Variables de Production (Mantenidas)

Las variables de **Production** ya deberían estar configuradas con valores de producción (APP_USR-). **NO las cambies**, solo verifica que existan:

- ✅ `MERCADOPAGO_ACCESS_TOKEN` = `APP_USR-...` (Production) ← **MANTENER**
- ✅ `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` = `APP_USR-...` (Production) ← **MANTENER**
- ✅ `NEXT_PUBLIC_APP_URL` = `https://omnia-app.vercel.app` (Production)
- ✅ `NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI` = `https://omnia-app.vercel.app/api/mercadopago/oauth/callback` (Production)

---

## 📊 Resultado Final

Después de configurar, deberías tener:

| Variable | Development | Preview | Production |
|----------|-------------|---------|------------|
| `MERCADOPAGO_ACCESS_TOKEN` | `TEST-...` ✅ | `TEST-...` ✅ | `APP_USR-...` ✅ |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | `TEST-...` ✅ | `TEST-...` ✅ | `APP_USR-...` ✅ |
| `NEXT_PUBLIC_APP_URL` | `https://omnia-app.vercel.app` | `https://omnia-app.vercel.app` | `https://omnia-app.vercel.app` |
| `NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI` | `https://omnia-app.vercel.app/api/mercadopago/oauth/callback` | `https://omnia-app.vercel.app/api/mercadopago/oauth/callback` | `https://omnia-app.vercel.app/api/mercadopago/oauth/callback` |

---

## ✅ Ventajas de Esta Configuración

1. ✅ **Development/Preview** → Usa credenciales de prueba (TEST-)
2. ✅ **Production** → Usa credenciales de producción (APP_USR-)
3. ✅ No mezclas entornos
4. ✅ Puedes probar en desarrollo sin afectar producción
5. ✅ Production siempre usa credenciales reales

---

## 🔍 Verificación

### Verificar Variables Configuradas

Puedes ver todas las variables configuradas con:

```bash
vercel env ls
```

O en el Dashboard de Vercel → Settings → Environment Variables

### Verificar en Logs

En los logs de Vercel deberías ver:

**Development/Preview (Prueba):**
```
📅 Creando suscripción de Mercado Pago (MODO PRUEBA)
✅ Token de prueba detectado. Modo testing activado.
```

**Production (Producción):**
```
📅 Creando suscripción de Mercado Pago (MODO PRODUCCIÓN)
✅ Token de producción detectado. Modo producción activado.
```

---

## 📝 Notas Importantes

1. **Variables Compartidas:**
   - `MERCADOPAGO_CLIENT_ID` → Puede ser la misma en todos los entornos
   - `MERCADOPAGO_CLIENT_SECRET` → Puede ser la misma en todos los entornos
   - `ENCRYPTION_KEY` → Debe ser la misma en todos los entornos

2. **URLs:**
   - Todas las URLs pueden apuntar a producción (`https://omnia-app.vercel.app`)
   - Los webhooks funcionan desde cualquier entorno

3. **Orden de Prioridad:**
   - Si una variable está configurada para múltiples entornos, Vercel usa la del entorno actual
   - Development → Usa variables de Development
   - Preview → Usa variables de Preview
   - Production → Usa variables de Production

---

## 🚀 Después de Configurar

1. Vercel **redesplegará automáticamente** cuando cambies variables
2. Cada entorno usará sus propias credenciales automáticamente
3. No necesitas cambiar código, Vercel maneja todo

