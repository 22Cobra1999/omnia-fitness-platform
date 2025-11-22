# ✅ Checklist Final: Prueba de Compra con Mercado Pago

## 🎯 Estado: ¿Todo Listo?

### ✅ Configuración del Sistema

- [x] **Endpoint de Checkout Pro** implementado
- [x] **Componente de botón** implementado
- [x] **Páginas de retorno** (success, failure, pending) configuradas
- [x] **Webhook** configurado
- [x] **Logs detallados** agregados
- [x] **Detección de modo prueba** implementada
- [x] **Marketplace fee** configurado (deshabilitado en prueba)

### ✅ Credenciales Configuradas

- [x] **Credenciales de prueba** configuradas en Vercel
- [x] **Variables de entorno** correctas
- [x] **Deploy en producción** realizado

### ✅ Cuentas de Prueba

- [x] **Cuenta de comprador** creada (`totti1`)
- [x] **Cuenta de vendedor** creada (`ronaldinho`)
- [x] **Cuenta de marketplace** creada (`omniav1`)

---

## 🔑 Credenciales por Parte

### 1️⃣ Marketplace/Integrador (OMNIA)

**Cuenta**: `omniav1`
- **User ID**: `2995219179`
- **Usuario**: `TESTUSER5483...`
- **Contraseña**: `BoZ82j4ZmY`
- **Rol**: Integrador/Marketplace
- **País**: Argentina

