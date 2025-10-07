-- Script para poblar las columnas de organización con datos de ejemplo
-- Ejecutar en Supabase SQL Editor

-- 1. Poblar datos para actividad 59
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

-- 2. Verificar que los datos se poblaron
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

































