# 🏪 Configuración del Marketplace OMNIA (omniav1)

## 📋 Información de la Cuenta

**Cuenta de Mercado Pago**:
- **Tipo**: Integrador/Marketplace
- **User ID**: `2995219179`
- **Usuario**: `TESTUSER5483...`
- **Contraseña**: `BoZ82j4ZmY`
- **País**: Argentina

**Esta cuenta es la que recibe la comisión del marketplace** cuando se realizan pagos con split payment.

---

## ✅ Verificación de Configuración

### 1. Verificar que la Cuenta es Marketplace

Para que OMNIA pueda recibir comisiones, la cuenta debe estar configurada como **Marketplace** en Mercado Pago.

**Pasos para verificar**:
1. Inicia sesión en [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app)
2. Ve a "Tus integraciones"
3. Selecciona la aplicación de OMNIA
4. Verifica que el modelo sea **"Marketplace"**

### 2. Verificar Credenciales en Vercel

Las credenciales de la cuenta omniav1 deben estar configuradas en Vercel:

```bash
# Verificar credenciales
./scripts/verificar-valores-vercel.sh
```

**Variables requeridas**:
- `MERCADOPAGO_ACCESS_TOKEN`: Token de la cuenta omniav1
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`: Public Key de la cuenta omniav1
- `MERCADOPAGO_CLIENT_ID`: Client ID de la aplicación
- `MERCADOPAGO_CLIENT_SECRET`: Client Secret de la aplicación

---

## 💰 Cómo Funciona el Split Payment

### Flujo Normal (Producción)

```
1. Cliente compra actividad por $10,000 ARS
   ↓
2. OMNIA crea preferencia con:
   - Total: $10,000 ARS
   - marketplace_fee: $1,500 ARS (15% de comisión)
   - Seller amount: $8,500 ARS (para el coach)
   ↓
3. Cliente paga en Mercado Pago
   ↓
4. Mercado Pago divide automáticamente:
   - $1,500 ARS → Cuenta de OMNIA (omniav1) ✅
   - $8,500 ARS → Cuenta del Coach
   ↓
5. Webhook notifica a OMNIA
   ↓
6. OMNIA actualiza banco y activa enrollment
```

### Flujo en Modo Prueba (Actual)

**⚠️ IMPORTANTE**: En modo prueba, actualmente **NO se incluye `marketplace_fee`** porque puede causar que el botón de pagar se deshabilite.

```
1. Cliente compra actividad por $10,000 ARS
   ↓
2. OMNIA crea preferencia SIN marketplace_fee:
   - Total: $10,000 ARS
   - marketplace_fee: NO incluido (para evitar problemas)
   ↓
3. Cliente paga en Mercado Pago
   ↓
4. Mercado Pago procesa el pago:
   - $10,000 ARS → Cuenta del Coach (TODO el monto)
   - OMNIA NO recibe comisión en modo prueba
   ↓
5. Webhook notifica a OMNIA
   ↓
6. OMNIA actualiza banco y activa enrollment
```

**Nota**: En modo prueba, OMNIA no recibe comisión. Esto es temporal para permitir que las pruebas funcionen correctamente.

---

## 🔧 Configuración del Marketplace Fee

### Cálculo de la Comisión

La comisión se calcula usando la función SQL `calculate_marketplace_commission`:

```sql
-- Por defecto: 15% de comisión
SELECT calculate_marketplace_commission(10000);
-- Resultado: 1500 (15% de 10000)
```

**Configuración actual**:
- Tipo: Porcentaje
- Valor: 15%
- Tabla: `marketplace_commission_config`

### Código Actual

En `app/api/mercadopago/checkout-pro/create-preference/route.ts`:

```typescript
// Calcular comisión de OMNIA
const { data: commissionResult } = await supabase
  .rpc('calculate_marketplace_commission', { 
    amount: totalAmount 
  });

const marketplaceFee = parseFloat(commissionResult?.toString() || '0');
const sellerAmount = totalAmount - marketplaceFee;

