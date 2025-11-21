# ✅ Configuración de Checkout Pro - Verificación

## 📋 Configuración en Mercado Pago (Verificada)

Según la configuración mostrada:

- ✅ **Producto**: Checkout Pro
- ✅ **Modelo de integración**: Marketplace + Billetera MercadoPago
- ✅ **URL del sitio**: `https://omnia-app.vercel.app/`
- ✅ **URL de redireccionamiento OAuth**: `https://omnia-app.vercel.app/api/mercadopago/oauth/callback`

---

## 🔧 Configuración en el Código

### 1. Endpoint Principal de Checkout Pro

**Archivo**: `app/api/mercadopago/checkout-pro/create-preference/route.ts`

**URLs de retorno configuradas**:
```typescript
const backUrls = {
  success: `${appUrl}/payment/success`,
  failure: `${appUrl}/payment/failure`,
  pending: `${appUrl}/payment/pending`
};
```

**Donde `appUrl` viene de**:
- Variable de entorno: `NEXT_PUBLIC_APP_URL`
- Fallback: `http://localhost:3000`
- **Para producción**: Debe ser `https://omnia-app.vercel.app`

### 2. Webhook URL

```typescript
notification_url: `${appUrl}/api/mercadopago/webhook`
```

**URL completa en producción**: `https://omnia-app.vercel.app/api/mercadopago/webhook`

---

## ✅ Verificación de Componentes

### Componentes que usan Checkout Pro:

1. ✅ `components/shared/activities/purchase-activity-modal.tsx`
   - Usa: `createCheckoutProPreference()` y `redirectToMercadoPagoCheckout()`
   - Endpoint: `/api/mercadopago/checkout-pro/create-preference`

2. ✅ `components/client/activities/client-product-modal.tsx`
   - Usa: `createCheckoutProPreference()` y `redirectToMercadoPagoCheckout()`
   - Endpoint: `/api/mercadopago/checkout-pro/create-preference`

3. ✅ `components/mercadopago/checkout-pro-button.tsx`
   - Componente reutilizable para Checkout Pro
   - Usa: `createCheckoutProPreference()` y `redirectToMercadoPagoCheckout()`

### Utilidades:

- ✅ `lib/mercadopago/checkout-pro.ts`
  - Funciones: `createCheckoutProPreference()`, `redirectToMercadoPagoCheckout()`, `getCheckoutProErrorMessage()`

---

## 🔍 Endpoints Antiguos (No se usan actualmente)

Estos endpoints existen pero **NO se están usando** en los componentes:

1. `app/api/enrollments/create-with-mercadopago/route.ts`
   - ⚠️ Endpoint antiguo, puede ser eliminado o mantenido para compatibilidad

2. `app/api/payments/create-preference/route.ts`
   - ⚠️ Endpoint antiguo, puede ser eliminado o mantenido para compatibilidad

**Recomendación**: Mantenerlos por ahora para compatibilidad, pero todos los componentes nuevos usan el endpoint de Checkout Pro.

---

## 📝 Configuración de Preferencia

### Campos configurados en Checkout Pro:

```typescript
{
  items: [{
    id: String(activityId),
    title: activity.title,
    quantity: 1,
    unit_price: totalAmount,
    currency_id: 'ARS'
  }],
  marketplace_fee: marketplaceFee, // Solo si es válido
  external_reference: `omnia_${activityId}_${clientId}_${Date.now()}`,
  back_urls: {
    success: `${appUrl}/payment/success`,
    failure: `${appUrl}/payment/failure`,
    pending: `${appUrl}/payment/pending`
  },
  auto_return: 'approved',
  notification_url: `${appUrl}/api/mercadopago/webhook`,
  payer: {
    email: clientEmail,
    name: clientProfile?.name || 'Cliente',
    surname: clientProfile?.surname || 'OMNIA',
    phone: clientProfile?.phone ? { number: clientProfile.phone } : undefined,
    identification: clientProfile?.dni ? {
      type: clientProfile?.document_type || 'DNI',
      number: clientProfile.dni.toString()
    } : undefined
  },
  payment_methods: {
    excluded_payment_methods: [],
    excluded_payment_types: [],
    installments: 12,
    default_installments: 1
  },
  statement_descriptor: 'OMNIA',
  binary_mode: false,
  expires: false
}
```

---

## ✅ Checklist de Verificación

- [x] Endpoint de Checkout Pro implementado
- [x] Componentes usando Checkout Pro
- [x] URLs de retorno configuradas
- [x] Webhook configurado
- [x] Información del payer completa
- [x] Marketplace fee configurado
- [x] Split payment habilitado
- [ ] **Variable de entorno `NEXT_PUBLIC_APP_URL` configurada en Vercel**
- [ ] **Webhook URL configurada en Mercado Pago**

---

## 🚀 Próximos Pasos

1. **Verificar variable de entorno en Vercel**:
   ```bash
   NEXT_PUBLIC_APP_URL=https://omnia-app.vercel.app
   ```

2. **Configurar webhook en Mercado Pago**:
   - URL: `https://omnia-app.vercel.app/api/mercadopago/webhook`
   - Eventos: `payment`

3. **Probar el flujo completo**:
   - Crear preferencia
   - Redirigir a Mercado Pago
   - Completar pago
   - Verificar redirección de retorno
   - Verificar webhook

---

## 📚 Referencias

- [Documentación Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing)
- [Configurar URLs de retorno](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/checkout-customization/preferences)
- [Webhooks](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks)

