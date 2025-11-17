# Integración de Split Payment de Mercado Pago para OMNIA

## 📚 ¿Qué es Split Payment?

El **Split de Pagos** de Mercado Pago permite dividir automáticamente los pagos entre:
- **OMNIA (Marketplace)**: Recibe la comisión
- **Coach (Vendedor)**: Recibe el monto principal

Esto es ideal para OMNIA porque cada actividad tiene un `coach_id` y un `price`, y necesitamos dividir el pago automáticamente.

**Referencias**:
- [Documentación oficial de Split Payments](https://www.mercadopago.com.ar/developers/es/docs/split-payments/landing)
- [Requisitos previos](https://www.mercadopago.com.ar/developers/es/docs/split-payments/prerequisites)
- [Configuración de integración](https://www.mercadopago.com.br/developers/es/docs/split-payments/integration-configuration/integrate-marketplace)

---

## ✅ Requisitos Previos

### 1. Cuenta de Mercado Pago
- ✅ Cuenta de vendedor con nivel de identificación **KYC 6**
- ✅ Aplicación creada en Mercado Pago (ya tienes el link)

### 2. Configuración de la Aplicación
- ✅ Crear aplicación en [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app/create-app)
- ✅ Seleccionar modelo: **"Marketplace"**
- ✅ **Seleccionar Checkout: "Checkout API" (Bricks)** ⭐ RECOMENDADO
- ✅ Configurar Redirect URL para OAuth

### 3. ¿Por qué Checkout API (Bricks)?
- ✅ **Mejor UX**: Cliente paga dentro de OMNIA (no sale del sitio)
- ✅ **Soporta pagos recurrentes**: Útil para suscripciones futuras
- ✅ **Experiencia personalizable**: Se integra mejor con el diseño de OMNIA
- ✅ **Split payment**: Usa `application_fee` para dividir pagos
- ✅ **Más profesional**: Ideal para un marketplace como OMNIA

### 3. OAuth para Coaches
- ⚠️ Cada coach debe autorizar a OMNIA mediante OAuth
- ⚠️ Obtener `access_token` de cada coach
- ⚠️ Almacenar tokens en base de datos

---

## 🏗️ Arquitectura para OMNIA

### Flujo de Split Payment

```
1. Cliente compra actividad
   ↓
2. OMNIA crea preferencia de pago
   - Usa access_token del coach (obtenido vía OAuth)
   - Calcula comisión de OMNIA
   - Calcula monto para el coach
   ↓
3. Cliente paga en Mercado Pago
   ↓
4. Mercado Pago divide automáticamente:
   - Comisión → Cuenta de OMNIA
   - Resto → Cuenta del Coach
   ↓
5. Webhook notifica a OMNIA
   ↓
6. OMNIA actualiza banco y enrollment
```

---

## 📊 Estructura de Datos Necesaria

### 1. Tabla `banco` (Ya existe, necesita campos adicionales)

**Campos existentes**:
- `enrollment_id` - FK a activity_enrollments
- `amount_paid` - Monto total pagado
- `payment_status` - Estado del pago
- `external_reference` - Referencia externa
- `payment_date` - Fecha del pago
- `payment_method` - Método de pago
- `currency` - Moneda

**Campos a agregar (ver migración `add-mercadopago-fields-to-banco.sql`)**:
- `mercadopago_payment_id` - ID único del pago en Mercado Pago
- `mercadopago_preference_id` - ID de la preferencia de pago
- `mercadopago_status` - Estado en Mercado Pago
- `marketplace_fee` - **Comisión que recibe OMNIA** ⭐
- `seller_amount` - **Monto que recibe el coach** ⭐
- `coach_mercadopago_user_id` - ID de Mercado Pago del coach
- `coach_access_token_encrypted` - Token OAuth encriptado

### 2. Nueva tabla: `coach_mercadopago_credentials`

Ver migración completa en: `db/migrations/add-split-payment-tables.sql`

**Campos principales**:
- `coach_id` - FK a auth.users (coach)
- `mercadopago_user_id` - ID de usuario en Mercado Pago
- `access_token_encrypted` - Token OAuth encriptado
- `refresh_token_encrypted` - Refresh token encriptado
- `oauth_authorized` - Si el coach autorizó a OMNIA
- `token_expires_at` - Fecha de expiración del token

### 3. Nueva tabla: `marketplace_commission_config`

Ver migración completa en: `db/migrations/add-split-payment-tables.sql`

**Configuración por defecto**: 15% de comisión

**Función SQL incluida**: `calculate_marketplace_commission(amount, config_id)` para calcular comisiones automáticamente

---

## 🔧 Implementación Técnica

### 1. Flujo OAuth para Coaches

```typescript
// app/api/mercadopago/oauth/authorize/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coachId = searchParams.get('coach_id');
  const code = searchParams.get('code'); // Código de autorización de MP

  if (!code) {
    // Redirigir a Mercado Pago para autorización
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/oauth/callback`;
    const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${process.env.MERCADOPAGO_CLIENT_ID}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(redirectUri)}&state=${coachId}`;
    
    return NextResponse.redirect(authUrl);
  }

  // Intercambiar código por access_token
  // Guardar en coach_mercadopago_credentials
}
```

### 2. Crear Preferencia de Pago con Split

```typescript
// app/api/payments/create-preference/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { decrypt } from '@/lib/utils/encryption'; // Función para desencriptar tokens

export async function POST(request: NextRequest) {
  try {
    const { enrollmentId, activityId } = await request.json();
    
    if (!enrollmentId || !activityId) {
      return NextResponse.json({ error: 'enrollmentId y activityId son requeridos' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    
    // 1. Obtener datos de la actividad
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, title, price, coach_id')
      .eq('id', activityId)
      .single();

    if (activityError || !activity) {
      return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 });
    }

    const coachId = activity.coach_id;
    const totalAmount = parseFloat(activity.price.toString());
    
    // 2. Obtener credenciales del coach
    const { data: coachCredentials, error: credsError } = await supabase
      .from('coach_mercadopago_credentials')
      .select('*')
      .eq('coach_id', coachId)
      .eq('oauth_authorized', true)
      .single();

    if (credsError || !coachCredentials) {
      return NextResponse.json({ 
        error: 'Coach no ha autorizado Mercado Pago. Debe completar el proceso OAuth primero.' 
      }, { status: 400 });
    }

    // 3. Calcular comisión de OMNIA usando función SQL
    const { data: commissionResult, error: commissionError } = await supabase
      .rpc('calculate_marketplace_commission', { 
        amount: totalAmount 
      });

    if (commissionError) {
      console.error('Error calculando comisión:', commissionError);
      return NextResponse.json({ error: 'Error calculando comisión' }, { status: 500 });
    }

    const marketplaceFee = parseFloat(commissionResult || '0');
    const sellerAmount = totalAmount - marketplaceFee;
    
    // 4. Desencriptar access token del coach
    const coachAccessToken = decrypt(coachCredentials.access_token_encrypted);
    
    // 5. Crear pago usando el access_token del coach
    // NOTA: Para Checkout API (Bricks), el pago se crea desde el frontend
    // Este endpoint solo prepara los datos. El frontend usa Bricks para crear el pago.
    
    // Opción A: Si usas Checkout Pro (redirige a MP)
    const client = new MercadoPagoConfig({
      accessToken: coachAccessToken,
      options: { timeout: 5000 }
    });
    
    const preference = new Preference(client);
    
    const preferenceData = {
      items: [
        {
          title: activity.title,
          quantity: 1,
          unit_price: totalAmount,
          currency_id: 'ARS'
        }
      ],
      marketplace_fee: marketplaceFee, // Para Checkout Pro
      external_reference: `enrollment_${enrollmentId}`,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?preference_id={preference_id}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure?preference_id={preference_id}`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/payment/pending?preference_id={preference_id}`
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`
    };
    
    const response = await preference.create({ body: preferenceData });
    
    // Opción B: Para Checkout API (Bricks) - El pago se crea desde el frontend
    // Ver implementación en: components/mercadopago/checkout-bricks.tsx
    
    // 6. Guardar en banco
    const { error: bancoError } = await supabase.from('banco').insert({
      enrollment_id: enrollmentId,
      amount_paid: totalAmount,
      payment_status: 'pending',
      payment_method: 'mercadopago',
      currency: 'ARS',
      mercadopago_preference_id: response.id,
      marketplace_fee: marketplaceFee,
      seller_amount: sellerAmount,
      coach_mercadopago_user_id: coachCredentials.mercadopago_user_id,
      coach_access_token_encrypted: coachCredentials.access_token_encrypted, // Guardar referencia
      external_reference: `enrollment_${enrollmentId}`
    });

    if (bancoError) {
      console.error('Error guardando en banco:', bancoError);
      return NextResponse.json({ error: 'Error guardando registro de pago' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      preferenceId: response.id,
      initPoint: response.init_point, // URL para redirigir al checkout
      marketplaceFee,
      sellerAmount
    });

  } catch (error: any) {
    console.error('Error creando preferencia:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}
```

**Puntos clave**:
- ✅ Usa el `access_token` del **coach** (no el de OMNIA)
- ✅ `marketplace_fee` es la comisión que recibe OMNIA
- ✅ Mercado Pago divide automáticamente: coach recibe `totalAmount - marketplace_fee`
- ✅ El pago se acredita directamente en la cuenta del coach

### 3. Webhook para Actualizar Pagos

```typescript
// app/api/payments/webhook/route.ts
export async function POST(request: NextRequest) {
  const data = await request.json();
  const { type, data: paymentData } = data;
  
  if (type === 'payment') {
    const paymentId = paymentData.id;
    
    // Obtener información del pago
    const payment = await getPaymentFromMercadoPago(paymentId);
    
    // Buscar registro en banco
    const bancoRecord = await supabase
      .from('banco')
      .select('*')
      .eq('mercadopago_preference_id', payment.preference_id)
      .single();
    
    if (bancoRecord) {
      // Actualizar banco con datos del pago
      await supabase.from('banco').update({
        mercadopago_payment_id: payment.id,
        mercadopago_status: payment.status,
        mercadopago_status_detail: payment.status_detail,
        payment_status: payment.status === 'approved' ? 'completed' : payment.status,
        marketplace_fee: payment.fee_details?.find(f => f.type === 'marketplace_fee')?.amount || 0,
        seller_amount: payment.transaction_details?.net_received_amount || 0,
        webhook_received: true,
        webhook_data: payment
      }).eq('id', bancoRecord.id);
      
      // Si el pago fue aprobado, activar enrollment
      if (payment.status === 'approved') {
        await supabase.from('activity_enrollments').update({
          status: 'activa'
        }).eq('id', bancoRecord.enrollment_id);
      }
    }
  }
  
  return NextResponse.json({ received: true });
}
```

---

## 💰 Cálculo de Comisiones

### Usando la función SQL (Recomendado)

La función `calculate_marketplace_commission()` ya está creada en la migración. Úsala así:

```typescript
// Usar función SQL para calcular comisión
const { data: commission, error } = await supabase
  .rpc('calculate_marketplace_commission', { 
    amount: totalAmount,
    config_id: null // null = usa configuración activa
  });
```

### Ejemplo de Cálculo

**Escenario**: Actividad de $10,000 ARS con comisión del 15%

```typescript
const totalAmount = 10000;
const marketplaceFee = await calculateCommission(totalAmount); // 1500
const sellerAmount = totalAmount - marketplaceFee; // 8500

// Resultado:
// - OMNIA recibe: $1,500 ARS (comisión)
// - Coach recibe: $8,500 ARS (monto principal)
// - Cliente paga: $10,000 ARS (total)
```

**Nota**: Las comisiones de Mercado Pago se deducen del monto total **antes** del split. Por ejemplo:
- Cliente paga: $10,000 ARS
- Comisión MP (ej: 3%): $300 ARS
- Monto disponible para split: $9,700 ARS
- OMNIA (15%): $1,455 ARS
- Coach: $8,245 ARS

---

## 🔐 Seguridad y Almacenamiento de Tokens

### Encriptar Access Tokens

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

---

## 📋 Checklist de Implementación

### Fase 1: Configuración Inicial
- [ ] Crear aplicación en Mercado Pago (modelo Marketplace)
- [ ] Obtener `CLIENT_ID` y `CLIENT_SECRET`
- [ ] Configurar Redirect URL para OAuth
- [ ] Instalar SDK: `npm install mercadopago`

### Fase 2: Base de Datos
- [ ] Ejecutar migración: `add-mercadopago-fields-to-banco.sql`
- [ ] Crear tabla `coach_mercadopago_credentials`
- [ ] Crear tabla `marketplace_commission_config`
- [ ] Configurar comisión por defecto (ej: 15%)

### Fase 3: OAuth Flow
- [ ] Crear endpoint `/api/mercadopago/oauth/authorize`
- [ ] Crear endpoint `/api/mercadopago/oauth/callback`
- [ ] Crear UI para que coaches autoricen OMNIA
- [ ] Implementar encriptación de tokens

### Fase 4: Creación de Pagos
- [ ] Crear endpoint `/api/payments/create-preference`
- [ ] Implementar cálculo de comisiones
- [ ] Integrar con `banco` table
- [ ] Probar flujo completo

### Fase 5: Webhooks
- [ ] Crear endpoint `/api/payments/webhook`
- [ ] Configurar webhook en Mercado Pago
- [ ] Implementar verificación de firma
- [ ] Actualizar estados de pagos

### Fase 6: UI/UX
- [ ] Página de autorización OAuth para coaches
- [ ] Integrar checkout en flujo de compra
- [ ] Mostrar estado de pagos
- [ ] Dashboard de comisiones para OMNIA

---

## 🔗 Referencias Importantes

1. **Documentación Oficial**:
   - [Split Payments Landing](https://www.mercadopago.com.ar/developers/es/docs/split-payments/landing)
   - [Requisitos Previos](https://www.mercadopago.com.ar/developers/es/docs/split-payments/prerequisites)
   - [Configuración de Integración](https://www.mercadopago.com.br/developers/es/docs/split-payments/integration-configuration/integrate-marketplace)

2. **SDK de Mercado Pago**:
   - [Node.js SDK](https://github.com/mercadopago/sdk-nodejs)

3. **OAuth Flow**:
   - [Autorización OAuth](https://www.mercadopago.com.ar/developers/es/docs/security/oauth)

---

## ⚠️ Consideraciones Importantes

1. **Reembolsos**: En caso de reembolso, Mercado Pago divide proporcionalmente. Si el coach no tiene fondos, OMNIA debe cubrir la diferencia.

2. **Comisiones de Mercado Pago**: Las comisiones de MP se deducen del monto total antes del split.

3. **Tokens OAuth**: Los tokens expiran. Implementar refresh token automático.

4. **Seguridad**: Nunca exponer `access_token` en el frontend. Siempre encriptar en base de datos.

5. **Testing**: Usar credenciales de sandbox para pruebas antes de producción.

---

## 📝 Próximos Pasos

1. **Ejecutar migraciones SQL** para agregar campos necesarios
2. **Instalar SDK**: `npm install mercadopago`
3. **Configurar variables de entorno**:
   ```
   MERCADOPAGO_CLIENT_ID=tu_client_id
   MERCADOPAGO_CLIENT_SECRET=tu_client_secret
   MERCADOPAGO_ACCESS_TOKEN=tu_access_token (de OMNIA)
   ENCRYPTION_KEY=tu_clave_de_32_bytes
   ```
4. **Implementar flujo OAuth** para coaches
5. **Crear endpoints de pago** con split

