# Comparación: Checkout Pro vs Checkout API (Bricks) para OMNIA

## 🎯 Recomendación: **Checkout API (Bricks)**

### ✅ Ventajas para OMNIA:

1. **Mejor Experiencia de Usuario**
   - Cliente paga **dentro de OMNIA** (no sale del sitio)
   - Mayor confianza y conversión
   - Diseño personalizado que coincide con OMNIA

2. **Soporta Pagos Recurrentes**
   - Útil para suscripciones futuras
   - Ya tienes campos `is_subscription` y `subscription_id` en `activity_enrollments`

3. **Split Payment Compatible**
   - Usa `application_fee` para dividir pagos
   - Funciona perfectamente con el modelo marketplace

4. **Mayor Control**
   - Personalización completa del checkout
   - Mejor integración con tu diseño

---

## 📊 Comparación Detallada

| Característica | Checkout Pro | Checkout API (Bricks) | Suscripciones |
|---------------|--------------|----------------------|---------------|
| **Dificultad de integración** | ⭐ Fácil | ⭐⭐ Intermedia | ⭐⭐ Intermedia |
| **Cliente sale del sitio** | ❌ Sí | ✅ No | ✅ No |
| **Experiencia personalizable** | ❌ No | ✅ Sí | ✅ Sí |
| **Pagos recurrentes** | ❌ No | ✅ Sí | ✅ Solo recurrentes |
| **Pagos únicos** | ✅ Sí | ✅ Sí | ❌ No |
| **Precio/Comisión** | ✅ Mismo | ✅ Mismo | ✅ Mismo |
| **Split payment** | ✅ `marketplace_fee` | ✅ `application_fee` | ✅ `application_fee` |
| **Ideal para OMNIA** | ⚠️ Básico | ✅ **Recomendado** | ❌ Solo si necesitas recurrentes ahora |

---

## 🔧 Implementación con Checkout API (Bricks)

### Para Split Payment:

```typescript
// Checkout API usa 'application_fee' en lugar de 'marketplace_fee'
const paymentData = {
  transaction_amount: totalAmount,
  token: cardToken, // Token de la tarjeta
  description: activity.title,
  installments: 1,
  payment_method_id: 'visa',
  payer: {
    email: clientEmail
  },
  application_fee: marketplaceFee, // ⭐ Comisión de OMNIA
  external_reference: `enrollment_${enrollmentId}`
};
```

### Diferencias clave:

| Checkout Pro | Checkout API (Bricks) |
|-------------|----------------------|
| `marketplace_fee` | `application_fee` |
| Redirige a MP | Pago en tu sitio |
| Menos personalizable | Totalmente personalizable |

---

## 📝 Decisión Final

**Para OMNIA, usa: Checkout API (Bricks)**

**Razones**:
1. ✅ Mejor UX (cliente no sale del sitio)
2. ✅ Soporta pagos únicos (tu caso actual) ✅
3. ✅ Soporta pagos recurrentes (futuro) ✅
4. ✅ Split payment compatible
5. ✅ Más profesional para un marketplace
6. ✅ **El precio NO cambia** - misma comisión en todos los casos

**Cuándo usar Checkout Pro**:
- Si necesitas implementar rápido y no te importa que el cliente salga del sitio
- Si no planeas tener suscripciones

**Cuándo usar Suscripciones**:
- Solo si necesitas implementar pagos recurrentes AHORA
- No es necesario si solo vendes actividades únicas

---

## 💰 ¿Bricks cambia el precio?

### ❌ **NO, el precio NO cambia**

- **Comisiones de Mercado Pago**: Son las mismas para todos los checkouts
- **Comisión de OMNIA**: La misma (ej: 15%)
- **Split Payment**: Funciona igual

**Ejemplo**:
- Actividad: $10,000 ARS
- Comisión OMNIA (15%): $1,500 ARS
- Coach recibe: $8,500 ARS

**Esto es igual si usas**:
- ✅ Checkout Pro
- ✅ Checkout API (Bricks)
- ✅ Suscripciones

**La única diferencia es la experiencia de usuario, NO el precio.**

---

## 🚀 Próximos Pasos

1. **Seleccionar "Checkout API" (Bricks)** en la configuración de Mercado Pago
2. **Instalar SDK**: `npm install mercadopago`
3. **Implementar con `application_fee`** para split payment
4. **Configurar Bricks en el frontend** para el checkout personalizado

