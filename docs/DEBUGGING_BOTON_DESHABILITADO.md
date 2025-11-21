# 🐛 Debugging: Botón de Pago Deshabilitado

## ✅ Deploy Completado

**URL de Producción**: https://omnia-app.vercel.app

**Último Deploy**: Completado exitosamente

---

## 🔍 Pasos para Debugging

### 1. **Probar el CVV Manual (MÁS IMPORTANTE)**

El problema más común es que el CVV está prellenado. **Mercado Pago requiere que el usuario ingrese el CVV manualmente**.

**Pasos**:
1. Abre el checkout de Mercado Pago
2. Selecciona una tarjeta
3. **Borra completamente** el "123" del campo "Código de seguridad"
4. **Escribe "123" de nuevo** manualmente
5. El botón debería habilitarse automáticamente

### 2. **Revisar Logs del Servidor**

**En Vercel Dashboard**:
1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto `omnia-app`
3. Ve a **Deployments** → Último deployment
4. Haz clic en **"View Function Logs"**
5. Busca logs que empiecen con:
   - `📋 Creando preferencia con los siguientes datos:`
   - `✅ Preferencia creada exitosamente:`
   - `🔍 Preferencia completa que se enviará a Mercado Pago:`

**O desde la terminal**:
```bash
vercel logs --follow
```

### 3. **Verificar Variables de Entorno**

Verifica que las credenciales estén correctas en Vercel:

```bash
vercel env ls production | grep MERCADOPAGO
```

Deberías ver:
- ✅ `MERCADOPAGO_ACCESS_TOKEN` = `APP_USR-8497664518687621-...`
- ✅ `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` = `APP_USR-f5589935-...`

### 4. **Revisar Consola del Navegador**

Abre la consola del navegador (F12) y busca:
- ❌ Errores de JavaScript
- ⚠️ Warnings de BRICKS
- ℹ️ Logs de la preferencia creada

---

## 🔍 Qué Buscar en los Logs

### Log de Preferencia Creada:

```json
{
  "totalAmount": 10000,
  "marketplaceFee": 1500,
  "sellerAmount": 8500,
  "clientEmail": "usuario@ejemplo.com",
  "payer": {
    "email": "usuario@ejemplo.com",
    "name": "Nombre",
    "surname": "Apellido",
    "hasPhone": true/false,
    "hasIdentification": true/false
  },
  "items": [...],
  "payment_methods": {...},
  "hasMarketplaceFee": true
}
```

### Verificar que:
- ✅ `totalAmount` > 0
- ✅ `payer.email` está presente
- ✅ `payer.name` y `payer.surname` están presentes
- ✅ `items` tiene al menos un item con `unit_price` > 0

---

## 🚨 Problemas Comunes y Soluciones

### Problema 1: CVV Prellenado
**Solución**: Borrar y reescribir el CVV manualmente

### Problema 2: Cuenta de Prueba Incorrecta
**Solución**: Usar cuenta de prueba del comprador diferente a la del vendedor

### Problema 3: Marketplace Fee en Modo Test
**Solución**: Verificar que el coach tenga cuenta de marketplace configurada

### Problema 4: Información del Payer Incompleta
**Solución**: Verificar en los logs que `payer` tenga todos los campos necesarios

---

## 📞 Si el Problema Persiste

1. **Comparte los logs del servidor** (de Vercel)
2. **Comparte los logs de la consola del navegador**
3. **Indica qué pasos seguiste** para intentar solucionarlo
4. **Menciona si probaste el CVV manual**

---

## 🔗 Enlaces Útiles

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Logs de Vercel**: https://vercel.com/franco-pomati-cutoffs-projects/omnia-app
- **Documentación Mercado Pago**: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro

