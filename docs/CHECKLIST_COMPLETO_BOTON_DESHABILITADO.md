# ✅ Checklist Completo: Botón de Pago Deshabilitado

## 🔍 Verificaciones del Frontend (Checkout Pro - No aplica SDK)

### ⚠️ Nota Importante
**Estamos usando Checkout Pro**, que **redirige a Mercado Pago**. NO usamos el SDK de Mercado Pago en el frontend, así que estos puntos NO aplican:
- ❌ SDK JS no cargado (no usamos SDK)
- ❌ Inicialización del SDK (no usamos SDK)
- ❌ Public Key en frontend (no se usa en Checkout Pro)

**Checkout Pro funciona así**:
1. Backend crea preferencia → Retorna `init_point`
2. Frontend redirige a `init_point` → Usuario paga en Mercado Pago
3. Mercado Pago redirige de vuelta → Páginas de success/failure

---

## ✅ Verificaciones del Backend (CRÍTICAS)

### 1. **Creación de Preferencia - Código 200**

**Verificar**:
- [ ] El endpoint `/api/mercadopago/checkout-pro/create-preference` retorna código 200
- [ ] La respuesta incluye `init_point` válido
- [ ] No hay errores en los logs del servidor

**Cómo verificar**:
```bash
# En Vercel Dashboard → Deployments → Logs
# Buscar: "✅ Preferencia creada exitosamente"
```

### 2. **Monto y Moneda Correctos**

**Verificar en los logs**:
- [ ] `totalAmount > 0` (debe ser mayor a 0)
- [ ] `currency_id: 'ARS'` (moneda correcta)
- [ ] `unit_price` del item es igual a `totalAmount`

**Log esperado**:
```json
{
  "totalAmount": 10000,
  "items": [{
    "unit_price": 10000,
    "currency_id": "ARS"
  }]
}
```

### 3. **Datos del Payer Completos**

**Verificar en los logs**:
- [ ] `payer.email` está presente y es válido
- [ ] `payer.name` está presente (o tiene fallback 'Cliente')
- [ ] `payer.surname` está presente (o tiene fallback 'OMNIA')
- [ ] `payer.phone` (opcional pero recomendado)
- [ ] `payer.identification` (opcional pero puede ser requerido)

**Log esperado**:
```json
{
  "payer": {
    "email": "usuario@ejemplo.com",
    "name": "Nombre",
    "surname": "Apellido",
    "hasPhone": true/false,
    "hasIdentification": true/false
  }
}
```

### 4. **Credenciales Correctas**

**Verificar**:
- [ ] `MERCADOPAGO_ACCESS_TOKEN` está configurado en Vercel
- [ ] El token es válido y no ha expirado
- [ ] El token corresponde al ambiente correcto (producción para cuenta de prueba)

**Verificar en Vercel**:
```bash
vercel env ls production | grep MERCADOPAGO_ACCESS_TOKEN
```

**Debería mostrar**:
```
MERCADOPAGO_ACCESS_TOKEN    Encrypted    Production
```

---

## 🔍 Verificaciones del Checkout de Mercado Pago

### 1. **CVV Manual (MÁS IMPORTANTE)**

**Problema más común**: CVV prellenado

**Solución**:
- [ ] Borrar completamente el CVV prellenado
- [ ] Escribir "123" manualmente
- [ ] El botón debería habilitarse automáticamente

### 2. **Cuenta de Prueba del Comprador**

**Verificar**:
- [ ] Estás usando una cuenta de prueba del **comprador** diferente a la del vendedor
- [ ] La cuenta del comprador tiene saldo o tarjetas de prueba configuradas

**Cómo crear**:
1. Ve a Mercado Pago Developers → Tu aplicación
2. Ve a "Cuentas de prueba"
3. Crea una cuenta de prueba del comprador

### 3. **Tarjetas de Prueba**

**Verificar**:
- [ ] Estás usando las tarjetas de prueba oficiales de Mercado Pago
- [ ] Los datos de la tarjeta son correctos (número, CVV, fecha de vencimiento)