**Credenciales en Vercel**:
- `MERCADOPAGO_ACCESS_TOKEN`: `APP_USR-8497664518687621-112020-b8d6314ad9be3f5f9b55182b157921c1-2995219181`
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`: `APP_USR-f5589935-8dea-4963-af32-b0f57a9ad7fb`
- `MERCADOPAGO_CLIENT_ID`: `1806894141402209`
- `MERCADOPAGO_CLIENT_SECRET`: `7dtInztF6aQwAGQCfWk2XGdMbWBd54QS`

**Uso**: Esta cuenta es la que recibe la comisión del marketplace (en producción).

---

### 2️⃣ Vendedor/Coach

**Cuenta**: `ronaldinho`
- **User ID**: `2995219181`
- **Usuario**: `TESTUSER4826...` (ver en panel MP)
- **Contraseña**: `VxvptDWun9`
- **Rol**: Vendedor/Coach
- **País**: Argentina

**Uso**: 
- Esta cuenta debe estar **conectada vía OAuth** en OMNIA
- Es la cuenta que **vende** las actividades
- Recibe el monto menos la comisión del marketplace

**Requisito**: El coach debe haber autorizado a OMNIA mediante OAuth.

---

### 3️⃣ Comprador/Cliente

**Cuenta**: `totti1`
- **User ID**: `2992707264`
- **Usuario**: `TESTUSER4821...` (ver en panel MP)
- **Contraseña**: `AlpFFZDyZw` (o la que tengas configurada)
- **Rol**: Comprador/Cliente
- **País**: Argentina

**Uso**: 
- Esta cuenta es la que **hace la compra**
- Debe iniciar sesión en **OMNIA** como cliente
- Debe iniciar sesión en **Mercado Pago** durante el checkout

---

## 🧪 Pasos para la Prueba

### Paso 1: Verificar Configuración

1. **Verificar credenciales en Vercel**:
   ```bash
   ./scripts/verificar-valores-vercel.sh
   ```

2. **Verificar que el coach esté conectado**:
   - El coach `ronaldinho` debe haber autorizado a OMNIA vía OAuth
   - Debe existir un registro en `coach_mercadopago_credentials`

### Paso 2: Iniciar Sesión en OMNIA

1. Ve a: https://omnia-app.vercel.app
2. **Inicia sesión** con una cuenta de **cliente** (no coach)
3. Si no tienes cuenta de cliente, créala primero

### Paso 3: Seleccionar Actividad

1. Busca una actividad del coach `ronaldinho` (User ID: `2995219181`)
2. Haz clic en **"Comprar"** o **"Ver detalles"**
3. Selecciona **"Mercado Pago"** como método de pago
4. Haz clic en **"Pagar con Mercado Pago"**

### Paso 4: Iniciar Sesión en Mercado Pago

1. Serás redirigido a Mercado Pago
2. **Inicia sesión** con la cuenta de prueba del **comprador**:
   - Usuario: `TESTUSER4821...` (totti1)
   - Contraseña: `AlpFFZDyZw` (o la que tengas)

**⚠️ IMPORTANTE**: 
- Debes usar la cuenta del **comprador** (`totti1`), NO la del vendedor
- Si Mercado Pago solicita validación por email, usa los últimos 6 dígitos del User ID: `2707264`

### Paso 5: Completar el Pago

1. Selecciona **"Tarjeta de crédito"** o **"Tarjeta de débito"**
2. Ingresa los datos de la tarjeta de prueba:

   **Para pago aprobado**:
   - Número: `5031 7557 3453 0604`
   - CVV: `123` (**borrar y escribir manualmente**)
   - Vencimiento: `11/30`
   - Nombre del titular: `APRO`
   - DNI: `12345678`

3. **IMPORTANTE**: Si el CVV aparece pre-llenado, **bórralo y escríbelo manualmente**

4. Haz clic en **"Pagar"**

### Paso 6: Verificar Resultado

**Si el pago es aprobado**:
- ✅ Serás redirigido a `/payment/success`
- ✅ Verás un mensaje de confirmación
- ✅ El enrollment se creará en la base de datos

**Si el pago es rechazado**:
- ❌ Serás redirigido a `/payment/failure`
- ❌ Verás un mensaje de error

**Si el pago está pendiente**:
- ⏳ Serás redirigido a `/payment/pending`
- ⏳ Verás instrucciones para completar el pago

---

## 🔍 Verificación en Logs

### Logs a Buscar en Vercel

Cuando hagas la compra, busca en los logs:

```
🚀 ========== INICIO CREATE PREFERENCE ==========
🔐 Autenticación: Usuario ...
🔍 ========== ANÁLISIS DE TOKENS ==========
🔍 Marketplace Token es TEST: true
🔍 Usando preferencia simple (sin marketplace_fee): true
📋 ========== CREANDO PREFERENCIA ==========
📋 Marketplace Fee: 1500 (calculado pero no incluido en prueba)
🚀 ========== ENVIANDO PREFERENCIA A MERCADO PAGO ==========
✅ ========== PREFERENCIA CREADA EXITOSAMENTE ==========
```

### Verificar que Funciona

- ✅ `Marketplace Token es TEST: true` → Confirma que está en modo prueba
- ✅ `Usando preferencia simple (sin marketplace_fee): true` → Confirma que NO se incluye marketplace_fee
- ✅ `Preferencia creada exitosamente` → Confirma que la preferencia se creó

---

## ⚠️ Problemas Comunes

### Botón Deshabilitado

**Causas posibles**:
- ❌ Usando cuenta del vendedor en lugar del comprador
- ❌ CVV pre-llenado (debe escribirse manualmente)
- ❌ Monto muy bajo (< $1)
- ❌ Información del payer incompleta

**Solución**:
- ✅ Usa cuenta del comprador (`totti1`)
- ✅ Borra y reescribe el CVV manualmente
- ✅ Verifica que el monto sea válido
- ✅ Revisa los logs para ver qué está pasando

### No Aparecen Tarjetas

**Causas posibles**:
- ❌ Credenciales incorrectas
- ❌ Cuenta incorrecta en Mercado Pago
- ❌ Monto inválido

**Solución**:
- ✅ Verifica credenciales en Vercel
- ✅ Usa cuenta de prueba del comprador
- ✅ Verifica que el monto sea válido

---

## 📋 Resumen de Credenciales

| Parte | Cuenta | User ID | Usuario | Contraseña |
|-------|--------|---------|---------|------------|
| **Marketplace** | `omniav1` | `2995219179` | `TESTUSER5483...` | `BoZ82j4ZmY` |
| **Vendedor** | `ronaldinho` | `2995219181` | `TESTUSER4826...` | `VxvptDWun9` |
| **Comprador** | `totti1` | `2992707264` | `TESTUSER4821...` | `AlpFFZDyZw` |

---

## 🎯 Checklist Final Antes de Probar

- [ ] Credenciales de prueba configuradas en Vercel
- [ ] Coach `ronaldinho` conectado vía OAuth
- [ ] Cuenta de cliente creada en OMNIA
- [ ] Cuenta de comprador (`totti1`) disponible
- [ ] Tarjeta de prueba lista (`5031 7557 3453 0604`)
- [ ] Logs de Vercel accesibles para verificar

---

## 🚀 ¡Listo para Probar!

Sigue los pasos anteriores y verifica los logs. Si encuentras algún problema, comparte los logs y lo revisamos.

---

**Última actualización**: Checklist completo para prueba de compra

