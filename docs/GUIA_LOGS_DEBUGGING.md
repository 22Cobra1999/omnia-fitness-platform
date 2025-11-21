# 🔍 Guía: Usar Logs para Debugging del Botón Deshabilitado

## ✅ Deploy Completado

**URL de Producción**: https://omnia-app.vercel.app

**Cambios implementados**:
- ✅ Logs detallados en cada paso del proceso
- ✅ Endpoint de debugging: `/api/mercadopago/debug-preference`
- ✅ Información completa de la preferencia en los logs

---

## 📋 Cómo Revisar los Logs

### Opción 1: Vercel Dashboard (Recomendado)

1. **Ve a Vercel Dashboard**:
   - https://vercel.com/dashboard
   - Selecciona tu proyecto `omnia-app`

2. **Ve a Deployments**:
   - Haz clic en el último deployment
   - Haz clic en **"View Function Logs"** o **"Logs"**

3. **Busca estos logs** (en orden cronológico):

```
📋 ========== CREANDO PREFERENCIA ==========
📋 Activity ID: ...
📋 Total Amount: ...
📋 Payer Info: ...
🔍 ========== PREFERENCIA COMPLETA (JSON) ==========
🚀 ========== ENVIANDO PREFERENCIA A MERCADO PAGO ==========
✅ ========== PREFERENCIA CREADA EXITOSAMENTE ==========
🔗 ========== PROCESANDO INIT POINT ==========
✅ ========== RESPUESTA FINAL AL CLIENTE ==========
```

### Opción 2: Terminal (Vercel CLI)

```bash
# Ver logs en tiempo real
vercel logs <deployment-url> --follow

# Ver últimos logs
vercel logs <deployment-url>
```

---

## 🔍 Qué Buscar en los Logs

### 1. **Verificar que la Preferencia se Crea Correctamente**

Busca: `✅ ========== PREFERENCIA CREADA EXITOSAMENTE ==========`

**Verifica**:
- ✅ `Preference ID` está presente
- ✅ `Init Point` o `Sandbox Init Point` está presente
- ✅ `Status` es válido

### 2. **Verificar Datos del Payer**

Busca: `📋 Payer Info:`

**Verifica**:
```json
{
  "email": "usuario@ejemplo.com",
  "name": "Nombre",
  "surname": "Apellido",
  "hasPhone": true/false,
  "hasIdentification": true,
  "identification": {
    "type": "DNI",
    "number": "12345678"
  }
}
```

**Importante**: `hasIdentification` debe ser `true`

### 3. **Verificar Items**

Busca: `📋 Items:`

**Verifica**:
```json
[{
  "id": "123",
  "title": "Actividad",
  "quantity": 1,
  "unit_price": 10000,
  "currency_id": "ARS"
}]
```

**Importante**: `unit_price` debe ser > 0

### 4. **Verificar Init Point**

Busca: `🔗 ========== PROCESANDO INIT POINT ==========`

**Verifica**:
- ✅ `Init Point Original` está presente
- ✅ `Init Point Final (con locale)` incluye `locale=es-AR`

---

## 🐛 Endpoint de Debugging

He creado un endpoint especial para debugging:

**POST** `/api/mercadopago/debug-preference`

**Body**:
```json
{
  "activityId": 123
}
```

**Respuesta**:
```json
{
  "success": true,
  "debug": {
    "activity": {...},
    "payer": {...},
    "commission": {...},
    "preference": {...},
    "coach": {...}
  }
}
```

**Uso**:
- Llamar este endpoint para ver exactamente qué se está enviando
- Comparar con los logs del servidor
- Verificar que todos los campos estén presentes

---

## 🚨 Problemas Comunes Detectados en Logs

### Problema 1: `hasIdentification: false`
**Solución**: Ya implementado - ahora siempre incluye identificación

### Problema 2: `unit_price: 0` o `NaN`
**Solución**: Verificar que `activity.price` sea válido

### Problema 3: `Init Point` ausente
**Solución**: Verificar credenciales y que la preferencia se cree correctamente

### Problema 4: Error al crear preferencia
**Solución**: Revisar logs de error para ver qué falló

---

## 📝 Pasos para Diagnosticar

1. **Hacer una nueva compra** (para generar nuevos logs)

2. **Revisar logs en Vercel**:
   - Buscar todos los logs que empiezan con emojis (📋, ✅, 🔍, etc.)
   - Copiar los logs completos

3. **Verificar cada sección**:
   - ✅ Preferencia se crea correctamente
   - ✅ Payer tiene identificación
   - ✅ Items tienen precio válido
   - ✅ Init Point está presente

4. **Si algo falta**:
   - Compartir los logs conmigo
   - O usar el endpoint de debugging

---

## 🔗 Enlaces Útiles

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Logs del Proyecto**: https://vercel.com/franco-pomati-cutoffs-projects/omnia-app
- **Endpoint de Debugging**: `POST /api/mercadopago/debug-preference`

---

## 💡 Próximos Pasos

1. **Hacer una nueva compra** para generar logs
2. **Revisar logs en Vercel** Dashboard
3. **Compartir los logs** si el problema persiste
4. **Probar el CVV manual** (borrar y reescribir "123")

