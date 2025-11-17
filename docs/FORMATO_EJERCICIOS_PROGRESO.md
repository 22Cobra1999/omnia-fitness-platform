# Formato de Ejercicios en progreso_cliente

## 📊 Problema: Ejercicios Duplicados

Cuando un día tiene el mismo ejercicio múltiples veces (ej: Flexiones en bloque 1 y bloque 3), necesitamos identificar **cuál instancia específica** se completó.

### ❌ **Problema Original:**

```json
{
  "ejercicios_pendientes": [1042, 1043, 1042, 1043],
  "ejercicios_completados": []
}
```

**Si completamos el primer `1042`, ¿cómo sabemos que fue el del bloque 1 y no el del bloque 3?**

---

## ✅ **Solución: Mapeo Inmutable con `detalles_series`**

### 🏗️ **Estructura de Datos:**

```json
{
  "id": 91,
  "actividad_id": 78,
  "cliente_id": "00dedc23-0b17-4e50-b84e-b2e8100dc93c",
  "fecha": "2025-10-20",
  
  "ejercicios_pendientes": [1042, 1043, 1042, 1043],
  "ejercicios_completados": [],
  
  "detalles_series": {
    "ejercicio_0": { "ejercicio_id": 1042, "bloque": 1, "orden": 1 },
    "ejercicio_1": { "ejercicio_id": 1043, "bloque": 2, "orden": 2 },
    "ejercicio_2": { "ejercicio_id": 1042, "bloque": 3, "orden": 3 },
    "ejercicio_3": { "ejercicio_id": 1043, "bloque": 4, "orden": 4 }
  }
}
```

### 🔑 **Conceptos Clave:**

1. **`detalles_series`**: Mapeo INMUTABLE que nunca cambia. Define el orden original.
2. **Índices (`ejercicio_0`, `ejercicio_1`, ...)**: Representan la posición absoluta original.
3. **`ejercicios_pendientes` / `ejercicios_completados`**: Arrays de IDs para compatibilidad.

---

## 🔄 **Algoritmo de Toggle (Completar/Descompletar)**

### **Entrada:**
```javascript
{
  executionId: 1042,
  bloque: 3,
  orden: 3
}
```

### **Paso 1: Buscar en `detalles_series`**

```javascript
// Buscar el índice original usando bloque y orden
let targetIndex = -1
for (let i = 0; i < totalLength; i++) {
  const detalle = detalles_series[`ejercicio_${i}`]
  if (detalle && 
      detalle.ejercicio_id === 1042 && 
      detalle.bloque === 3 &&
      detalle.orden === 3) {
    targetIndex = i  // ← Encontrado: ejercicio_2
    break
  }
}
```

**Resultado:** `targetIndex = 2` (tercera posición, `ejercicio_2`)

---

### **Paso 2: Contar instancias previas del mismo ID**

```javascript
// Contar cuántos 1042 hay ANTES del índice 2
let countBefore = 0
for (let i = 0; i < 2; i++) {
  const d = detalles_series[`ejercicio_${i}`]
  if (d && d.ejercicio_id === 1042) {
    countBefore++  // ejercicio_0 tiene 1042 → countBefore = 1
  }
}
```

**Resultado:** `countBefore = 1` (hay un `1042` antes en `ejercicio_0`)

---

### **Paso 3: Encontrar en `pendientes` la N-ésima ocurrencia**

```javascript
// Buscar la segunda ocurrencia (índice 1) de 1042 en pendientes
let foundInPendientes = -1
let countInPendientes = 0

for (let i = 0; i < pendientes.length; i++) {
  if (pendientes[i] === 1042) {
    if (countInPendientes === countBefore) {  // countBefore = 1
      foundInPendientes = i  // ← Encontrado en posición 2
      break
    }
    countInPendientes++
  }
}
```

**Antes:**
```javascript
pendientes = [1042, 1043, 1042, 1043]
              ↑ 0    ↑ 1    ↑ 2    ↑ 3
            1era     2da
           ocurr.   ocurr. ← Esta es la que queremos
```

**Resultado:** `foundInPendientes = 2`

---

### **Paso 4: Mover entre arrays**

```javascript
// Mover pendientes[2] → completados
const ejercicioMovido = pendientes[2]  // 1042
pendientes.splice(2, 1)                 // Eliminar de pendientes
completados.push(ejercicioMovido)       // Agregar a completados
```

**Después:**
```javascript
pendientes = [1042, 1043, 1043]
completados = [1042]
detalles_series = {  // ← NO CAMBIA
  "ejercicio_0": { "ejercicio_id": 1042, "bloque": 1, "orden": 1 },
  "ejercicio_1": { "ejercicio_id": 1043, "bloque": 2, "orden": 2 },
  "ejercicio_2": { "ejercicio_id": 1042, "bloque": 3, "orden": 3 },  ← Este se completó
  "ejercicio_3": { "ejercicio_id": 1043, "bloque": 4, "orden": 4 }
}
```

