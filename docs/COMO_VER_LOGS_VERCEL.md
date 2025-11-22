# 📊 Cómo Ver los Logs de Vercel

## 🔍 Dónde Aparecen los Logs

### ❌ NO en la Consola del Navegador

Los logs del **backend** (servidor) **NO aparecen** en la consola del navegador (F12 → Console).

Solo los logs del **frontend** (cliente) aparecen en la consola del navegador.

---

## ✅ Dónde Ver los Logs del Backend

### Opción 1: Vercel Dashboard (Recomendado)

1. Ve a: https://vercel.com/franco-pomati-cutoffs-projects/omnia-app
2. Haz clic en **"Deployments"** (en el menú superior)
3. Selecciona el **último deployment** (el más reciente)
4. Haz clic en la pestaña **"Logs"** (o "Functions")
5. Verás todos los logs del servidor

**Los logs que verás**:
```
🚀 ========== INICIO CREATE PREFERENCE ==========
🔐 Autenticación: Usuario ...
🔍 ========== ANÁLISIS DE TOKENS ==========
📋 ========== CREANDO PREFERENCIA ==========
✅ ========== PREFERENCIA CREADA EXITOSAMENTE ==========
```

---

### Opción 2: Vercel CLI

```bash
# Ver logs en tiempo real
vercel logs omnia-app.vercel.app --follow

# Ver logs de una función específica
vercel logs omnia-app.vercel.app --function=api/mercadopago/checkout-pro/create-preference

# Ver logs de los últimos 100 eventos
vercel logs omnia-app.vercel.app --limit=100
```

---

### Opción 3: Vercel Inspect

```bash
# Inspeccionar un deployment específico
vercel inspect <deployment-url> --logs
```

---

## 🔍 Qué Logs Verás

### En Vercel (Backend)

Cuando hagas una compra, verás logs como:

```
🚀 ========== INICIO CREATE PREFERENCE ==========
🚀 Timestamp: 2024-11-21T...
🔐 Autenticación: Usuario abc123...
🔍 ========== ANÁLISIS DE TOKENS ==========
🔍 Marketplace Token es TEST: true
🔍 Usando preferencia simple (sin marketplace_fee): true
📋 ========== CREANDO PREFERENCIA ==========
📋 Activity ID: 93
📋 Total Amount: 10000
📋 Marketplace Fee: 1500
📋 Client Email: cliente@example.com
🚀 ========== ENVIANDO PREFERENCIA A MERCADO PAGO ==========
✅ ========== PREFERENCIA CREADA EXITOSAMENTE ==========
✅ Preference ID: 2992707264-abc123...
✅ Init Point: https://sandbox.mercadopago.com.ar/checkout/v1/redirect...
```

### En la Consola del Navegador (Frontend)

Solo verás logs del frontend, como:

```javascript
// Ejemplo de logs del frontend
console.log('Iniciando checkout...');
console.log('Redirigiendo a Mercado Pago...');
```

---

## 🧪 Cómo Probar y Ver los Logs

### Paso 1: Abrir Vercel Dashboard

1. Ve a: https://vercel.com/franco-pomati-cutoffs-projects/omnia-app
2. Haz clic en **"Deployments"**
3. Selecciona el **último deployment**

### Paso 2: Abrir la Pestaña de Logs

1. Haz clic en la pestaña **"Logs"** o **"Functions"**
2. Deberías ver los logs en tiempo real

### Paso 3: Hacer una Compra de Prueba

1. En otra pestaña, ve a: https://omnia-app.vercel.app
2. Inicia sesión como cliente
3. Selecciona una actividad
4. Haz clic en "Pagar con Mercado Pago"

### Paso 4: Ver los Logs

1. Vuelve a la pestaña de Vercel
2. Deberías ver los logs aparecer en tiempo real:
   - `🚀 ========== INICIO CREATE PREFERENCE ==========`
   - `🔍 ========== ANÁLISIS DE TOKENS ==========`
   - `✅ ========== PREFERENCIA CREADA EXITOSAMENTE ==========`

---

## 🔍 Filtrar Logs

### En Vercel Dashboard

Puedes filtrar los logs por:
- **Función**: `api/mercadopago/checkout-pro/create-preference`
- **Nivel**: Info, Warning, Error
- **Tiempo**: Última hora, día, semana

### En Vercel CLI

```bash
# Filtrar por función
vercel logs omnia-app.vercel.app --function=api/mercadopago/checkout-pro/create-preference

# Filtrar por nivel
vercel logs omnia-app.vercel.app --level=error

# Filtrar por texto
vercel logs omnia-app.vercel.app | grep "PREFERENCIA CREADA"
```

---

## 📋 Logs Importantes a Buscar

Cuando hagas una compra, busca estos logs:

### ✅ Logs de Éxito

```
🚀 ========== INICIO CREATE PREFERENCE ==========
🔍 Marketplace Token es TEST: true
🔍 Usando preferencia simple (sin marketplace_fee): true
✅ ========== PREFERENCIA CREADA EXITOSAMENTE ==========
✅ Preference ID: 2992707264-abc123...
```

### ❌ Logs de Error

```
❌ Error creando preferencia: ...
❌ Error inesperado: ...
```

---

## 🎯 Resumen

| Tipo de Log | Dónde Aparece |
|-------------|---------------|
| **Backend** (console.log en servidor) | ✅ Vercel Dashboard / Vercel CLI |
| **Frontend** (console.log en cliente) | ✅ Consola del navegador (F12) |
| **Errores del navegador** | ✅ Consola del navegador (F12) |

---

## 💡 Tips

1. **Mantén abierta la pestaña de Vercel** mientras pruebas
2. **Filtra por función** para ver solo los logs relevantes
3. **Usa `--follow` en Vercel CLI** para ver logs en tiempo real
4. **Busca los emojis** (🚀, 🔍, ✅, ❌) para encontrar logs importantes

---

**Última actualización**: Guía para ver logs en Vercel

