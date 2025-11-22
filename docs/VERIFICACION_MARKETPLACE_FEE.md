# 🔍 Verificación: Marketplace Fee y Split Payment

## 📋 Resumen

**Pregunta**: ¿La cuenta omniav1 está configurada para recibir la comisión del marketplace?

**Respuesta**: 
- ✅ **Sí**, la cuenta omniav1 está configurada como marketplace
- ⚠️ **PERO**, en modo prueba, el `marketplace_fee` NO se incluye para evitar problemas con el botón de pagar
- ✅ **En producción**, el `marketplace_fee` SÍ se incluye y OMNIA recibe su comisión

---

## 🔍 Verificación Actual

### 1. Cuenta omniav1

- **User ID**: `2995219179`
- **Tipo**: Integrador/Marketplace
- **Estado**: ✅ Configurada
- **Credenciales**: ✅ Configuradas en Vercel

### 2. Cálculo de Comisión

- **Porcentaje**: 15% (configurado en `marketplace_commission_config`)
- **Función SQL**: `calculate_marketplace_commission(amount)`
- **Ejemplo**: $10,000 ARS → $1,500 ARS de comisión

### 3. Inclusión del Marketplace Fee

**En Modo Prueba**:
```typescript
// NO se incluye marketplace_fee
...(marketplaceTokenIsTest ? {} : ...)
```

**En Producción**:
```typescript
// SÍ se incluye marketplace_fee
...(marketplaceFee > 0 && sellerAmount > 0 ? { marketplace_fee: marketplaceFee } : {})
```

---

## 🧪 Cómo Verificar

### Test 1: Verificar que se Calcula la Comisión

1. Revisa los logs de Vercel cuando se crea una preferencia
2. Busca: `📋 Marketplace Fee: 1500` (o el monto calculado)
3. Busca: `📋 Has Marketplace Fee: true/false`

### Test 2: Verificar que se Incluye en la Preferencia

**En Modo Prueba**:
- Busca: `🔍 Usando preferencia simple (sin marketplace_fee): true`
- Esto significa que NO se incluye `marketplace_fee`

**En Producción**:
- Busca: `🔍 Usando preferencia simple (sin marketplace_fee): false`
- Esto significa que SÍ se incluye `marketplace_fee`

### Test 3: Verificar en la Preferencia Creada

Revisa el log completo de la preferencia:
```json
{
  "items": [...],
  "marketplace_fee": 1500,  // ✅ Si aparece, se está incluyendo
  ...
}
```

---

## ⚠️ Problema Actual

### Por qué NO se incluye en Modo Prueba

El `marketplace_fee` puede causar que el botón de pagar se deshabilite en modo prueba porque:

1. **Mezcla de entornos**: Si el coach tiene token de producción pero el marketplace está en prueba
2. **Validaciones de Mercado Pago**: Mercado Pago puede rechazar split payment en modo prueba si hay problemas de configuración
3. **Cuentas de prueba**: Las cuentas de prueba pueden no tener permisos completos para split payment

### Solución Implementada

**Temporalmente**, en modo prueba NO se incluye `marketplace_fee` para permitir que las pruebas funcionen.

**En producción**, SÍ se incluye `marketplace_fee` y OMNIA recibe su comisión correctamente.

---

## ✅ Verificar que Funciona en Producción

### Paso 1: Verificar Logs

Cuando se crea una preferencia en producción, deberías ver:
```
📋 Marketplace Fee: 1500
📋 Has Marketplace Fee: true
🔍 Usando preferencia simple (sin marketplace_fee): false
```

### Paso 2: Verificar en Mercado Pago

1. Inicia sesión en la cuenta omniav1
2. Ve a "Tu actividad"
3. Busca pagos recientes
4. Verifica que aparezcan comisiones recibidas

### Paso 3: Verificar en la Base de Datos

```sql
SELECT 
  id,
  amount_paid,
  marketplace_fee,
  seller_amount,
  payment_status,
  payment_date
FROM banco
WHERE marketplace_fee > 0
ORDER BY payment_date DESC
LIMIT 10;
```

---

## 🔧 Cómo Habilitar Marketplace Fee en Modo Prueba

Si quieres probar el split payment en modo prueba:

### Opción 1: Modificar Temporalmente el Código

En `app/api/mercadopago/checkout-pro/create-preference/route.ts`:

```typescript
// Cambiar esta línea:
...(marketplaceTokenIsTest ? {} : (marketplaceFee > 0 && sellerAmount > 0 ? { marketplace_fee: marketplaceFee } : {}))

// Por esta (para incluir siempre):
...(marketplaceFee > 0 && sellerAmount > 0 ? { marketplace_fee: marketplaceFee } : {})
```

### Opción 2: Verificar Configuración del Marketplace

1. Asegúrate de que la cuenta omniav1 esté correctamente configurada como marketplace
2. Verifica que tenga permisos para recibir comisiones
3. Asegúrate de que tanto el marketplace como el coach usen tokens de prueba

---

## 📊 Resumen de Configuración

| Aspecto | Modo Prueba | Producción |
|---------|-------------|------------|
| **Marketplace Fee** | ❌ NO incluido | ✅ SÍ incluido |
| **OMNIA recibe comisión** | ❌ NO | ✅ SÍ |
| **Coach recibe** | ✅ Todo el monto | ✅ Monto - comisión |
| **Razón** | Evitar problemas con botón | Funcionamiento normal |

---

## 🚀 Próximos Pasos

1. **Verificar logs** en producción para confirmar que `marketplace_fee` se incluye
2. **Verificar en Mercado Pago** que OMNIA recibe comisiones
3. **Si es necesario**, probar habilitar `marketplace_fee` en modo prueba
4. **Documentar** cualquier problema encontrado

---

**Última actualización**: Verificación de marketplace_fee y split payment

