# 🧪 Realizar Compras de Prueba - Mercado Pago

## 📋 Guía Completa para Probar Pagos

Esta guía te ayudará a realizar compras de prueba usando tarjetas de prueba de Mercado Pago para verificar que la integración funciona correctamente.

---

## ✅ Prerequisitos

1. **Credenciales de prueba configuradas** en Vercel
2. **Cuentas de prueba creadas**:
   - Cuenta de **Vendedor** (Coach)
   - Cuenta de **Comprador** (Cliente)
3. **Aplicación desplegada** en Vercel

---

## 💳 Tarjetas de Prueba para Argentina (MLA)

### Tarjetas de Crédito

| Tipo | Bandera | Número | CVV | Vencimiento | Nombre Titular |
|------|---------|--------|-----|-------------|----------------|
| ✅ **Aprobada** | Mastercard | `5031 7557 3453 0604` | `123` | `11/30` | `APRO` |
| ✅ **Aprobada** | Visa | `4509 9535 6623 3704` | `123` | `11/30` | `APRO` |
| ✅ **Aprobada** | American Express | `3711 803032 57522` | `1234` | `11/30` | `APRO` |

### Tarjetas de Débito

| Tipo | Bandera | Número | CVV | Vencimiento | Nombre Titular |
|------|---------|--------|-----|-------------|----------------|
| ✅ **Aprobada** | Mastercard | `5287 3383 1025 3304` | `123` | `11/30` | `APRO` |
| ✅ **Aprobada** | Visa | `4002 7686 9439 5619` | `123` | `11/30` | `APRO` |

---

## 🎭 Escenarios de Prueba

### Escenario 1: Pago Aprobado ✅

**Tarjeta**: `5031 7557 3453 0604` (Mastercard)
- **CVV**: `123`
- **Vencimiento**: `11/30`
- **Nombre del titular**: `APRO`
- **DNI**: `12345678`

**Resultado esperado**: Pago aprobado, redirección a `/payment/success`

---

### Escenario 2: Pago Rechazado ❌

**Tarjeta**: `5031 7557 3453 0604` (Mastercard)
- **CVV**: `123`
- **Vencimiento**: `11/30`
- **Nombre del titular**: `OTHE` (rechazado por error general)
- **DNI**: `12345678`

**Resultado esperado**: Pago rechazado, redirección a `/payment/failure`

---

### Escenario 3: Pago Pendiente ⏳

**Tarjeta**: `5031 7557 3453 0604` (Mastercard)
- **CVV**: `123`
- **Vencimiento**: `11/30`
- **Nombre del titular**: `CONT` (pendiente)
- **DNI**: `12345678`

**Resultado esperado**: Pago pendiente, redirección a `/payment/pending`

---

## 📝 Pasos para Realizar una Compra de Prueba

### Paso 1: Verificar Credenciales de Prueba

Asegúrate de que las credenciales de **prueba** estén configuradas en Vercel:

```bash
# Verificar variables en Vercel
vercel env ls production | grep MERCADOPAGO
```

