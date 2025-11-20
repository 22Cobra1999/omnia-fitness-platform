# 📋 Variables de Entorno para Vercel - COPIAR Y PEGAR

## 🎯 Variables para MODO PRUEBA (NUEVAS - con prefijo TEST_)

### ✅ Variable 1: TEST_MERCADOPAGO_ACCESS_TOKEN

**Nombre:** `TEST_MERCADOPAGO_ACCESS_TOKEN`  
**Valor:**
```
TEST-1806894141402209-111615-607774a8d606f9a7200dc2e23b8e7b4d-143028270
```
**Entorno:** Production (y también Preview, Development si quieres)  
**⚠️ IMPORTANTE:** Esta variable se usará automáticamente cuando esté disponible

---

### ✅ Variable 2: TEST_NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY

**Nombre:** `TEST_NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`  
**Valor:**
```
TEST-cc6d31a8-ff84-4644-98dd-e05c6740d95e
```
**Entorno:** Production (y también Preview, Development si quieres)  
**⚠️ IMPORTANTE:** Esta variable se usará automáticamente cuando esté disponible

---

## 📋 Instrucciones para Agregar en Vercel

### Paso 1: Ir al Dashboard
1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto: **omnia-app**
3. Ve a: **Settings** → **Environment Variables**

### Paso 2: Agregar Nueva Variable 1

1. Haz clic en **"Add New"** o **"Add Variable"**
2. **Key (Nombre):** 
   ```
   TEST_MERCADOPAGO_ACCESS_TOKEN
   ```
3. **Value (Valor):**
   ```
   TEST-1806894141402209-111615-607774a8d606f9a7200dc2e23b8e7b4d-143028270
   ```
4. **Environments:** Selecciona ✅ **Production** (y Preview/Development si quieres)
5. Haz clic en **"Save"**

---

### Paso 3: Agregar Nueva Variable 2

1. Haz clic en **"Add New"** o **"Add Variable"**
2. **Key (Nombre):** 
   ```
   TEST_NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
   ```
3. **Value (Valor):**
   ```
   TEST-cc6d31a8-ff84-4644-98dd-e05c6740d95e
   ```
4. **Environments:** Selecciona ✅ **Production** (y Preview/Development si quieres)
5. Haz clic en **"Save"**

---

## ✅ Variables que YA EXISTEN (NO modificar)

Estas variables **ya están configuradas** y se mantienen para producción:

- ✅ `MERCADOPAGO_ACCESS_TOKEN` (producción)
- ✅ `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` (producción)
- ✅ `MERCADOPAGO_CLIENT_ID` = `1806894141402209`
- ✅ `MERCADOPAGO_CLIENT_SECRET` = `7dtInztF6aQwAGQCfWk2XGdMbWBd54QS`
- ✅ `NEXT_PUBLIC_APP_URL` = `https://omnia-app.vercel.app`
- ✅ `NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI` = `https://omnia-app.vercel.app/api/mercadopago/oauth/callback`
- ✅ `ENCRYPTION_KEY` = `1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4`

---

## 🔄 Cómo Funciona

El código ahora busca primero las variables con prefijo `TEST_`:
1. Si existe `TEST_MERCADOPAGO_ACCESS_TOKEN` → usa esa (modo prueba)
2. Si NO existe → usa `MERCADOPAGO_ACCESS_TOKEN` (modo producción)

**Ventajas:**
- ✅ Mantienes las variables de producción intactas
- ✅ Puedes activar/desactivar modo prueba fácilmente
- ✅ No necesitas cambiar las variables de producción
- ✅ Más seguro y flexible

---

## 📊 Resumen Rápido

| Variable Nueva | Valor | Uso |
|---------------|-------|-----|
| `TEST_MERCADOPAGO_ACCESS_TOKEN` | `TEST-1806894141402209-111615-607774a8d606f9a7200dc2e23b8e7b4d-143028270` | Modo Prueba |
| `TEST_NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | `TEST-cc6d31a8-ff84-4644-98dd-e05c6740d95e` | Modo Prueba |

| Variable Existente | Estado |
|-------------------|--------|
| `MERCADOPAGO_ACCESS_TOKEN` | ✅ Mantener (producción) |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | ✅ Mantener (producción) |

---

## ✅ Después de Configurar

1. Vercel **redesplegará automáticamente** con las nuevas variables
2. El código detectará automáticamente que hay variables `TEST_*` y usará modo prueba
3. Puedes probar el flujo completo sin afectar producción

---

## 🔍 Verificar que Funciona

En los logs de Vercel deberías ver:
```
📅 Creando suscripción de Mercado Pago (MODO PRUEBA)
✅ Suscripción creada exitosamente
mode: PRUEBA
```

Si ves `MODO PRUEBA`, significa que está usando las variables de prueba correctamente.
