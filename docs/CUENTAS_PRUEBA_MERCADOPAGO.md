# 🔑 Guía: Cuentas de Prueba de Mercado Pago

## ⚠️ Requisito CRÍTICO para Pruebas

Según la [documentación oficial de Mercado Pago](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/test/accounts):

### **Necesitas MÍNIMO 2 cuentas de prueba diferentes**:

1. **Vendedor** (Coach):
   - Cuenta requerida para **configurar la aplicación y las credenciales**
   - Esta es la cuenta que tiene las credenciales (Access Token, Public Key)
   - **NO puede ser la misma que la del comprador**

2. **Comprador** (Cliente):
   - Cuenta necesaria para **probar el proceso de compra**
   - Esta es la cuenta que hace la compra en el checkout
   - **NO puede ser la misma que la del vendedor**

3. **Integrador** (OMNIA - Marketplace):
   - Cuenta que se usa en **integraciones del modelo marketplace**
   - Solo si estás usando split payment

---

## 🚨 Regla IMPORTANTE

### **Los usuarios Comprador y Vendedor DEBEN ser del mismo país**

- Si el vendedor es de Argentina, el comprador también debe ser de Argentina
- Si el vendedor es de Brasil, el comprador también debe ser de Brasil
- **No puedes mezclar países**

---

## 🔍 Cómo Crear Cuentas de Prueba

### Paso 1: Acceder a la Sección

1. Ve a **Mercado Pago Developers**: https://www.mercadopago.com.ar/developers
2. Navega hasta **"Tus integraciones"**
3. Haz clic en tu aplicación
4. Ve a la sección **"Cuentas de prueba"**
5. Haz clic en **"Crear cuenta de prueba"**

### Paso 2: Crear Cuenta de Vendedor

1. Selecciona el **país de operación** (ej: Argentina)
2. Ingresa una descripción: "Vendedor - Coach de prueba"
3. Selecciona el tipo: **Vendedor**
4. Ingresa un valor ficticio en dinero (ej: $50,000 ARS)
5. Autoriza términos y condiciones
6. Haz clic en **"Crear cuenta de prueba"**

### Paso 3: Crear Cuenta de Comprador

1. Haz clic en **"Crear cuenta de prueba"** de nuevo
2. Selecciona el **mismo país** que el vendedor (Argentina)
3. Ingresa una descripción: "Comprador - Cliente de prueba"
4. Selecciona el tipo: **Comprador**
5. Ingresa un valor ficticio en dinero (ej: $50,000 ARS)
6. Autoriza términos y condiciones
7. Haz clic en **"Crear cuenta de prueba"**

---

## 📋 Información de las Cuentas de Prueba

Cada cuenta de prueba tiene:

- **Identificación de la cuenta**: Descripción que ingresaste
- **Tipo de cuenta**: Vendedor, Comprador o Integrador
- **País**: País seleccionado (no se puede cambiar)
- **User ID**: Número de identificación único
- **Usuario**: Nombre de usuario generado automáticamente
- **Contraseña**: Contraseña generada automáticamente

---

## ⚠️ Problema del Botón Deshabilitado - Posible Causa

### **Si estás usando la misma cuenta para vendedor y comprador:**

El botón puede quedar deshabilitado porque:
- Mercado Pago detecta que es la misma cuenta
- Hay conflictos de validación
- El sistema no permite que una cuenta se pague a sí misma

### **Solución**:

1. **Crear cuenta de prueba del comprador** separada
2. **Usar esa cuenta** para hacer la prueba de compra
3. **Asegurarse** de que ambas cuentas sean del mismo país

---

## 🔐 Iniciar Sesión con Cuentas de Prueba

### Validación por Email

Si Mercado Pago solicita autenticación por email:

1. **NO podrás acceder al email** (es una cuenta ficticia)
2. **Usa los últimos 6 dígitos del User ID** de la cuenta de prueba
3. **O usa los últimos 6 dígitos del Access Token productivo**

### Dónde encontrar el User ID:

- En la tabla de "Cuentas de prueba" en Mercado Pago Developers
- Columna "User ID"

### Dónde encontrar el Access Token:

- En "Credenciales" → "Credenciales de producción"
- Campo "Access Token"

---

## ✅ Checklist de Verificación

- [ ] **Cuenta de Vendedor creada** (para las credenciales)
- [ ] **Cuenta de Comprador creada** (para hacer la compra)
- [ ] **Ambas cuentas son del mismo país** (Argentina)
- [ ] **Estás usando la cuenta del comprador** para hacer la prueba
- [ ] **NO estás usando la misma cuenta** para vendedor y comprador
- [ ] **Las credenciales (Access Token) son de la cuenta del vendedor**

---

## 🚀 Pasos para Probar Correctamente

1. **Configurar credenciales del vendedor**:
   - Usa el Access Token de la cuenta de prueba del **vendedor**
   - Configúralo en Vercel como `MERCADOPAGO_ACCESS_TOKEN`

2. **Hacer la compra con cuenta del comprador**:
   - Inicia sesión en Mercado Pago con la cuenta de prueba del **comprador**
   - Ve a tu aplicación
   - Intenta hacer una compra
   - El botón debería estar habilitado

3. **Verificar que funcione**:
   - El botón debería estar habilitado
   - Puedes completar el pago con tarjetas de prueba
   - El pago se procesa correctamente

---

## 📚 Referencias

- [Documentación Oficial - Cuentas de Prueba](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/test/accounts)
- [Tarjetas de Prueba](https://www.mercadopago.com.ar/developers/es/guides/additional-content/your-integrations/test-cards)

---

## 💡 Nota Importante

**El problema del botón deshabilitado puede estar causado por**:
- Usar la misma cuenta para vendedor y comprador
- Cuentas de diferentes países
- No tener cuenta de comprador creada

**Solución**: Crear y usar cuentas de prueba separadas según la documentación oficial.

