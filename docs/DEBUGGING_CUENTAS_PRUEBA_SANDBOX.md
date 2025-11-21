# 🔍 Debugging: Cuentas de Prueba Bloqueadas en Sandbox

## 🐛 Problema Reportado

**Síntoma**: 
- ✅ Con cuenta **real** de Mercado Pago SÍ funciona el pago
- ❌ Con cuenta de **prueba** NO funciona el pago
- El checkout está en sandbox pero bloquea cuentas de prueba

---

## 🔍 Análisis del Problema

### Causa Probable

El problema ocurre cuando:
1. El **coach tiene token de producción** (obtenido vía OAuth con cuenta real)
2. El **marketplace tiene token de prueba** (configurado en Vercel)
3. Mercado Pago detecta **mezcla de entornos** y bloquea cuentas de prueba

### Cuentas de Prueba Identificadas

Según las imágenes proporcionadas, tienes estas cuentas de prueba:

| Rol | Nombre | User ID | Username | Password |
|-----|--------|---------|----------|----------|
| **Vendedor** | - | `2995219181` | `TESTUSER4826...` | `VxvptDWun9` |
| **Integrador** | `omniav1` | `2995219179` | `TESTUSER5483...` | `BoZ82j4ZmY` |
| **Comprador** | `totti1` | `2992707264` | `TESTUSER4821...` | (cortado) |

---

## ✅ Solución Implementada

### Lógica de Detección Mejorada

El código ahora:

1. **Detecta si el coach es cuenta de prueba** basándose en el User ID:
   ```typescript
   const TEST_USER_IDS = [
     '2995219181', // ronaldinho (coach/vendedor de prueba)
     '2992707264', // totti1 (cliente/comprador de prueba)
     '2995219179'  // omniav1 (marketplace/integrador de prueba)
   ];
   ```

2. **Detecta si el token del marketplace es de prueba**:
   - Verifica si empieza con `TEST-`
   - Verifica si contiene user IDs de prueba conocidos
   - Verifica si contiene partes del token de prueba conocido (`8497664518687621`)

3. **Prioriza el token de prueba del marketplace**:
   - Si el marketplace tiene token de prueba → **SIEMPRE** usarlo
   - Si el coach es cuenta de prueba conocida → usar token del marketplace
   - Esto garantiza que las cuentas de prueba funcionen

---

## 📋 Pasos para Verificar

### Paso 1: Revisar Logs en Vercel

1. Ve a Vercel Dashboard → Deployments → Último deployment → Logs
2. Busca los logs que empiezan con `🔍 ========== ANÁLISIS DE TOKENS ==========`
3. Verifica:
   - ✅ `Coach User ID`: Debe ser `2995219181` (ronaldinho)
   - ✅ `Es cuenta de prueba conocida`: Debe ser `true`
   - ✅ `Marketplace Token es TEST`: Debe ser `true`
   - ✅ `Token seleccionado`: Debe ser `marketplace (test)` o `marketplace (test user fallback)`

### Paso 2: Verificar Credenciales del Coach

El coach `ronaldinho` (User ID: `2995219181`) debe estar conectado vía OAuth.

**Si el coach tiene token de producción**:
- El código automáticamente usará el token del marketplace
- Los logs mostrarán: `⚠️ Coach es cuenta de prueba pero tiene token de producción.`

**Si el coach tiene token de prueba**:
- El código usará el token del coach
- Los logs mostrarán: `✅ Coach tiene token de prueba. Usando token del coach.`

### Paso 3: Verificar Token del Marketplace

El token del marketplace debe ser de prueba:
- Valor en Vercel: `APP_USR-8497664518687621-112020-b8d6314ad9be3f5f9b55182b157921c1-2995219181`
- Este token contiene el user ID `2995219181` al final
- El código lo detecta como token de prueba

---

## 🔧 Solución Manual (Si Persiste)

Si el problema persiste después del deploy, puedes forzar el uso del token del marketplace:

### Opción 1: Verificar que el Coach Use Cuenta de Prueba

1. **Desconectar** el coach de Mercado Pago en OMNIA
2. **Conectar nuevamente** pero esta vez:
   - Usar la cuenta de prueba del **vendedor** (`TESTUSER4826...` / `VxvptDWun9`)
   - Esto generará un token de prueba para el coach

### Opción 2: Verificar Logs Detallados

Haz una nueva compra y revisa los logs. Debes ver:

```
🔍 ========== ANÁLISIS DE TOKENS ==========
🔍 Coach User ID: 2995219181
🔍 Es cuenta de prueba conocida: true
🔍 Marketplace Token es TEST: true
✅ Marketplace tiene token de prueba. Usando token del marketplace para permitir cuentas de prueba.
🔍 Token seleccionado: marketplace (test)
```

Si ves `Token seleccionado: coach (production)`, entonces el código no está detectando correctamente el token de prueba del marketplace.

---

## 🧪 Cómo Probar

### Test 1: Con Cuenta de Prueba del Comprador

1. Ve a la aplicación: https://omnia-app.vercel.app
2. Inicia sesión como **cliente**
3. Selecciona una actividad del coach `ronaldinho` (User ID: `2995219181`)
4. Haz clic en "Pagar con Mercado Pago"
5. **Inicia sesión en Mercado Pago** con la cuenta de prueba del **comprador**:
   - Username: `TESTUSER4821...` (totti1)
   - Password: (la que tengas configurada)
6. Deberías poder usar tarjetas de prueba

### Test 2: Verificar Logs

Después de hacer clic en "Pagar", revisa los logs en Vercel para ver:
- Qué token se está usando
- Si se detectó correctamente como cuenta de prueba
- Si se está usando el token del marketplace

---

## ⚠️ Notas Importantes

### 1. Cuentas de Prueba vs Tokens

- **Cuenta de prueba**: Usuario creado en Mercado Pago Developers
- **Token de prueba**: Puede empezar con `TEST-` o `APP_USR-`
- **Token de producción**: Empieza con `APP_USR-` pero es de producción

### 2. OAuth y Tokens

Cuando un coach se conecta vía OAuth:
- Si usa cuenta **real** → Obtiene token de **producción**
- Si usa cuenta de **prueba** → Obtiene token de **prueba**

### 3. Solución Automática

El código ahora detecta automáticamente:
- Si el coach es cuenta de prueba (por User ID)
- Si el marketplace tiene token de prueba
- Usa el token apropiado para permitir cuentas de prueba

---

## 📚 Referencias

- [Documentación - Cuentas de Prueba](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/test/accounts)
- [Documentación - Credenciales](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/credentials)

---

## ✅ Checklist de Verificación

- [ ] Coach `ronaldinho` (User ID: `2995219181`) está conectado
- [ ] Marketplace tiene token de prueba configurado en Vercel
- [ ] Logs muestran que se está usando token del marketplace
- [ ] Cuenta de prueba del comprador (`totti1`) puede hacer pagos
- [ ] Tarjetas de prueba funcionan correctamente

---

**Última actualización**: Lógica mejorada desplegada

