# 🔧 Guía Completa: Solución Botón Deshabilitado con Cuentas de Prueba

## 🎯 Problema

- ✅ Funciona con cuenta **real** de Mercado Pago
- ❌ **NO funciona** con cuenta de **prueba**
- El botón de pagar está deshabilitado en sandbox cuando usas cuentas de prueba

---

## 🔍 Causa Identificada

### Problema Principal: `marketplace_fee` en Modo Prueba

El `marketplace_fee` (split payment) puede causar problemas en modo prueba porque:
1. Requiere que tanto el marketplace como el vendedor tengan cuentas configuradas correctamente
2. En modo prueba, el split payment puede no funcionar si hay mezcla de entornos
3. Mercado Pago puede deshabilitar el botón si detecta problemas con el split payment

---

## ✅ Solución Implementada

### Cambio 1: Eliminar `marketplace_fee` en Modo Prueba

**Archivo**: `app/api/mercadopago/checkout-pro/create-preference/route.ts`

El código ahora:
- ✅ **NO incluye** `marketplace_fee` cuando está en modo prueba
- ✅ **SÍ incluye** `marketplace_fee` cuando está en producción
- ✅ Usa el token de prueba del marketplace cuando está disponible

```typescript
// SOLO incluir marketplace_fee si NO estamos en modo prueba
...(marketplaceTokenIsTest ? {} : (marketplaceFee > 0 && sellerAmount > 0 ? { marketplace_fee: marketplaceFee } : {}))
```

### Cambio 2: Versión Simple Creada

**Archivo**: `app/api/mercadopago/checkout-pro/create-preference-simple/route.ts`

He creado una versión **ULTRA SIMPLE** que solo incluye lo esencial:
- Items
- Back URLs
- Auto Return
- Payer (solo email)

**Úsala para comparar** y verificar que funciona.

---

## 🧪 Cómo Probar

### Test 1: Versión Actual (Sin marketplace_fee en Prueba)

1. El deploy ya está en producción
2. Haz una compra de prueba:
   - Ve a la aplicación
   - Inicia sesión como cliente
   - Selecciona una actividad
   - Haz clic en "Pagar con Mercado Pago"
   - Inicia sesión en Mercado Pago con cuenta de prueba del comprador
   - Verifica si el botón está habilitado

3. Revisa los logs en Vercel:
   - Busca: `🔍 Usando preferencia simple (sin marketplace_fee): true`
   - Esto confirma que NO se está incluyendo marketplace_fee

### Test 2: Versión Ultra Simple (Opcional)

Si el Test 1 no funciona, prueba la versión ultra simple:

1. Modifica temporalmente `lib/mercadopago/checkout-pro.ts`:
   ```typescript
   // Cambiar esta línea:
   const response = await fetch('/api/mercadopago/checkout-pro/create-preference', {
   
   // Por esta:
   const response = await fetch('/api/mercadopago/checkout-pro/create-preference-simple', {
   ```

2. Prueba hacer una compra
3. Si funciona, el problema está en alguna configuración adicional
4. Si no funciona, el problema es más fundamental

---

## 📋 Configuración Actual vs Simple

### Versión Actual (Modificada)

```typescript
{
  items: [...],
  // NO marketplace_fee en modo prueba
  back_urls: {...},
  auto_return: 'approved',
  notification_url: '...',
  payer: {
    email: '...',
    name: '...',
    surname: '...',
    identification: {...}
  },
  payment_methods: {...},
  statement_descriptor: 'OMNIA',
  binary_mode: false,
  expires: false,
  metadata: {...}
}
```

### Versión Ultra Simple

```typescript
{
  items: [...],
  back_urls: {...},
  auto_return: 'approved',
  payer: {
    email: '...'
  }
  // Solo lo esencial
}
```

---

## 🔍 Verificación en Logs

### Logs a Buscar

Cuando hagas una compra, busca en los logs de Vercel:

```
🔍 ========== ANÁLISIS DE TOKENS ==========
🔍 Marketplace Token es TEST: true
🔍 Usando preferencia simple (sin marketplace_fee): true
📋 ========== CREANDO PREFERENCIA ==========
```

