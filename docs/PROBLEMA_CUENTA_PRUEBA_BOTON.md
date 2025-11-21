# 🐛 Problema: Botón Deshabilitado con Cuenta de Prueba

## 🔍 Problema Reportado

- ✅ **Cuenta real**: El botón de pagar **funciona correctamente**
- ❌ **Cuenta de prueba**: El botón de pagar **NO funciona** (está deshabilitado)

---

## 🔍 Posibles Causas

### 1. **Credenciales de Prueba vs Cuenta de Prueba**

**Problema**: Las credenciales de prueba (`APP_USR-8497664518687621...`) están asociadas a un User ID específico (`2995219181`). Si intentas pagar con una cuenta de prueba diferente, puede haber conflictos.

**Solución**:
- Verificar que la cuenta de prueba del **comprador** sea compatible con las credenciales
- Asegurarse de que ambas cuentas (vendedor y comprador) sean del mismo país

---

### 2. **Información del Payer Incompleta**

**Problema**: Las cuentas de prueba pueden no tener toda la información requerida (DNI, teléfono, etc.), lo que puede causar que Mercado Pago deshabilite el botón.

**Solución actual**: El código ya incluye valores por defecto:
```typescript
identification: {
  type: 'DNI',
  number: '12345678' // DNI de prueba genérico
}
```

Pero puede que necesitemos más información o validación.

---

### 3. **Validación de Mercado Pago para Cuentas de Prueba**

**Problema**: Mercado Pago puede tener validaciones adicionales para cuentas de prueba que requieren:
- Email verificado
- Información completa del perfil
- Configuración específica de la cuenta

**Solución**: Verificar que la cuenta de prueba tenga:
- Email configurado
- Perfil completo
- País correcto (Argentina)

---

### 4. **Access Token del Coach vs Marketplace**

**Problema**: Si el coach tiene credenciales de producción pero estamos usando credenciales de prueba del marketplace, puede haber conflictos.

**Solución**: Verificar que:
- El coach tenga credenciales de prueba O
- Usar el Access Token del marketplace para crear la preferencia cuando sea cuenta de prueba

---

## 🔧 Soluciones a Probar

### Solución 1: Verificar Cuentas de Prueba

1. **Verificar que tengas 2 cuentas de prueba**:
   - Cuenta de **Vendedor** (para las credenciales)
   - Cuenta de **Comprador** (para hacer la compra)

2. **Verificar que ambas sean del mismo país** (Argentina)

3. **Verificar que la cuenta de comprador tenga**:
   - Email configurado
   - Perfil completo
   - País: Argentina

---

### Solución 2: Usar el Access Token del Marketplace

Si el coach tiene credenciales de producción, podemos modificar el código para usar el Access Token del marketplace cuando detectemos que es una cuenta de prueba.

---

### Solución 3: Agregar Más Información del Payer

Agregar más información del payer en la preferencia:
- Teléfono completo
- Dirección (si está disponible)
- Más información de identificación

---

### Solución 4: Verificar Logs

Revisar los logs en Vercel cuando intentas pagar con cuenta de prueba para ver qué error específico está ocurriendo.

---

## 📋 Pasos para Diagnosticar

### Paso 1: Verificar Cuentas de Prueba

1. Ve a Mercado Pago Developers
2. Ve a "Cuentas de prueba"
3. Verifica que tengas:
   - ✅ Cuenta de **Vendedor**
   - ✅ Cuenta de **Comprador**
   - ✅ Ambas de **Argentina**

### Paso 2: Verificar Información de la Cuenta de Comprador

1. Inicia sesión en Mercado Pago con la cuenta de prueba del comprador
2. Verifica que tenga:
   - ✅ Email configurado
   - ✅ País: Argentina
   - ✅ Perfil completo

### Paso 3: Revisar Logs

1. Intenta hacer una compra con la cuenta de prueba
2. Revisa los logs en Vercel
3. Busca errores o advertencias relacionados con:
   - Payer information
   - Account validation
   - Preference creation

### Paso 4: Comparar Preferencias

Compara la preferencia creada con cuenta real vs cuenta de prueba:
- ¿Hay diferencias en los datos del payer?
- ¿Hay diferencias en la configuración?
- ¿Hay errores diferentes en los logs?

---

## 🔍 Código a Revisar

### Archivo: `app/api/mercadopago/checkout-pro/create-preference/route.ts`

Verificar:
1. Cómo se obtiene el Access Token (coach vs marketplace)
2. Información del payer que se envía
3. Validaciones que se hacen

---

## 💡 Solución Temporal

Mientras investigamos, puedes:
1. Usar tu cuenta real para probar (funciona)
2. Verificar que las cuentas de prueba estén configuradas correctamente
3. Revisar los logs para ver el error específico

---

## 📚 Referencias

- `docs/CUENTAS_PRUEBA_MERCADOPAGO.md` - Guía de cuentas de prueba
- `docs/PROBLEMA_BOTON_DESHABILITADO_CUENTAS_PRUEBA.md` - Análisis del problema

---

**Última actualización**: Análisis del problema con cuentas de prueba

