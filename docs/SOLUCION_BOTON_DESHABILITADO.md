# 🔧 Solución: Botón de Pago Deshabilitado en Mercado Pago

## ⚠️ Problema

El botón "Pagar" en el checkout de Mercado Pago aparece **deshabilitado/gris** incluso cuando:
- ✅ Las tarjetas están visibles
- ✅ El CVV está prellenado con "123"
- ✅ El monto es válido ($10,000 ARS)

---

## 🎯 Solución Principal: CVV Manual

### **El problema más común es que el CVV está prellenado**

Mercado Pago **requiere que el usuario ingrese el CVV manualmente**. Si el CVV está prellenado, el botón permanecerá deshabilitado.

### ✅ Pasos para Solucionarlo:

1. **En el checkout de Mercado Pago**:
   - **Borra** el "123" del campo "Código de seguridad"
   - **Escribe "123" de nuevo** manualmente
   - El botón debería habilitarse automáticamente

2. **Si el botón sigue deshabilitado**:
   - Intenta seleccionar otra tarjeta
   - O selecciona "Dinero disponible" si tienes saldo
   - Luego vuelve a la tarjeta

---

## 🔍 Otras Causas Posibles

### 1. **Cuenta de Prueba del Comprador**

**Problema**: Estás usando la misma cuenta para vendedor y comprador.

**Solución**:
1. Ve a Mercado Pago Developers → Tu aplicación → "Cuentas de prueba"
2. Crea una cuenta de prueba del **comprador** (diferente a la del vendedor)
3. Usa esa cuenta para hacer la prueba de compra

### 2. **Información del Payer Incompleta**

**Verificar en los logs del servidor**:
- Ve a Vercel Dashboard → Tu proyecto → Logs
- Busca el log: `📋 Creando preferencia con los siguientes datos:`
- Verifica que `payer` tenga:
  - ✅ `email`
  - ✅ `name`
  - ✅ `surname`
  - ⚠️ `phone` (opcional pero recomendado)
  - ⚠️ `identification` (puede ser requerido)

### 3. **Marketplace Fee en Modo Test**

**Problema**: El `marketplace_fee` puede causar problemas si el coach no tiene cuenta de marketplace configurada.

**Solución temporal**:
- Comentar temporalmente el `marketplace_fee` en el código para probar
- Si funciona sin `marketplace_fee`, el problema está en la configuración del marketplace

---

## 📋 Checklist de Verificación

- [ ] **CVV ingresado manualmente** (no prellenado)
- [ ] **Cuenta de prueba del comprador** creada y usada
- [ ] **Monto mayor a $1 ARS** (ya tienes $10,000 ✅)
- [ ] **Logs del servidor revisados** para ver qué se envía
- [ ] **Credenciales correctas** en Vercel (ya actualizadas ✅)

---

## 🔍 Cómo Revisar los Logs

### En Vercel:

1. Ve a **Vercel Dashboard** → Tu proyecto
2. Ve a **Deployments** → Último deployment
3. Haz clic en **"View Function Logs"** o **"View Build Logs"**
4. Busca logs que empiecen con:
   - `📋 Creando preferencia con los siguientes datos:`
   - `✅ Preferencia creada exitosamente:`
   - `🔍 Preferencia completa que se enviará a Mercado Pago:`

### Qué buscar en los logs:

```json
{
  "payer": {
    "email": "usuario@ejemplo.com",
    "name": "Nombre",
    "surname": "Apellido",
    "hasPhone": true/false,
    "hasIdentification": true/false
  },
  "items": [...],
  "payment_methods": {...},
  "hasMarketplaceFee": true/false
}
```

---

## 🚀 Prueba Rápida

1. **Abre el checkout de Mercado Pago**
2. **Selecciona una tarjeta**
3. **Borra el CVV** (si está prellenado)
4. **Escribe "123" manualmente**
5. **Verifica que el botón se habilite**

Si el botón se habilita después de esto, el problema era el CVV prellenado.

---

## 📞 Si el Problema Persiste

Si después de probar todo lo anterior el botón sigue deshabilitado:

1. **Revisa los logs del servidor** en Vercel
2. **Comparte los logs** conmigo para analizar
3. **Verifica en la consola del navegador** si hay errores de JavaScript
4. **Contacta soporte de Mercado Pago** si es necesario

---

## 💡 Nota Importante

El botón deshabilitado **puede ser una validación del frontend de Mercado Pago** que no controlamos directamente. Si el CVV está prellenado, Mercado Pago lo detecta y deshabilita el botón por seguridad.

