# ⚙️ Configurar Variables de Entorno en Vercel (MODO PRUEBA)

## 🎯 Pasos para Configurar

### 1. Ir al Dashboard de Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto: **omnia-app**
3. Ve a: **Settings** → **Environment Variables**

---

## 📋 Variables a Configurar (MODO PRUEBA)

### ✅ Variable 1: MERCADOPAGO_ACCESS_TOKEN

**⚠️ IMPORTANTE: Debe empezar con `TEST-` para modo prueba**

1. Busca la variable `MERCADOPAGO_ACCESS_TOKEN`
2. Haz clic en **Edit** o **Update**
3. Cambia el valor a:
   ```
   TEST-1806894141402209-111615-607774a8d606f9a7200dc2e23b8e7b4d-143028270
   ```
4. Verifica que el entorno sea **Production**
5. Haz clic en **Save**

---

### ✅ Variable 2: NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY

**⚠️ IMPORTANTE: Debe empezar con `TEST-` para modo prueba**

1. Busca la variable `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
2. Haz clic en **Edit** o **Update**
3. Cambia el valor a:
   ```
   TEST-cc6d31a8-ff84-4644-98dd-e05c6740d95e
   ```
4. Verifica que el entorno sea **Production**
5. Haz clic en **Save**

---

### ✅ Variable 3: NEXT_PUBLIC_APP_URL

1. Busca la variable `NEXT_PUBLIC_APP_URL`
2. Haz clic en **Edit** o **Update**
3. Cambia el valor a:
   ```
   https://omnia-app.vercel.app
   ```
4. Verifica que el entorno sea **Production**
5. Haz clic en **Save**

---

### ✅ Variable 4: NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI

1. Busca la variable `NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI`
2. Haz clic en **Edit** o **Update**
3. Cambia el valor a:
   ```
   https://omnia-app.vercel.app/api/mercadopago/oauth/callback
   ```
4. Verifica que el entorno sea **Production**
5. Haz clic en **Save**

---

## ✅ Verificación

Después de configurar todas las variables:

1. Vercel **redesplegará automáticamente** con las nuevas variables
2. Puedes verificar el deploy en: **Deployments**
3. Los logs deberían mostrar:
   ```
   ✅ Token de prueba detectado. Modo testing activado.
   ```

---

## 📋 Resumen de Variables

| Variable | Valor | ⚠️ Requisito |
|----------|-------|--------------|
| `MERCADOPAGO_ACCESS_TOKEN` | `TEST-1806894141402209-111615-607774a8d606f9a7200dc2e23b8e7b4d-143028270` | **DEBE empezar con TEST-** |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | `TEST-cc6d31a8-ff84-4644-98dd-e05c6740d95e` | **DEBE empezar con TEST-** |
| `NEXT_PUBLIC_APP_URL` | `https://omnia-app.vercel.app` | URL de producción |
| `NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI` | `https://omnia-app.vercel.app/api/mercadopago/oauth/callback` | URL de producción |

---

## ⚠️ Variables que NO Necesitas Cambiar

Estas variables ya están configuradas y funcionan tanto en prueba como producción:

- ✅ `MERCADOPAGO_CLIENT_ID` = `1806894141402209`
- ✅ `MERCADOPAGO_CLIENT_SECRET` = `7dtInztF6aQwAGQCfWk2XGdMbWBd54QS`
- ✅ `ENCRYPTION_KEY` = `1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4`

---

## 🚀 Después de Configurar

1. **Espera** a que Vercel redesplegue automáticamente (1-2 minutos)
2. **Verifica** que el nuevo deploy se complete exitosamente
3. **Prueba** el flujo completo siguiendo: `docs/TESTING_SUSCRIPCIONES.md`

---

## 🔍 Verificar que Funciona

Puedes verificar en los logs de Vercel que el sistema detecte el modo prueba:

```bash
# En los logs deberías ver:
📅 Creando suscripción de Mercado Pago (MODO PRUEBA)
✅ Suscripción creada exitosamente
mode: PRUEBA
```

Si ves `MODO PRUEBA` o `PRUEBA` en los logs, significa que está funcionando correctamente.