---

## 🎯 **Ventajas de esta Solución:**

1. ✅ **No modifica la base de datos**: Usa columnas existentes (`integer[]`, `jsonb`)
2. ✅ **`detalles_series` nunca cambia**: Siempre sabemos el orden original
3. ✅ **Identificación precisa**: Usando `bloque` + `orden` + `ejercicio_id`
4. ✅ **Compatible con duplicados**: Puede haber N instancias del mismo ejercicio

---

## 📋 **Ejemplo Completo: Día con 4 Ejercicios**

### **Estado Inicial:**
```json
{
  "fecha": "2025-10-20",
  "ejercicios_pendientes": [1042, 1043, 1042, 1043],
  "ejercicios_completados": [],
  "detalles_series": {
    "ejercicio_0": { "ejercicio_id": 1042, "bloque": 1, "orden": 1 },
    "ejercicio_1": { "ejercicio_id": 1043, "bloque": 2, "orden": 2 },
    "ejercicio_2": { "ejercicio_id": 1042, "bloque": 3, "orden": 3 },
    "ejercicio_3": { "ejercicio_id": 1043, "bloque": 4, "orden": 4 }
  }
}
```

### **Acción 1: Completar Flexiones (bloque 1)**
```javascript
POST /api/toggle-exercise
{ executionId: 1042, bloque: 1, orden: 1 }
```

**Resultado:**
```json
{
  "ejercicios_pendientes": [1043, 1042, 1043],
  "ejercicios_completados": [1042]
}
```

### **Acción 2: Completar Flexiones (bloque 3)**
```javascript
POST /api/toggle-exercise
{ executionId: 1042, bloque: 3, orden: 3 }
```

**Resultado:**
```json
{
  "ejercicios_pendientes": [1043, 1043],
  "ejercicios_completados": [1042, 1042]
}
```

### **Acción 3: Descompletar Flexiones (bloque 1)**
```javascript
POST /api/toggle-exercise
{ executionId: 1042, bloque: 1, orden: 1 }
```

**Resultado:**
```json
{
  "ejercicios_pendientes": [1043, 1043, 1042],
  "ejercicios_completados": [1042]
}
```

---

## 🔧 **Implementación en Código**

### **Generar en `/api/activities/initialize-progress`:**

```typescript
const ejercicioIds: number[] = []
const detallesSeries: any = {}

organizacionData.forEach((org, index) => {
  ejercicioIds.push(org.ejercicio_id)
  detallesSeries[`ejercicio_${index}`] = {
    ejercicio_id: org.ejercicio_id,
    bloque: org.bloque,
    orden: org.orden
  }
})

await supabase.from('progreso_cliente').insert({
  ejercicios_pendientes: ejercicioIds,
  ejercicios_completados: [],
  detalles_series: detallesSeries
})
```

### **Toggle en `/api/toggle-exercise`:**

```typescript
// 1. Buscar índice original
const targetIndex = findInDetallesSeries(detallesSeries, ejercicioId, bloque, orden)

// 2. Contar ocurrencias previas
const countBefore = countPreviousOccurrences(detallesSeries, ejercicioId, targetIndex)

// 3. Encontrar en pendientes/completados
const foundInPendientes = findNthOccurrence(pendientes, ejercicioId, countBefore)
const foundInCompletados = findNthOccurrence(completados, ejercicioId, countBefore)

// 4. Mover entre arrays
if (foundInPendientes >= 0) {
  // Mover a completados
  pendientes.splice(foundInPendientes, 1)
  completados.push(ejercicioId)
} else if (foundInCompletados >= 0) {
  // Mover a pendientes
  completados.splice(foundInCompletados, 1)
  pendientes.push(ejercicioId)
}

// 5. Actualizar BD (detalles_series NO cambia)
await supabase.from('progreso_cliente').update({
  ejercicios_pendientes: pendientes,
  ejercicios_completados: completados
})
```

---

## 📊 **Resumen**

| Columna | Tipo | Mutable | Propósito |
|---------|------|---------|-----------|
| `ejercicios_pendientes` | `integer[]` | ✅ Sí | IDs de ejercicios no completados |
| `ejercicios_completados` | `integer[]` | ✅ Sí | IDs de ejercicios completados |
| `detalles_series` | `jsonb` | ❌ No | Mapeo inmutable del orden original con bloque/orden |

**Conclusión:** `detalles_series` es el "diccionario" que permite identificar exactamente cuál instancia de un ejercicio duplicado se completó, sin necesidad de cambiar el esquema de la base de datos.
