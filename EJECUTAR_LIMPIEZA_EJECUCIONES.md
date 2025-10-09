# 🧹 Limpieza de Ejecuciones Duplicadas

## Problema Detectado

Se han creado múltiples filas en `ejecuciones_taller` para el mismo `cliente_id` + `actividad_id`:

```
- Fila 1: Vacía (created_at: 04:32:05)
- Fila 2: Con reserva en temas_pendientes (created_at: 04:32:05)
- Fila 21: Con reserva en temas_cubiertos (created_at: 05:11:47) ← MÁS RECIENTE
```

## Solución Implementada

### 1. ✅ Código Corregido
El código ahora usa `.limit(1)` para buscar ejecuciones existentes y prevenir duplicados futuros.

### 2. 🧹 Script de Limpieza

**Ejecutar en Supabase SQL Editor:**

```sql
-- ==========================================
-- LIMPIEZA DE EJECUCIONES DUPLICADAS
-- ==========================================

-- PASO 1: Ver los duplicados antes de eliminar
SELECT 
  id,
  cliente_id,
  actividad_id,
  estado,
  array_length(temas_cubiertos::json::text[]::json[], 1) as num_cubiertos,
  array_length(temas_pendientes::json::text[]::json[], 1) as num_pendientes,
  created_at,
  updated_at
FROM ejecuciones_taller
WHERE (cliente_id, actividad_id) IN (
  SELECT cliente_id, actividad_id
  FROM ejecuciones_taller
  GROUP BY cliente_id, actividad_id
  HAVING COUNT(*) > 1
)
ORDER BY cliente_id, actividad_id, created_at;

-- PASO 2: Eliminar duplicados (mantener solo el más reciente por created_at)
WITH duplicados AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY cliente_id, actividad_id 
      ORDER BY created_at DESC
    ) as rn
  FROM ejecuciones_taller
)
DELETE FROM ejecuciones_taller
WHERE id IN (
  SELECT id FROM duplicados WHERE rn > 1
);

-- PASO 3: Verificar que no queden duplicados
SELECT 
  cliente_id,
  actividad_id,
  COUNT(*) as total_registros
FROM ejecuciones_taller
GROUP BY cliente_id, actividad_id
HAVING COUNT(*) > 1;
-- Si este query no retorna filas, entonces la limpieza fue exitosa

-- PASO 4: Ver el estado final
SELECT 
  id,
  cliente_id,
  actividad_id,
  estado,
  jsonb_array_length(COALESCE(temas_cubiertos, '[]'::jsonb)) as cubiertos,
  jsonb_array_length(COALESCE(temas_pendientes, '[]'::jsonb)) as pendientes,
  created_at,
  updated_at
FROM ejecuciones_taller
ORDER BY created_at DESC;
```

## Para tu Caso Específico

Según los datos que compartiste, después de ejecutar el script:

**ANTES:**
```
- Fila 1: [] cubiertos, 2 pendientes (vacíos)
- Fila 2: [] cubiertos, 2 pendientes (uno con reserva)
- Fila 21: 1 cubierto (Flexibilidad), [] pendientes ← SE MANTIENE
```

**DESPUÉS:**
```
- Fila 21: 1 cubierto (Flexibilidad), [] pendientes ← ÚNICA FILA
```

## Verificación Post-Limpieza

```sql
-- Verificar la fila que quedó
SELECT 
  id,
  cliente_id,
  actividad_id,
  temas_cubiertos,
  temas_pendientes,
  created_at,
  updated_at
FROM ejecuciones_taller
WHERE cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
  AND actividad_id = 48;
```

## ⚠️ Importante

1. **Ejecutar en este orden**: PASO 1 → PASO 2 → PASO 3 → PASO 4
2. **PASO 1 es opcional** pero recomendado para ver qué se va a eliminar
3. **PASO 2** hace la limpieza real
4. **PASO 3** verifica que funcionó
5. **PASO 4** muestra el estado final

## 🔒 Prevención Futura

El código ahora:
- Busca con `.limit(1)` primero
- Solo crea si definitivamente no existe
- Muestra logs claros: "Creando nueva ejecución" vs "Ejecución existente encontrada"

**¡Ya no se crearán más duplicados!** 🎉