**Deben ser**:
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`: `APP_USR-f5589935-8dea-4963-af32-b0f57a9ad7fb`
- `MERCADOPAGO_ACCESS_TOKEN`: `APP_USR-8497664518687621-112020-b8d6314ad9be3f5f9b55182b157921c1-2995219181`

---

### Paso 2: Iniciar Sesión con Cuenta de Comprador

1. Ve a tu aplicación: https://omnia-app.vercel.app
2. **Inicia sesión** con una cuenta de **cliente** (no coach)
3. Si no tienes cuenta de cliente, créala primero

---

### Paso 3: Seleccionar una Actividad

1. Busca una actividad de un coach que tenga Mercado Pago configurado
2. Haz clic en **"Comprar"** o **"Ver detalles"**
3. Selecciona **"Mercado Pago"** como método de pago

---

### Paso 4: Completar el Pago

1. Haz clic en **"Pagar con Mercado Pago"**
2. Serás redirigido a Mercado Pago
3. **Inicia sesión en Mercado Pago** con la cuenta de prueba del **comprador**
   - Usuario: `TESTUSER4821...` (ver en panel MP)
   - Contraseña: `AlpFFZDyZw` (o la que tengas configurada)

---

### Paso 5: Usar Tarjeta de Prueba

1. Selecciona **"Tarjeta de crédito"** o **"Tarjeta de débito"**
2. Ingresa los datos de la tarjeta de prueba:

   **Para pago aprobado**:
   - Número: `5031 7557 3453 0604`
   - CVV: `123`
   - Vencimiento: `11/30`
   - Nombre del titular: `APRO`
   - DNI: `12345678`

3. **IMPORTANTE**: Si el CVV aparece pre-llenado, **bórralo y escríbelo manualmente** (`123`)
4. Completa el pago

---

### Paso 6: Verificar Resultado

**Si el pago es aprobado**:
- ✅ Serás redirigido a `/payment/success`
- ✅ Verás un mensaje de confirmación
- ✅ El enrollment se creará en la base de datos

**Si el pago es rechazado**:
- ❌ Serás redirigido a `/payment/failure`
- ❌ Verás un mensaje de error
- ❌ Podrás reintentar el pago

**Si el pago está pendiente**:
- ⏳ Serás redirigido a `/payment/pending`
- ⏳ Verás información sobre el pago pendiente
- ⏳ El sistema verificará automáticamente el estado

---

## 🔍 Verificar en la Base de Datos

Después de una compra de prueba, verifica en Supabase:

```sql
-- Ver el último pago
SELECT 
  b.*,
  a.title as activity_title,
  p.email as client_email
FROM banco b
LEFT JOIN activities a ON a.id = b.activity_id
LEFT JOIN auth.users p ON p.id = b.client_id
ORDER BY b.created_at DESC
LIMIT 1;
```

**Campos a verificar**:
- ✅ `payment_status`: `approved`, `rejected`, o `pending`
- ✅ `mercadopago_preference_id`: ID de la preferencia
- ✅ `mercadopago_payment_id`: ID del pago (si está aprobado)
- ✅ `amount_paid`: Monto pagado
- ✅ `marketplace_fee`: Comisión de OMNIA
- ✅ `seller_amount`: Monto para el coach

---

## 🐛 Troubleshooting

### Problema: El botón de pagar está deshabilitado

**Solución**:
1. Verifica que estés usando la cuenta de **comprador** (no vendedor)
2. Borra y reescribe el CVV manualmente
3. Verifica que el monto sea mayor a $0
4. Revisa los logs en Vercel para ver errores

---

### Problema: No aparece la opción de tarjeta

**Solución**:
1. Verifica que las credenciales de prueba estén configuradas
2. Asegúrate de estar usando una cuenta de prueba del comprador
3. Verifica que el monto sea válido (mayor a $0)

---

### Problema: El pago no se procesa

**Solución**:
1. Verifica los logs en Vercel
2. Revisa que el webhook esté configurado
3. Verifica que las credenciales sean correctas
4. Asegúrate de usar tarjetas de prueba válidas

---

## 📋 Checklist de Prueba

- [ ] Credenciales de prueba configuradas en Vercel
- [ ] Cuenta de comprador creada en Mercado Pago
- [ ] Aplicación desplegada y funcionando
- [ ] Actividad disponible para comprar
- [ ] Pago aprobado probado (tarjeta `APRO`)
- [ ] Pago rechazado probado (tarjeta `OTHE`)
- [ ] Pago pendiente probado (tarjeta `CONT`)
- [ ] Redirección a `/payment/success` funciona
- [ ] Redirección a `/payment/failure` funciona
- [ ] Redirección a `/payment/pending` funciona
- [ ] Webhook recibe notificaciones
- [ ] Base de datos se actualiza correctamente

---

## 📚 Referencias

- [Documentación Oficial - Tarjetas de Prueba](https://www.mercadopago.com.ar/developers/es/guides/additional-content/your-integrations/test-cards)
- [Documentación Oficial - Compras de Prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/integration-test/test-payment-flow)

---

## ✅ Próximos Pasos

Después de verificar que las compras de prueba funcionan:

1. ✅ Configurar credenciales de producción
2. ✅ Probar con pagos reales (montos pequeños)
3. ✅ Configurar webhook de producción
4. ✅ Monitorear transacciones

---

**Última actualización**: Guía completa para compras de prueba