**Tarjetas de prueba** (Argentina):
- Visa: 4509 9535 6623 3704 (CVV: 123)
- Mastercard: 5031 7557 3453 0604 (CVV: 123)

### 4. **Cache y Cookies**

**Probar**:
- [ ] Limpiar cache y cookies del navegador
- [ ] Probar en ventana incógnito
- [ ] Probar en otro navegador

---

## 🔍 Verificaciones de la Preferencia

### 1. **Estructura de la Preferencia**

**Verificar en los logs** (buscar: `🔍 Preferencia completa que se enviará a Mercado Pago`):

```json
{
  "items": [{
    "id": "123",
    "title": "Actividad",
    "quantity": 1,
    "unit_price": 10000,
    "currency_id": "ARS"
  }],
  "payer": {
    "email": "usuario@ejemplo.com",
    "name": "Nombre",
    "surname": "Apellido"
  },
  "payment_methods": {
    "excluded_payment_methods": [],
    "excluded_payment_types": [],
    "installments": 12,
    "default_installments": 1
  },
  "back_urls": {
    "success": "https://omnia-app.vercel.app/payment/success",
    "failure": "https://omnia-app.vercel.app/payment/failure",
    "pending": "https://omnia-app.vercel.app/payment/pending"
  },
  "auto_return": "approved",
  "notification_url": "https://omnia-app.vercel.app/api/mercadopago/webhook",
  "statement_descriptor": "OMNIA",
  "binary_mode": false,
  "expires": false
}
```

### 2. **Marketplace Fee**

**Verificar**:
- [ ] Si `marketplaceFee > 0`, verificar que el coach tenga cuenta de marketplace configurada
- [ ] Si hay problemas, probar temporalmente sin `marketplace_fee`

**Log esperado**:
```json
{
  "marketplaceFee": 1500,
  "sellerAmount": 8500,
  "hasMarketplaceFee": true
}
```

---

## 🚨 Problemas Comunes y Soluciones

### Problema 1: CVV Prellenado
**Solución**: Borrar y reescribir el CVV manualmente

### Problema 2: Preferencia no se crea (Error 500)
**Solución**: Revisar logs del servidor, verificar credenciales

### Problema 3: init_point no válido
**Solución**: Verificar que la preferencia se creó correctamente, revisar logs

### Problema 4: Cuenta de prueba incorrecta
**Solución**: Usar cuenta de prueba del comprador diferente a la del vendedor

### Problema 5: Marketplace Fee en modo test
**Solución**: Verificar configuración del marketplace o probar sin `marketplace_fee`

---

## 📋 Pasos de Debugging (En Orden)

### Paso 1: Verificar Logs del Servidor
```bash
# En Vercel Dashboard → Deployments → Último deployment → Logs
# Buscar: "📋 Creando preferencia con los siguientes datos"
```

### Paso 2: Verificar que la Preferencia se Crea
```bash
# Buscar en logs: "✅ Preferencia creada exitosamente"
# Verificar que tiene initPoint válido
```

### Paso 3: Probar CVV Manual
- Borrar CVV prellenado
- Escribir "123" manualmente
- Verificar que el botón se habilita

### Paso 4: Verificar Cuenta de Prueba
- Usar cuenta de prueba del comprador
- Verificar que tiene tarjetas de prueba configuradas

### Paso 5: Limpiar Cache
- Limpiar cache y cookies
- Probar en ventana incógnito

---

## 🔗 Enlaces Útiles

- [Documentación Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing)
- [Tarjetas de Prueba](https://www.mercadopago.com.ar/developers/es/guides/additional-content/your-integrations/test-cards)
- [Guía de Pruebas](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/integration-test)

---

## 📞 Si el Problema Persiste

1. **Comparte los logs del servidor** (de Vercel)
2. **Comparte los logs de la consola del navegador**
3. **Indica qué pasos del checklist completaste**
4. **Menciona si probaste el CVV manual**

