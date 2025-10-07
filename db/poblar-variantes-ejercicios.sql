-- Script para poblar la columna variantes en ejercicios_detalles
-- Basado en el tipo de ejercicio y nombre

UPDATE ejercicios_detalles 
SET variantes = CASE 
  -- Ejercicios de fuerza con variantes específicas
  WHEN nombre_ejercicio ILIKE '%sentadilla%' THEN 'Sentadilla clásica;Sentadilla búlgara;Sentadilla goblet;Sentadilla sumo'
  WHEN nombre_ejercicio ILIKE '%press%' AND nombre_ejercicio ILIKE '%banca%' THEN 'Press banca plano;Press banca inclinado;Press banca declinado'
  WHEN nombre_ejercicio ILIKE '%press%' AND nombre_ejercicio ILIKE '%militar%' THEN 'Press militar;Press Arnold;Press con mancuernas'
  WHEN nombre_ejercicio ILIKE '%remo%' THEN 'Remo con barra;Remo con mancuernas;Remo T;Remo invertido'
  WHEN nombre_ejercicio ILIKE '%burpee%' THEN 'Burpee clásico;Burpee con salto;Burpee sin salto;Burpee con flexión'
  
  -- Ejercicios de fuerza genéricos
  WHEN tipo = 'fuerza' AND nombre_ejercicio ILIKE '%ejercicio fuerza%' THEN 
    CASE 
      WHEN nombre_ejercicio ILIKE '%1%' THEN 'Variación A;Variación B;Variación C'
      WHEN nombre_ejercicio ILIKE '%2%' THEN 'Variación A;Variación B;Variación C'
      WHEN nombre_ejercicio ILIKE '%3%' THEN 'Variación A;Variación B;Variación C'
      WHEN nombre_ejercicio ILIKE '%4%' THEN 'Variación A;Variación B;Variación C'
      WHEN nombre_ejercicio ILIKE '%5%' THEN 'Variación A;Variación B;Variación C'
      WHEN nombre_ejercicio ILIKE '%6%' THEN 'Variación A;Variación B;Variación C'
      WHEN nombre_ejercicio ILIKE '%7%' THEN 'Variación A;Variación B;Variación C'
      WHEN nombre_ejercicio ILIKE '%8%' THEN 'Variación A;Variación B;Variación C'
      WHEN nombre_ejercicio ILIKE '%9%' THEN 'Variación A;Variación B;Variación C'
      WHEN nombre_ejercicio ILIKE '%10%' THEN 'Variación A;Variación B;Variación C'
      WHEN nombre_ejercicio ILIKE '%11%' THEN 'Variación A;Variación B;Variación C'
      WHEN nombre_ejercicio ILIKE '%12%' THEN 'Variación A;Variación B;Variación C'
      WHEN nombre_ejercicio ILIKE '%13%' THEN 'Variación A;Variación B;Variación C'
      WHEN nombre_ejercicio ILIKE '%14%' THEN 'Variación A;Variación B;Variación C'
      WHEN nombre_ejercicio ILIKE '%15%' THEN 'Variación A;Variación B;Variación C'
      ELSE 'Variación básica;Variación intermedia;Variación avanzada'
    END
  
  -- Ejercicios de HIIT
  WHEN tipo = 'hiit' THEN 'Variación baja intensidad;Variación media intensidad;Variación alta intensidad'
  
  -- Ejercicios de cardio
  WHEN tipo = 'cardio' THEN 'Variación suave;Variación moderada;Variación intensa'
  
  -- Ejercicios de flexibilidad
  WHEN tipo = 'flexibilidad' THEN 'Variación básica;Variación intermedia;Variación avanzada'
  
  -- Por defecto
  ELSE 'Variación básica;Variación intermedia;Variación avanzada'
END
WHERE variantes IS NULL;

-- Verificar el resultado
SELECT 
  id,
  nombre_ejercicio,
  tipo,
  variantes
FROM ejercicios_detalles 
WHERE activity_id = 59
ORDER BY id;

































