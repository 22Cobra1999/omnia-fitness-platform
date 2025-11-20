# Implementación: Checkout API (Bricks) con Split Payment

## 🎯 Recomendación: **Checkout API (Bricks)**

### ✅ Ventajas:
- Cliente paga **dentro de OMNIA** (mejor UX)
- Soporta pagos recurrentes
- Totalmente personalizable
- Split payment con `application_fee`

---

## 🔧 Implementación

### 1. Frontend: Integrar Bricks

```typescript
// components/mercadopago/checkout-bricks.tsx
'use client';

import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { useEffect, useState } from 'react';

interface CheckoutBricksProps {
  preferenceId?: string; // Para Checkout Pro
  publicKey: string;
  amount: number;
  coachAccessToken: string; // Token del coach (obtenido del backend)
  marketplaceFee: number;
  enrollmentId: number;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: any) => void;
}

export function CheckoutBricks({
  publicKey,
  amount,
  coachAccessToken,
  marketplaceFee,
  enrollmentId,
  onPaymentSuccess,
  onPaymentError
}: CheckoutBricksProps) {
  const [mp, setMp] = useState<any>(null);

  useEffect(() => {
    initMercadoPago(publicKey, { locale: 'es-AR' });
  }, [publicKey]);

  const onSubmit = async (formData: any) => {
    try {
      // Crear pago con split payment
      const response = await fetch('/api/payments/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: formData.token,
          issuer_id: formData.issuer_id,
          payment_method_id: formData.payment_method_id,
          transaction_amount: amount,
          installments: formData.installments,
          description: 'Pago de actividad en OMNIA',
          payer: {
            email: formData.payer.email,
            identification: {
              type: formData.payer.identification.type,
              number: formData.payer.identification.number
            }
          },
          application_fee: marketplaceFee, // ⭐ Comisión de OMNIA
          external_reference: `enrollment_${enrollmentId}`,
          coach_access_token: coachAccessToken // Token del coach
        })
      });

      const result = await response.json();

      if (result.status === 'approved') {
        onPaymentSuccess(result.id);
      } else {
        onPaymentError(result);
      }
    } catch (error) {
      onPaymentError(error);
    }
  };

  return (
    <div>
      <Wallet 
        initialization={{ preferenceId: undefined }}
        onSubmit={onSubmit}
      />
    </div>
  );
}
```

### 2. Backend: Crear Pago con Split

```typescript
// app/api/payments/create-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const {
      token,
      issuer_id,
      payment_method_id,
      transaction_amount,
      installments,
      description,
      payer,
      application_fee,
      external_reference,
      coach_access_token
    } = await request.json();

    // Validar que tenemos el token del coach
    if (!coach_access_token) {
      return NextResponse.json({ error: 'Token del coach requerido' }, { status: 400 });
    }

    // Crear cliente con access_token del coach
    const client = new MercadoPagoConfig({
      accessToken: coach_access_token,
      options: { timeout: 5000 }
    });

    const payment = new Payment(client);

    // Crear pago con split payment
    const paymentData = {
      transaction_amount: transaction_amount,
      token: token,
      description: description,
      installments: installments,
      payment_method_id: payment_method_id,
      issuer_id: issuer_id,
      payer: payer,
      application_fee: application_fee, // ⭐ Comisión de OMNIA
      external_reference: external_reference,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`
    };

    const response = await payment.create({ body: paymentData });

    // Guardar en banco
    const supabase = await createRouteHandlerClient();
    const enrollmentId = parseInt(external_reference.replace('enrollment_', ''));
    
    await supabase.from('banco').insert({
      enrollment_id: enrollmentId,
      amount_paid: transaction_amount,
      payment_status: response.status,
      payment_method: 'mercadopago',
      currency: 'ARS',
      mercadopago_payment_id: response.id,
      mercadopago_status: response.status,
      marketplace_fee: application_fee,
      seller_amount: transaction_amount - application_fee,
      external_reference: external_reference
    });

    // Si está aprobado, activar enrollment
    if (response.status === 'approved') {
      await supabase.from('activity_enrollments').update({
        status: 'activa'
      }).eq('id', enrollmentId);
    }

    return NextResponse.json({
      id: response.id,
      status: response.status,
      status_detail: response.status_detail
    });

  } catch (error: any) {
    console.error('Error creando pago:', error);
    return NextResponse.json({ 
      error: 'Error procesando pago',
      details: error.message 
    }, { status: 500 });
  }
}
```

---

## 📋 Flujo Completo con Bricks

```
1. Cliente hace clic en "Comprar"
   ↓
2. Frontend llama a /api/payments/prepare
   - Obtiene datos de la actividad
   - Calcula comisión
   - Obtiene token del coach (encriptado)
   ↓
3. Frontend muestra Bricks
   - Cliente ingresa datos de tarjeta
   - Bricks genera token de tarjeta
   ↓
4. Frontend llama a /api/payments/create-payment
   - Crea pago con application_fee
   - Usa access_token del coach
   ↓
5. Mercado Pago divide automáticamente:
   - Comisión → OMNIA
   - Resto → Coach
   ↓
6. Webhook actualiza banco
   ↓
7. Enrollment se activa
```

---

## 🔑 Diferencias Clave

| Aspecto | Checkout Pro | Checkout API (Bricks) |
|---------|-------------|----------------------|
| **Parámetro split** | `marketplace_fee` | `application_fee` |
| **API usada** | `/checkout/preferences` | `/v1/payments` |
| **Frontend** | Redirige a MP | Bricks en tu sitio |
| **Token** | Preference ID | Card token |

---

## 📦 Instalación

```bash
npm install @mercadopago/sdk-react mercadopago
```

---

## 🔐 Seguridad

⚠️ **IMPORTANTE**: 
- El `access_token` del coach **NUNCA** debe exponerse en el frontend
- El frontend debe obtener un token temporal o usar el backend como proxy
- Todos los tokens deben estar encriptados en la base de datos

---

## 📚 Referencias

- [Bricks Documentation](https://www.mercadopago.com.ar/developers/es/docs/checkout-bricks/landing)
- [Payment API](https://www.mercadopago.com.ar/developers/es/reference/payments/_payments/post)
- [Split Payment con Checkout API](https://www.mercadopago.com.br/developers/es/docs/split-payments/integration-configuration/integrate-marketplace)