// SOLO incluir marketplace_fee si NO estamos en modo prueba
// En modo prueba, el marketplace_fee puede causar que el botón se deshabilite
...(marketplaceTokenIsTest ? {} : (marketplaceFee > 0 && sellerAmount > 0 ? { marketplace_fee: marketplaceFee } : {}))
```

---

## ⚠️ Problema Actual: Marketplace Fee en Modo Prueba

### Por qué NO se incluye en Modo Prueba

El `marketplace_fee` puede causar problemas en modo prueba porque:

1. **Mezcla de entornos**: Si el coach tiene token de producción pero el marketplace está en prueba, Mercado Pago puede rechazar la transacción
2. **Configuración del marketplace**: El marketplace debe estar correctamente configurado para recibir comisiones
3. **Validaciones de Mercado Pago**: Mercado Pago puede deshabilitar el botón si detecta problemas con el split payment

### Solución Temporal

**En modo prueba**: NO se incluye `marketplace_fee` para permitir que las pruebas funcionen.

**En producción**: SÍ se incluye `marketplace_fee` para que OMNIA reciba su comisión.

---

## ✅ Verificar que OMNIA Recibe Comisiones

### En Producción

1. **Verificar que el marketplace_fee se incluye**:
   - Revisar logs de Vercel
   - Buscar: `📋 Has Marketplace Fee: true`
   - Buscar: `🔍 Usando preferencia simple (sin marketplace_fee): false`

2. **Verificar en Mercado Pago**:
   - Inicia sesión en la cuenta omniav1
   - Ve a "Tu actividad"
   - Verifica que aparezcan las comisiones recibidas

3. **Verificar en la base de datos**:
   ```sql
   SELECT 
     id,
     amount_paid,
     marketplace_fee,
     seller_amount,
     payment_status
   FROM banco
   WHERE marketplace_fee > 0
   ORDER BY payment_date DESC
   LIMIT 10;
   ```

### En Modo Prueba

**⚠️ IMPORTANTE**: En modo prueba, OMNIA NO recibe comisiones porque el `marketplace_fee` no se incluye.

Para probar el split payment en modo prueba, necesitas:
1. Configurar correctamente el marketplace en Mercado Pago
2. Asegurarte de que tanto el marketplace como el coach usen tokens de prueba
3. Verificar que el marketplace tenga permisos para recibir comisiones

---

## 🔍 Verificar Configuración del Marketplace

### 1. Verificar en Mercado Pago Developers

1. Inicia sesión con la cuenta omniav1
2. Ve a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app)
3. Selecciona la aplicación de OMNIA
4. Verifica:
   - ✅ Modelo: **"Marketplace"**
   - ✅ Credenciales de prueba configuradas
   - ✅ Credenciales de producción configuradas

### 2. Verificar Permisos del Marketplace

El marketplace debe tener permisos para:
- ✅ Recibir comisiones (`marketplace_fee`)
- ✅ Crear preferencias con split payment
- ✅ Procesar pagos en nombre de vendedores

### 3. Verificar OAuth

Cada coach debe autorizar a OMNIA mediante OAuth:
- ✅ Coach inicia sesión en Mercado Pago
- ✅ Coach autoriza a OMNIA
- ✅ OMNIA obtiene `access_token` del coach
- ✅ Token se almacena encriptado en `coach_mercadopago_credentials`

---

## 📊 Ejemplo de Preferencia con Marketplace Fee

### Preferencia en Producción

```json
{
  "items": [
    {
      "id": "123",
      "title": "Actividad de Fitness",
      "quantity": 1,
      "unit_price": 10000,
      "currency_id": "ARS"
    }
  ],
  "marketplace_fee": 1500,  // ✅ Comisión de OMNIA (15%)
  "payer": {
    "email": "cliente@example.com",
    "name": "Cliente",
    "surname": "Test"
  },
  "back_urls": {
    "success": "https://omnia-app.vercel.app/payment/success",
    "failure": "https://omnia-app.vercel.app/payment/failure",
    "pending": "https://omnia-app.vercel.app/payment/pending"
  },
  "auto_return": "approved",
  "notification_url": "https://omnia-app.vercel.app/api/mercadopago/webhook"
}
```

### Preferencia en Modo Prueba (Actual)

```json
{
  "items": [
    {
      "id": "123",
      "title": "Actividad de Fitness",
      "quantity": 1,
      "unit_price": 10000,
      "currency_id": "ARS"
    }
  ],
  // ❌ NO se incluye marketplace_fee en modo prueba
  "payer": {
    "email": "cliente@example.com",
    "name": "Cliente",
    "surname": "Test"
  },
  "back_urls": {
    "success": "https://omnia-app.vercel.app/payment/success",
    "failure": "https://omnia-app.vercel.app/payment/failure",
    "pending": "https://omnia-app.vercel.app/payment/pending"
  },
  "auto_return": "approved",
  "notification_url": "https://omnia-app.vercel.app/api/mercadopago/webhook"
}
```

---

## 🚀 Próximos Pasos

### Para Habilitar Marketplace Fee en Modo Prueba

1. **Verificar configuración del marketplace**:
   - Asegurarse de que la cuenta omniav1 esté correctamente configurada como marketplace
   - Verificar que tenga permisos para recibir comisiones

2. **Probar con marketplace_fee**:
   - Modificar temporalmente el código para incluir `marketplace_fee` en modo prueba
   - Probar una compra de prueba
   - Verificar si el botón de pagar funciona

3. **Si funciona**:
   - Mantener `marketplace_fee` en modo prueba
   - OMNIA recibirá comisiones incluso en modo prueba

4. **Si no funciona**:
   - Mantener la configuración actual (sin `marketplace_fee` en modo prueba)
   - OMNIA solo recibirá comisiones en producción

---

## 📚 Referencias

- [Documentación - Split Payment](https://www.mercadopago.com.ar/developers/es/docs/split-payments/landing)
- [Documentación - Marketplace](https://www.mercadopago.com.ar/developers/es/docs/marketplace/landing)
- [Documentación - Compras de Prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/integration-test/test-purchases)

---

**Última actualización**: Verificación de configuración del marketplace omniav1

