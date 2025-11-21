# 📁 Archivos de Integración Mercado Pago

## 🎯 Archivos Principales de Checkout Pro

### Backend (API Routes)

#### 1. **Crear Preferencia de Pago**
📄 `app/api/mercadopago/checkout-pro/create-preference/route.ts`
- **Función**: Crea una preferencia de pago en Mercado Pago Checkout Pro
- **Endpoint**: `POST /api/mercadopago/checkout-pro/create-preference`
- **Body**: `{ activityId: number }`
- **Retorna**: `{ success: boolean, preferenceId: string, initPoint: string }`

#### 2. **Webhook de Notificaciones**
📄 `app/api/mercadopago/webhook/route.ts`
- **Función**: Recibe notificaciones de Mercado Pago sobre cambios en pagos
- **Endpoint**: `POST /api/mercadopago/webhook`
- **Procesa**: Actualiza estado de pagos, crea enrollments, maneja split payment

### Frontend (Componentes y Utilidades)

#### 3. **Botón de Checkout Pro**
📄 `components/mercadopago/checkout-pro-button.tsx`
- **Componente**: `<CheckoutProButton activityId={123} />`
- **Función**: Botón que inicia el proceso de pago con Mercado Pago
- **Props**: `activityId`, `price`, `buttonText`, `onPaymentStart`, `onError`

#### 4. **Utilidades de Checkout Pro**
📄 `lib/mercadopago/checkout-pro.ts`
- **Funciones**:
  - `createCheckoutProPreference(activityId)` - Crea preferencia desde frontend
  - `redirectToMercadoPagoCheckout(initPoint)` - Redirige al checkout
  - `getCheckoutProErrorMessage(error)` - Maneja errores amigables

### Páginas de Retorno

#### 5. **Página de Éxito**
📄 `app/payment/success/page.tsx`
- **URL**: `/payment/success`
- **Función**: Muestra confirmación de pago exitoso

#### 6. **Página de Fallo**
📄 `app/payment/failure/page.tsx`
- **URL**: `/payment/failure`
- **Función**: Muestra error de pago y opciones de reintento

#### 7. **Página de Pendiente**
📄 `app/payment/pending/page.tsx`
- **URL**: `/payment/pending`
- **Función**: Muestra estado pendiente y verifica periódicamente

### Componentes que Usan Checkout Pro

#### 8. **Modal de Compra de Actividad (Cliente)**
📄 `components/client/activities/client-product-modal.tsx`
- **Uso**: Integra `<CheckoutProButton />` para comprar actividades

#### 9. **Modal de Compra de Actividad (Compartido)**
📄 `components/shared/activities/purchase-activity-modal.tsx`
- **Uso**: Integra `<CheckoutProButton />` para comprar actividades

---

## 🔧 Archivos de Configuración OAuth

### 10. **OAuth - Autorizar**
📄 `app/api/mercadopago/oauth/authorize/route.ts`
- **Función**: Inicia el flujo OAuth para que coaches autoricen Mercado Pago

### 11. **OAuth - Callback**
📄 `app/api/mercadopago/oauth/callback/route.ts`
- **Función**: Recibe el callback de OAuth y guarda credenciales

### 12. **Componente de Conexión**
📄 `components/coach/mercadopago-connection.tsx`
- **Función**: UI para que coaches conecten su cuenta de Mercado Pago

---

## 📊 Archivos de Endpoints Adicionales

### 13. **Verificar Conexiones**
📄 `app/api/mercadopago/verify-connections/route.ts`
- **Función**: Verifica el estado de las conexiones OAuth de coaches

### 14. **Información de Usuario**
📄 `app/api/mercadopago/user-info/route.ts`
- **Función**: Obtiene información del usuario de Mercado Pago

### 15. **Desconectar**
📄 `app/api/mercadopago/disconnect/route.ts`
- **Función**: Desconecta la cuenta de Mercado Pago de un coach

---

## 📝 Archivos de Documentación

- `docs/MERCADOPAGO_CHECKOUT_PRO_IMPLEMENTATION.md` - Documentación de implementación
- `docs/MERCADO_PAGO_CHECKOUT_COMPARISON.md` - Comparación de checkouts
- `docs/MERCADO_PAGO_SPLIT_PAYMENT.md` - Documentación de split payment
- `docs/GUIA_COMPLETA_CONFIGURAR_OAUTH_MERCADOPAGO.md` - Guía de OAuth

---

## 🔍 Flujo Completo de Pago

```
1. Usuario hace clic en "Pagar con Mercado Pago"
   ↓
2. Frontend llama a createCheckoutProPreference()
   ↓
3. Se hace POST a /api/mercadopago/checkout-pro/create-preference
   ↓
4. Backend crea preferencia en Mercado Pago con:
   - Información del payer (email, name, surname)
   - Items (actividad, precio)
   - Marketplace fee (comisión de OMNIA)
   - Back URLs (success, failure, pending)
   - Webhook URL
   ↓
5. Backend guarda registro en tabla `banco` (sin enrollment_id todavía)
   ↓
6. Frontend recibe initPoint y redirige a Mercado Pago
   ↓
7. Usuario completa el pago en Mercado Pago
   ↓
8. Mercado Pago redirige a /payment/success o /payment/failure
   ↓
9. Mercado Pago envía webhook a /api/mercadopago/webhook
   ↓
10. Webhook actualiza `banco` y crea `enrollment` si el pago fue aprobado
```

---

## ⚠️ Problema Actual: Botón Bloqueado

El botón de "Pagar" en el checkout de Mercado Pago está bloqueado. Posibles causas:

1. **CVV no validado**: Mercado Pago requiere que el usuario ingrese el CVV manualmente
2. **Información del payer incompleta**: Aunque tenemos email, name y surname, puede faltar algo
3. **Configuración de payment_methods**: Puede haber alguna restricción

**Archivo a revisar**: `app/api/mercadopago/checkout-pro/create-preference/route.ts` (líneas 226-258)

