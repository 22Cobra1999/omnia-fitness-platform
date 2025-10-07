# Instrucciones para Corregir la Discrepancia de Consultas

## Problema Identificado
El frontend muestra consultas activas (cafe, meet30, meet60) pero el backend tiene todos los campos `*_enabled` en `false`. Esto se debe a que la API estaba retornando datos hardcodeados en lugar de consultar la base de datos real.

## Solución Implementada

### 1. Script SQL para Agregar Campos Faltantes
Ejecuta el siguiente script en el SQL Editor de Supabase:

```sql
-- Agregar campos de habilitación de consultas a la tabla coaches
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS cafe_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS meet_1_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS meet_30_enabled BOOLEAN DEFAULT FALSE;

-- Verificar que se agregaron correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'coaches' 
AND column_name IN ('cafe_enabled', 'meet_1_enabled', 'meet_30_enabled');

-- Actualizar el coach existente con los valores correctos
UPDATE coaches 
SET 
    cafe_enabled = FALSE,
    meet_1_enabled = FALSE,
    meet_30_enabled = FALSE
WHERE id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';

-- Verificar los datos actualizados
SELECT 
    id,
    full_name,
    cafe,
    meet_1,
    meet_30,
    cafe_enabled,
    meet_1_enabled,
    meet_30_enabled
FROM coaches 
WHERE id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';
```

### 2. Cambios en el Código
- ✅ **API GET actualizada**: Ahora consulta la base de datos real en lugar de retornar datos hardcodeados
- ✅ **API PUT implementada**: Permite actualizar las consultas del coach en la base de datos
- ✅ **Autenticación agregada**: Verifica que el usuario sea un coach autenticado
- ✅ **Mapeo correcto**: Convierte los datos de la BD al formato esperado por el frontend

### 3. Mapeo de Datos
- `cafe` → `cafe_enabled` (boolean) y `cafe` (precio)
- `meet30` → `meet_30_enabled` (boolean) y `meet_30` (precio)  
- `meet60` → `meet_1_enabled` (boolean) y `meet_1` (precio)

## Resultado Esperado
Después de ejecutar el script SQL, el frontend debería mostrar:
- **Cafe**: `active: false, price: 15`
- **Meet 30**: `active: false, price: 30`  
- **Meet 60**: `active: false, price: 60`

Esto coincidirá con los datos reales del backend donde todos los campos `*_enabled` están en `false`.

## Verificación
1. Ejecuta el script SQL en Supabase
2. Recarga la página del frontend
3. Verifica que los logs muestren los datos correctos de la base de datos
4. Confirma que las consultas aparezcan como inactivas (coincidiendo con el backend)
