# Instrucciones para Reorganización del Sistema

## 🎯 Objetivo
Eliminar la tabla `organizacion_ejercicios` y consolidar toda la información en `ejercicios_detalles`.

## 📋 Pasos a Ejecutar en Supabase SQL Editor

### **PASO 1: Agregar Columnas a `ejercicios_detalles`**
```sql
-- Ejecutar en Supabase SQL Editor
ALTER TABLE ejercicios_detalles ADD COLUMN IF NOT EXISTS semana INTEGER;
ALTER TABLE ejercicios_detalles ADD COLUMN IF NOT EXISTS dia INTEGER;
ALTER TABLE ejercicios_detalles ADD COLUMN IF NOT EXISTS periodo INTEGER DEFAULT 1;
ALTER TABLE ejercicios_detalles ADD COLUMN IF NOT EXISTS bloque INTEGER DEFAULT 1;
ALTER TABLE ejercicios_detalles ADD COLUMN IF NOT EXISTS orden INTEGER;
```

### **PASO 2: Poblar Datos de Organización**
```sql
-- Poblar datos para actividad 59
UPDATE ejercicios_detalles 
SET 
    semana = CASE 
        WHEN id = 255 THEN 1  -- Press de Banca
        WHEN id = 256 THEN 2  -- Sentadillas
        WHEN id = 257 THEN 3  -- Remo con Barra
        WHEN id = 258 THEN 4  -- Press Militar
        WHEN id = 259 THEN 1  -- Press de Banca (duplicado)
        WHEN id = 260 THEN 2  -- Sentadillas (duplicado)
        WHEN id = 261 THEN 3  -- Remo con Barra (duplicado)
        WHEN id = 262 THEN 4  -- Press Militar (duplicado)
        WHEN id = 263 THEN 1  -- Test
        WHEN id = 264 THEN 1  -- Press de Banca (otro duplicado)
        WHEN id = 265 THEN 1  -- Press de Banca (otro duplicado)
        WHEN id = 266 THEN 2  -- Sentadillas (otro duplicado)
        WHEN id = 267 THEN 3  -- Remo con Barra (otro duplicado)
        WHEN id = 268 THEN 4  -- Press Militar (otro duplicado)
        WHEN id = 269 THEN 1  -- Press de Banca (otro duplicado)
        WHEN id = 270 THEN 2  -- Sentadillas (otro duplicado)
        WHEN id = 271 THEN 3  -- Remo con Barra (otro duplicado)
        WHEN id = 272 THEN 4  -- Press Militar (otro duplicado)
        ELSE 1
    END,
    dia = CASE 
        WHEN id IN (255, 259, 263, 264, 265, 269) THEN 1  -- Lunes
        WHEN id IN (256, 260, 266, 270) THEN 2  -- Martes
        WHEN id IN (257, 261, 267, 271) THEN 3  -- Miércoles
        WHEN id IN (258, 262, 268, 272) THEN 4  -- Jueves
        ELSE 1
    END,
    periodo = 1,
    bloque = 1,
    orden = CASE 
        WHEN id = 255 THEN 1
        WHEN id = 256 THEN 8
        WHEN id = 257 THEN 15
        WHEN id = 258 THEN 22
        WHEN id = 259 THEN 2
        WHEN id = 260 THEN 9
        WHEN id = 261 THEN 16
        WHEN id = 262 THEN 23
        WHEN id = 263 THEN 3
        WHEN id = 264 THEN 4
        WHEN id = 265 THEN 5
        WHEN id = 266 THEN 10
        WHEN id = 267 THEN 17
        WHEN id = 268 THEN 24
        WHEN id = 269 THEN 6
        WHEN id = 270 THEN 11
        WHEN id = 271 THEN 18
        WHEN id = 272 THEN 25
        ELSE 1
    END
WHERE activity_id = 59;
```

### **PASO 3: Verificar Datos**
```sql
-- Verificar que los datos se poblaron correctamente
SELECT 
    id,
    nombre_ejercicio,
    semana,
    dia,
    periodo,
    bloque,
    orden,
    intensidad,
    calorias
FROM ejercicios_detalles 
WHERE activity_id = 59
ORDER BY semana, dia, orden
LIMIT 10;
```

### **PASO 4: Agregar Constraints (Opcional)**
```sql
-- Agregar constraints para validación
ALTER TABLE ejercicios_detalles ADD CONSTRAINT IF NOT EXISTS valid_semana_ejercicios 
CHECK (semana IS NULL OR semana >= 1);

ALTER TABLE ejercicios_detalles ADD CONSTRAINT IF NOT EXISTS valid_dia_ejercicios 
CHECK (dia IS NULL OR (dia >= 1 AND dia <= 7));

ALTER TABLE ejercicios_detalles ADD CONSTRAINT IF NOT EXISTS valid_periodo_ejercicios 
CHECK (periodo IS NULL OR periodo >= 1);

ALTER TABLE ejercicios_detalles ADD CONSTRAINT IF NOT EXISTS valid_bloque_ejercicios 
CHECK (bloque IS NULL OR bloque >= 1);
```

### **PASO 5: Crear Índices (Opcional)**
```sql
-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_activity_semana ON ejercicios_detalles(activity_id, semana);
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_activity_dia ON ejercicios_detalles(activity_id, dia);
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_activity_periodo ON ejercicios_detalles(activity_id, periodo);
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_activity_orden ON ejercicios_detalles(activity_id, orden);
```

## 🔧 Cambios en el Código

### **1. Endpoint Actualizado**
El endpoint `/api/activity-exercises/[id]/route.ts` ya está actualizado para usar la nueva estructura.

### **2. Procesador CSV Actualizado**
El endpoint `/api/process-csv-simple/route.ts` ya está actualizado para insertar en la nueva estructura.

## 📊 Resultado Esperado

Después de ejecutar los pasos, deberías ver:

```json
{
  "id": 255,
  "nombre_ejercicio": "Press de Banca",
  "semana": 1,
  "dia": 1,
  "periodo": 1,
  "bloque": 1,
  "orden": 1,
  "intensidad": "Principiante",
  "calorias": 350
}
```

## 🚀 Próximos Pasos

1. **Ejecutar los scripts SQL** en Supabase SQL Editor
2. **Probar el endpoint** `/api/activity-exercises/59`
3. **Verificar que funciona** correctamente
4. **Eliminar tabla `organizacion_ejercicios`** (opcional, después de verificar)

## ⚠️ Importante

- **Ejecutar en orden**: Los pasos deben ejecutarse secuencialmente
- **Verificar datos**: Siempre verificar que los datos se poblaron correctamente
- **Backup**: Considerar hacer backup antes de eliminar `organizacion_ejercicios`
- **Testing**: Probar el endpoint después de cada paso

## 🎉 Beneficios

- ✅ **Sistema simplificado**: Una sola tabla para toda la información
- ✅ **Consultas más rápidas**: Sin JOINs innecesarios
- ✅ **Mejor escalabilidad**: Soporte para períodos y bloques
- ✅ **Código más limpio**: Menos complejidad en el frontend

































