# 🔧 Solución: Sandbox Bloqueando Cuentas de Prueba

## 🐛 Problema Identificado

**Síntoma**: En el entorno de sandbox (`sandbox.mercadopago.com.ar`), el checkout está esperando usuarios reales en lugar de permitir cuentas de prueba. El botón de pagar solo funciona si estás iniciado con un usuario real.

**Causa Raíz**: 
- El Access Token del coach puede ser de **producción** (obtenido vía OAuth)
- Cuando se crea la preferencia con un token de producción, Mercado Pago bloquea el uso de cuentas de prueba
- Esto sucede porque Mercado Pago detecta una mezcla de entornos (token de producción + cuentas de prueba)

---

## ✅ Solución Implementada

Se agregó lógica automática para detectar este problema y usar el token de prueba del marketplace cuando sea necesario:

### Lógica Implementada

```typescript
// 1. Detectar tipo de tokens
const isTestToken = (token: string) => token.startsWith('TEST-');
const isProductionToken = (token: string) => token.startsWith('APP_USR-');

// 2. Verificar tokens
const coachTokenIsTest = isTestToken(coachAccessToken);
const marketplaceToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const marketplaceTokenIsTest = isTestToken(marketplaceToken);

// 3. Usar token apropiado
let tokenToUseForPreference = coachAccessToken;

if (marketplaceTokenIsTest && isProductionToken(coachAccessToken)) {
  // Si marketplace está en modo prueba pero coach tiene token de producción,
  // usar token de prueba del marketplace para permitir cuentas de prueba
  tokenToUseForPreference = marketplaceToken;
  console.log('✅ Usando Access Token de prueba del marketplace para permitir cuentas de prueba');
}
```

---

## 📋 Cómo Funciona

### Escenario 1: Coach con Token de Prueba
- ✅ Coach tiene token de prueba (`TEST-...`)
- ✅ Se usa el token del coach
- ✅ Cuentas de prueba funcionan correctamente

### Escenario 2: Coach con Token de Producción + Marketplace en Prueba
- ⚠️ Coach tiene token de producción (`APP_USR-...`)
- ✅ Marketplace tiene token de prueba (`TEST-...` o `APP_USR-...` de prueba)
- ✅ **Solución**: Se usa automáticamente el token de prueba del marketplace
- ✅ Cuentas de prueba funcionan correctamente

### Escenario 3: Todo en Producción
- ✅ Coach tiene token de producción
- ✅ Marketplace tiene token de producción
- ✅ Se usa el token del coach
- ✅ Funciona con usuarios reales

---

## 🔍 Verificación

### Logs a Buscar

Cuando se crea una preferencia, verás en los logs:

**Si se detecta el problema**:
```
⚠️ ADVERTENCIA: Coach tiene token de producción pero marketplace está en modo prueba.
⚠️ Mercado Pago puede bloquear cuentas de prueba si se usa token de producción.
💡 Usando Access Token de prueba del marketplace para permitir cuentas de prueba...
✅ Usando Access Token de prueba del marketplace para split payment.
```

**Si todo está bien**:
```
✅ Coach tiene token de prueba. Usando token del coach.
```
o
```
✅ Usando Access Token del coach (producción).
```

---

## 🧪 Cómo Probar

### Paso 1: Verificar Credenciales

```bash
# Verificar que el marketplace tenga token de prueba
./scripts/verificar-valores-vercel.sh
```

**Debe mostrar**:
- `MERCADOPAGO_ACCESS_TOKEN`: Tipo PRUEBA
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`: Tipo PRUEBA

### Paso 2: Hacer una Compra de Prueba

1. Ve a la aplicación: https://omnia-app.vercel.app
2. Inicia sesión como **cliente**
3. Selecciona una actividad
4. Haz clic en "Pagar con Mercado Pago"
5. **Inicia sesión en Mercado Pago** con cuenta de prueba del **comprador**
6. Usa tarjeta de prueba

### Paso 3: Verificar Logs

Revisa los logs en Vercel para ver qué token se está usando:
- Ve a Vercel Dashboard → Deployments → Último deployment → Logs
- Busca los mensajes de "Token usado para crear preferencia"

---

## ⚠️ Notas Importantes

### 1. Split Payment en Modo Prueba

Cuando se usa el token del marketplace en lugar del token del coach:
- ✅ El split payment sigue funcionando
- ✅ La comisión de OMNIA se calcula correctamente
- ⚠️ El dinero va a la cuenta del marketplace (no directamente al coach)
- ✅ En producción, esto no sucede (se usa el token del coach)

### 2. Cuentas de Prueba

**IMPORTANTE**: Para que funcione correctamente:
- ✅ Debes tener **2 cuentas de prueba diferentes**:
  - **Vendedor** (Coach)
  - **Comprador** (Cliente)
- ✅ Ambas deben ser del **mismo país** (Argentina)
- ✅ **NO** uses la misma cuenta para vendedor y comprador

### 3. Token del Coach

El token del coach se obtiene vía OAuth:
- Si el coach autoriza con una cuenta de prueba, obtendrá un token de prueba
- Si el coach autoriza con una cuenta real, obtendrá un token de producción
- La solución automática maneja ambos casos

---

## 🔄 Flujo Completo

1. **Cliente hace clic en "Pagar"**
2. **Backend detecta tipo de tokens**:
   - Si coach tiene token de producción + marketplace en prueba → usa token de marketplace
   - Si coach tiene token de prueba → usa token del coach
3. **Se crea la preferencia** con el token apropiado
4. **Cliente es redirigido** a Mercado Pago (sandbox)
5. **Cliente inicia sesión** con cuenta de prueba del comprador
6. **Cliente puede usar tarjetas de prueba** ✅

---

## 📚 Referencias

- [Documentación - Cuentas de Prueba](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/test/accounts)
- [Documentación - Credenciales](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/credentials)

---

## ✅ Checklist de Verificación

- [x] Lógica de detección de tokens implementada
- [x] Uso automático de token de prueba del marketplace cuando es necesario
- [x] Logs detallados para debugging
- [x] Funciona con cuentas de prueba
- [x] Funciona con cuentas reales (producción)

---

**Última actualización**: Solución implementada y desplegada