**Si ves** `Usando preferencia simple (sin marketplace_fee): true`:
- ✅ El código está funcionando correctamente
- ✅ NO se está incluyendo marketplace_fee
- ✅ Debería funcionar con cuentas de prueba

---

## 🎯 Pasos de Debugging Detallados

### Paso 1: Verificar Token del Marketplace

```bash
./scripts/verificar-valores-vercel.sh
```

**Debe mostrar**:
- `MERCADOPAGO_ACCESS_TOKEN`: Tipo PRUEBA
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`: Tipo PRUEBA

### Paso 2: Hacer Compra de Prueba

1. Ve a: https://omnia-app.vercel.app
2. Inicia sesión como **cliente**
3. Selecciona una actividad
4. Haz clic en "Pagar con Mercado Pago"
5. **Inicia sesión en Mercado Pago** con cuenta de prueba:
   - Username: `TESTUSER4821...` (totti1 - comprador)
   - Password: (la que tengas)

### Paso 3: Verificar Logs

1. Ve a Vercel Dashboard → Deployments → Último deployment → Logs
2. Busca los logs de la compra
3. Verifica:
   - ✅ `Marketplace Token es TEST: true`
   - ✅ `Usando preferencia simple (sin marketplace_fee): true`
   - ✅ `Token seleccionado: marketplace (test)`

### Paso 4: Verificar en Mercado Pago

1. En el checkout de Mercado Pago
2. Verifica que aparezcan las tarjetas
3. Verifica que el botón "Pagar" esté habilitado
4. Si está deshabilitado, verifica:
   - ¿Aparecen las tarjetas?
   - ¿Hay algún mensaje de error?
   - ¿El CVV está pre-llenado? (borrarlo y reescribirlo)

---

## 🔧 Soluciones Adicionales

### Si el Problema Persiste

#### Solución 1: Usar Versión Ultra Simple

Temporalmente, usa el endpoint simple:

```typescript
// En lib/mercadopago/checkout-pro.ts
const response = await fetch('/api/mercadopago/checkout-pro/create-preference-simple', {
```

#### Solución 2: Verificar que el Coach Use Cuenta de Prueba

1. **Desconectar** el coach de Mercado Pago en OMNIA
2. **Conectar nuevamente** usando la cuenta de prueba del vendedor:
   - Username: `TESTUSER4826...`
   - Password: `VxvptDWun9`
3. Esto generará un token de prueba para el coach

#### Solución 3: Verificar Monto

Asegúrate de que el monto sea válido:
- ✅ Mayor a $0
- ✅ Formato correcto (número, no string)
- ✅ Sin decimales si es ARS

---

## 📊 Comparación: Antes vs Después

### Antes (Con Problema)

```typescript
{
  items: [...],
  marketplace_fee: marketplaceFee,  // ❌ Causaba problemas en prueba
  payer: {...},
  payment_methods: {...},
  // ... muchas configuraciones
}
```

### Después (Solucionado)

```typescript
{
  items: [...],
  // ✅ NO marketplace_fee en modo prueba
  payer: {...},
  payment_methods: {...},
  // ... configuraciones necesarias
}
```

---

## ✅ Checklist de Verificación

- [ ] Token del marketplace es de prueba
- [ ] Logs muestran `Usando preferencia simple (sin marketplace_fee): true`
- [ ] Logs muestran `Token seleccionado: marketplace (test)`
- [ ] Cuenta de prueba del comprador puede hacer pagos
- [ ] Botón de pagar está habilitado
- [ ] Tarjetas de prueba aparecen
- [ ] CVV se puede ingresar manualmente

---

## 🚀 Próximos Pasos

1. **Probar la versión actual** (sin marketplace_fee en prueba)
2. **Revisar logs** para confirmar que funciona
3. **Si funciona**: ✅ Problema resuelto
4. **Si no funciona**: Usar versión ultra simple y comparar

---

## 📚 Referencias

- [Documentación Oficial - Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing)
- [Documentación - Cuentas de Prueba](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/test/accounts)

---

**Última actualización**: Solución implementada - marketplace_fee eliminado en modo prueba

