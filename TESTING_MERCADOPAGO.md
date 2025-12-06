# 🧪 Guía de Testing: Mercado Pago Split Payment

## ✅ Configuración Completada

Todo está listo para testear. Sigue estos pasos:

---

## 📋 Checklist Pre-Testing

- [ ] Variables agregadas a `.env.local`
- [ ] Migraciones SQL ejecutadas en Supabase
- [ ] Redirect URI configurado en Mercado Pago
- [ ] Servidor reiniciado (`npm run dev`)

---

## 🧪 Paso 1: Autorizar como Coach

### 1.1 Login como Coach de Prueba

1. Ve a `http://localhost:3000`
2. Login con cuenta de prueba **ronaldinho**:
   - Usuario: `TESTUSER4826...` (ver en panel MP)
   - Contraseña: `VxvptDWun9`
   - User ID: `2995219181`

### 1.2 Autorizar Mercado Pago

1. Ve a la pestaña **"Profile"** (perfil)
2. Busca la sección **"Mercado Pago"**
3. Haz click en **"Conectar con Mercado Pago"**
4. Serás redirigido a Mercado Pago
5. **Login en Mercado Pago** con la cuenta de prueba `ronaldinho`
6. Autoriza a OMNIA
7. Serás redirigido de vuelta con `?mp_auth=success`
8. Deberías ver: **"Conectado correctamente"** ✅

---

## 🧪 Paso 2: Comprar como Cliente

### 2.1 Login como Cliente de Prueba

1. Cierra sesión del coach
2. Login con cuenta de prueba **totti1**:
   - Usuario: `TESTUSER4821...` (ver en panel MP)
   - Contraseña: `AlpFFZDyZw`
   - User ID: `2992707264`

### 2.2 Buscar y Comprar Actividad

1. Ve a la pestaña **"Search"** (búsqueda)
2. Busca una actividad del coach `ronaldinho`
3. Haz click en la actividad
4. Haz click en **"Comprar"**
5. Completa el formulario (método de pago, notas)
6. Haz click en **"Confirmar Compra"**

### 2.3 Procesar Pago en Mercado Pago

1. Serás redirigido a Mercado Pago Checkout
2. Usa una **tarjeta de prueba**:
   - **Visa aprobada**: `5031 7557 3453 0604`
   - CVV: `123`
   - Fecha: Cualquier fecha futura
   - Nombre: Cualquier nombre
3. Completa el pago
4. Serás redirigido de vuelta a OMNIA

---

## 🧪 Paso 3: Verificar Split Payment

### 3.1 Verificar en Base de Datos

1. Ve a **Supabase Dashboard**
2. Abre la tabla `banco`
3. Busca el registro más reciente
4. Verifica:
   - ✅ `mercadopago_payment_id` tiene un ID
   - ✅ `mercadopago_status` = `approved`
   - ✅ `marketplace_fee` = comisión de OMNIA (ej: 15%)
   - ✅ `seller_amount` = monto para el coach
   - ✅ `payment_status` = `completed`

### 3.2 Verificar Enrollment

1. Abre la tabla `activity_enrollments`
2. Busca el enrollment creado
3. Verifica:
   - ✅ `status` = `activa`
   - ✅ `payment_status` = `completed`
   - ✅ `payment_method` = `mercadopago`

---

## 🧪 Paso 4: Verificar Split Payment Manualmente

### Cálculo Esperado:

Si la actividad cuesta **$10,000 ARS**:
- **Comisión OMNIA (15%)**: $1,500 ARS
- **Coach recibe**: $8,500 ARS
- **Total pagado**: $10,000 ARS

Verifica en la tabla `banco`:
- `amount_paid` = 10000
- `marketplace_fee` = 1500
- `seller_amount` = 8500

---

## 🔍 Verificar Logs

### En el servidor (terminal):

Deberías ver logs como:
```
📥 Webhook recibido: { type: 'payment', paymentId: '...' }
✅ Webhook procesado correctamente: ...
✅ Enrollment activado: ...
```

### En la consola del navegador:

Deberías ver:
```
Datos de respuesta: { success: true, preferenceId: '...', initPoint: '...' }
```

---

## ⚠️ Problemas Comunes

### Error: "Coach no ha configurado Mercado Pago"
- **Solución**: El coach debe autorizar Mercado Pago primero (Paso 1)

### Error: "MERCADOPAGO_CLIENT_ID no configurado"
- **Solución**: Verifica que las variables estén en `.env.local` y reinicia el servidor

### Error: "Error desencriptando token"
- **Solución**: Verifica que `ENCRYPTION_KEY` esté configurada correctamente

### El pago no se activa automáticamente
- **Solución**: El webhook solo funciona en producción. En desarrollo, puedes activar manualmente el enrollment después del pago.

---

## 📝 Notas Importantes

1. **Webhook en Desarrollo**: 
   - El webhook solo funciona en producción (Vercel)
   - En desarrollo, el enrollment quedará en `pending` hasta que se active manualmente o se reciba el webhook

2. **Tarjetas de Prueba**:
   - Usa las tarjetas de prueba de Mercado Pago
   - No se cobrará dinero real

3. **Cuentas de Prueba**:
   - `ronaldinho` (Coach/Vendedor)
   - `totti1` (Cliente/Comprador)
   - `omniav1` (OMNIA/Integrador)

---

## ✅ Cuando Todo Funcione

Deberías poder:
1. ✅ Coach autoriza Mercado Pago
2. ✅ Cliente compra actividad
3. ✅ Redirige a Mercado Pago
4. ✅ Cliente paga con tarjeta de prueba
5. ✅ Split payment funciona (comisión y monto se dividen)
6. ✅ Enrollment se activa automáticamente (en producción)

---

## 🚀 Listo para Probar

**Ahora puedes acceder a Mercado Pago y testear el flujo completo.**

Empieza con el **Paso 1: Autorizar como Coach** y sigue los pasos en orden.















