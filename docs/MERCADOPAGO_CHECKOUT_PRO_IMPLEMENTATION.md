# Implementación de Mercado Pago Checkout Pro

## 📋 Resumen

Esta implementación proporciona una integración completa y limpia de Mercado Pago Checkout Pro para OMNIA, siguiendo las mejores prácticas de seguridad y manejo de errores.

## 🏗️ Arquitectura

### Backend

#### 1. Endpoint de Creación de Preferencias
**Ruta:** `/api/mercadopago/checkout-pro/create-preference`

**Método:** `POST`

**Autenticación:** Requerida

**Body:**
```json
{
  "activityId": "123"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "preferenceId": "2992707264-abc123...",
  "initPoint": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "marketplaceFee": 1500,
  "sellerAmount": 8500,
  "externalReference": "omnia_123_user456_1234567890"
}
```

**Errores:**
- `401 UNAUTHORIZED`: Usuario no autenticado
- `400 MISSING_ACTIVITY_ID`: activityId no proporcionado
- `404 ACTIVITY_NOT_FOUND`: Actividad no encontrada
- `400 COACH_NOT_CONFIGURED`: Coach no tiene Mercado Pago configurado
- `500 INTERNAL_SERVER_ERROR`: Error interno del servidor

#### 2. Webhook de Notificaciones
**Ruta:** `/api/mercadopago/webhook`

**Método:** `POST`

**Autenticación:** Validación de origen recomendada (no implementada aún)

**Flujo:**
1. Recibe notificación de Mercado Pago
2. Valida el tipo de notificación (solo procesa `payment`)
3. Consulta detalles del pago en Mercado Pago
4. Busca registro en `banco` por `preference_id` o `external_reference`
5. Actualiza estado del pago en `banco`
6. Si el pago fue aprobado:
   - Crea `enrollment` si no existe
   - Duplica detalles del programa si es necesario
   - Activa el enrollment

### Frontend

#### 1. Librería de Utilidades
**Archivo:** `lib/mercadopago/checkout-pro.ts`

**Funciones principales:**
- `createCheckoutProPreference(activityId)`: Crea una preferencia de pago
- `redirectToMercadoPagoCheckout(initPoint, activityId?, preferenceId?)`: Redirige al checkout
- `getCheckoutProErrorMessage(error)`: Obtiene mensaje de error amigable

#### 2. Componente de Botón
**Archivo:** `components/mercadopago/checkout-pro-button.tsx`

**Componentes:**
- `CheckoutProButton`: Botón básico con manejo de errores
- `CheckoutProButtonWithError`: Botón con mensaje de error inline

**Props:**
```typescript
interface CheckoutProButtonProps {
  activityId: string | number;
  price?: number;
  buttonText?: string;
  className?: string;
  onPaymentStart?: () => void;
  onError?: (error: string) => void;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}
```

#### 3. Páginas de Resultado
- `/payment/success`: Pago exitoso
- `/payment/failure`: Pago fallido o cancelado
- `/payment/pending`: Pago pendiente

## 🔒 Seguridad

### Validaciones Implementadas

1. **Autenticación**: Todos los endpoints requieren sesión válida
2. **Validación de datos**: Validación de tipos y valores
3. **Manejo de errores**: Códigos de error específicos y mensajes descriptivos
4. **Logging**: Logs detallados para debugging (sin exponer información sensible)

### Recomendaciones Adicionales

1. **Validación de origen del webhook**: Implementar validación de IP o firma
2. **Rate limiting**: Limitar requests por usuario/IP
3. **Sanitización**: Validar y sanitizar todos los inputs
4. **HTTPS**: Asegurar que todas las comunicaciones sean HTTPS

## 📝 Flujo Completo

```
1. Usuario hace clic en "Pagar"
   ↓
2. Frontend llama a createCheckoutProPreference()
   ↓
3. Backend crea preferencia en Mercado Pago
   ↓
4. Backend guarda registro en `banco` (sin enrollment)
   ↓
5. Frontend redirige a initPoint de Mercado Pago
   ↓
6. Usuario completa pago en Mercado Pago
   ↓
7. Mercado Pago redirige a /payment/success|failure|pending
   ↓
8. Mercado Pago envía webhook a /api/mercadopago/webhook
   ↓
9. Webhook actualiza `banco` y crea `enrollment` si el pago fue aprobado
```

## 🧪 Casos de Prueba

### Casos de Éxito

1. **Pago aprobado con tarjeta**
   - Usuario completa pago
   - Webhook recibe notificación
   - Enrollment se crea correctamente
   - Usuario puede acceder a la actividad

2. **Pago con dinero en cuenta**
   - Usuario tiene saldo suficiente
   - Pago se procesa inmediatamente
   - Enrollment se crea

### Casos de Error

1. **Coach no configurado**
   - Error: `COACH_NOT_CONFIGURED`
   - Mensaje: "El coach de esta actividad no ha configurado Mercado Pago..."

2. **Actividad no encontrada**
   - Error: `ACTIVITY_NOT_FOUND`
   - Status: 404

3. **Pago rechazado**
   - Usuario es redirigido a `/payment/failure`
   - No se crea enrollment
   - Estado se guarda en `banco`

4. **Pago pendiente**
   - Usuario es redirigido a `/payment/pending`
   - Webhook procesa cuando se confirma
   - Enrollment se crea cuando se aprueba

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
MERCADOPAGO_ACCESS_TOKEN=TEST-... o APP_USR-...
NEXT_PUBLIC_APP_URL=https://omnia-app.vercel.app
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-... o APP_USR-...
```

### Configuración del Webhook en Mercado Pago

1. Ir a [Tus integraciones](https://www.mercadopago.com.ar/developers/panel/app)
2. Seleccionar tu aplicación
3. Ir a "Webhooks"
4. Configurar URL: `https://omnia-app.vercel.app/api/mercadopago/webhook`
5. Seleccionar tópicos: `payment`

## 📚 Referencias

- [Documentación oficial de Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro)
- [Documentación de Webhooks](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks)
- [MCP Server de Mercado Pago](docs/MCP_SERVER_CONFIGURADO.md)

## 🐛 Troubleshooting

### El botón no redirige
- Verificar que `initPoint` se recibe correctamente
- Verificar logs del servidor
- Verificar que el endpoint retorna `success: true`

### El webhook no se procesa
- Verificar que la URL está configurada en Mercado Pago
- Verificar logs del servidor
- Verificar que el endpoint retorna `200 OK`

### El enrollment no se crea
- Verificar que el webhook se procesó correctamente
- Verificar que el pago tiene status `approved`
- Verificar logs del webhook

## ✅ Checklist de Implementación

- [x] Endpoint de creación de preferencias
- [x] Webhook con validaciones
- [x] Componente frontend
- [x] Páginas de resultado
- [x] Manejo de errores
- [x] Documentación
- [ ] Validación de origen del webhook (recomendado)
- [ ] Tests unitarios
- [ ] Tests de integración

