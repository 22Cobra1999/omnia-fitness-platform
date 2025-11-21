# 🚀 Guía Rápida: Realizar Compras de Prueba

## ⚡ Pasos Rápidos

### 1. Verificar Credenciales de Prueba

```bash
# Verificar qué credenciales están configuradas
./scripts/verificar-credenciales-vercel.sh
```

**Deben ser de PRUEBA**:
- Public Key: `APP_USR-f5589935-8dea-4963-af32-b0f57a9ad7fb`
- Access Token: Empieza con `APP_USR-8497664518687621...`

Si no son de prueba, actualiza:
```bash
./scripts/update-mercadopago-credentials.sh
```

---

### 2. Hacer una Compra de Prueba

#### Paso 1: Ir a la aplicación
- URL: https://omnia-app.vercel.app
- Inicia sesión como **cliente** (no coach)

#### Paso 2: Seleccionar actividad
- Busca una actividad
- Haz clic en **"Comprar"**
- Selecciona **"Mercado Pago"**

#### Paso 3: Completar pago
- Haz clic en **"Pagar con Mercado Pago"**
- Serás redirigido a Mercado Pago
- **Inicia sesión** con cuenta de prueba del **comprador**

#### Paso 4: Usar tarjeta de prueba

**Tarjeta para pago aprobado**:
- Número: `5031 7557 3453 0604`
- CVV: `123` (borrar y escribir manualmente)
- Vencimiento: `11/30`
- Nombre: `APRO`
- DNI: `12345678`

---

## 💳 Tarjetas de Prueba Rápidas

### ✅ Pago Aprobado
```
Número: 5031 7557 3453 0604
CVV: 123
Vencimiento: 11/30
Nombre: APRO
DNI: 12345678
```

### ❌ Pago Rechazado
```
Número: 5031 7557 3453 0604
CVV: 123
Vencimiento: 11/30
Nombre: OTHE
DNI: 12345678
```

### ⏳ Pago Pendiente
```
Número: 5031 7557 3453 0604
CVV: 123
Vencimiento: 11/30
Nombre: CONT
DNI: 12345678
```

---

## ✅ Verificar que Funcionó

1. **Redirección correcta**:
   - Aprobado → `/payment/success`
   - Rechazado → `/payment/failure`
   - Pendiente → `/payment/pending`

2. **Base de datos**:
   - Verifica en Supabase que se creó el registro en `banco`
   - Verifica que el `payment_status` sea correcto

3. **Logs en Vercel**:
   - Revisa los logs para ver que no hay errores

---

## 🐛 Problemas Comunes

### Botón deshabilitado
- ✅ Usa cuenta de **comprador** (no vendedor)
- ✅ Borra y reescribe el CVV manualmente
- ✅ Verifica que el monto sea > $0

### No aparecen tarjetas
- ✅ Verifica credenciales de prueba
- ✅ Usa cuenta de prueba del comprador
- ✅ Verifica que el monto sea válido

---

## 📚 Documentación Completa

Para más detalles, ver:
- `docs/COMPRAS_PRUEBA_MERCADOPAGO.md` - Guía completa
- `docs/CREDENCIALES_MERCADOPAGO_COMPLETAS.md` - Todas las credenciales

---

**¡Listo para probar!** 🚀

