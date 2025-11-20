# 🐛 Debug: Error al Pagar Suscripción con Test User

## 🔍 Problema Identificado

Al intentar pagar una suscripción con un usuario de prueba de Mercado Pago, aparece el error "Oh algo salió mal" después de hacer clic en "Pagar".

### Errores en los Logs:

1. **Public Key de Producción en la URL:**
   ```
   public_key=APP_USR-f832339e-8b39-462c-a3fd-7571aa412e66
   ```
   ⚠️ Debería ser una clave de prueba (`TEST-...`)

2. **Challenge Processing:**
   ```
   Challenge display processing - [hasChallengeUrl:false]
   Challenge processing via step next
   ```
   Esto indica que Mercado Pago intenta hacer autenticación adicional pero falla.

3. **Errores de Scheme:**
   ```
   Failed to launch 'mercadopago://pay-preference/...'
   Not allowed to launch 'meli://webview/...'
   ```
   Mercado Pago intenta abrir la app móvil pero no está disponible en el navegador.

---

## 🔍 Causas Posibles

### 1. La Aplicación en Mercado Pago está en Modo Producción

El `init_point` que genera Mercado Pago incluye la `public_key` de la aplicación configurada en su panel. Si la aplicación está en modo producción, usará credenciales de producción.

**Solución:**
- Verificar que la aplicación en Mercado Pago Developers esté configurada para usar credenciales de prueba
- O crear una aplicación separada solo para pruebas

### 2. El `sandbox_init_point` no se está usando correctamente

El código intenta usar `sandbox_init_point` en modo prueba, pero puede que Mercado Pago no lo esté generando si las credenciales están mezcladas.

**Verificar en los logs de Vercel:**
```bash
# Buscar en los logs:
📅 Creando suscripción de Mercado Pago (MODO PRUEBA)
✅ Suscripción creada exitosamente:
  init_point: "..." (debe ser sandbox)
  mode: "PRUEBA"
```

### 3. Usuario de Prueba no puede pagar en Sandbox

Las suscripciones de Mercado Pago en modo sandbox tienen restricciones. El usuario de prueba debe:
- Estar creado en el mismo entorno (sandbox)
- Tener saldo en cuenta de Mercado Pago (para `account_money`)

---

## ✅ Soluciones

### Solución 1: Verificar que se use `sandbox_init_point`

El código ya debería usar `sandbox_init_point` en modo prueba. Verificar en los logs que efectivamente se esté usando.

### Solución 2: Configurar la aplicación en Mercado Pago para Sandbox

1. Ve a: https://www.mercadopago.com.ar/developers/panel/app
2. Selecciona tu aplicación
3. Verifica que puedas crear suscripciones con credenciales de prueba
4. Si no funciona, intenta crear una aplicación nueva solo para pruebas

### Solución 3: Usar tarjeta de prueba en lugar de `account_money`

El método de pago `account_money` (dinero en cuenta) puede tener problemas en sandbox. Intenta:
1. Usar una tarjeta de prueba en lugar de dinero en cuenta
2. Verificar que las tarjetas de prueba estén configuradas correctamente

### Solución 4: Deshabilitar `account_money` temporalmente

Modificar `lib/mercadopago/subscriptions.ts` para quitar `account_money` de los métodos de pago permitidos:

```typescript
payment_methods_allowed: {
  payment_types: [
    { id: 'credit_card' },
    { id: 'debit_card' }
    // Remover: { id: 'account_money' }
  ],
  // ...
}
```

---

## 🔍 Verificaciones a Realizar

### 1. Verificar en Logs de Vercel:

```bash
# Debe aparecer:
📅 Creando suscripción de Mercado Pago (MODO PRUEBA)
✅ Suscripción creada exitosamente:
  id: "..."
  init_point: "https://sandbox.mercadopago.com.ar/..." (debe contener "sandbox")
  mode: "PRUEBA"
```

### 2. Verificar Variables de Entorno:

```bash
# En Vercel Dashboard → Environment Variables:
TEST_MERCADOPAGO_ACCESS_TOKEN=TEST-... ✅
TEST_NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-... ✅
```

### 3. Verificar que el init_point sea de Sandbox:

El `init_point` debe contener:
- `sandbox.mercadopago.com.ar` o
- `www.mercadopago.com.ar/checkout/v1/redirect` (si es sandbox, puede no tener "sandbox" en el dominio)

### 4. Verificar el Usuario de Prueba:

- El usuario debe estar creado en modo sandbox
- Debe tener saldo o una tarjeta configurada para pruebas

---

## 📝 Próximos Pasos

1. **Revisar logs de Vercel** para ver qué `init_point` se está generando
2. **Verificar configuración de la aplicación** en Mercado Pago
3. **Probar con tarjeta de prueba** en lugar de `account_money`
4. **Contactar soporte de Mercado Pago** si el problema persiste

---

## 🔗 Referencias

- [Documentación de PreApproval (Suscripciones)](https://www.mercadopago.com.ar/developers/es/docs/subscriptions/overview)
- [Usuarios de Prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/testing)
- [Tarjetas de Prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/testing/test-cards)

