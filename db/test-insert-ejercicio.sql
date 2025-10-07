-- Script de prueba para insertar un ejercicio de prueba
-- Verificar que las columnas existen y funcionan

INSERT INTO ejercicios_detalles (
  activity_id,
  nombre_ejercicio,
  tipo,
  descripcion,
  equipo,
  body_parts,
  one_rm,
  calorias,
  detalle_series,
  video_url,
  created_by
) VALUES (
  59,
  'Ejercicio de Prueba',
  'Fuerza',
  'Descripción de prueba',
  'Barra',
  'Pecho',
  100,
  350,
  '[{"peso": 80, "repeticiones": 8, "series": 4}, {"peso": 85, "repeticiones": 6, "series": 3}]'::jsonb,
  '',
  'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
);

-- Verificar que se insertó correctamente
SELECT 
  id,
  nombre_ejercicio,
  calorias,
  detalle_series
FROM ejercicios_detalles 
WHERE nombre_ejercicio = 'Ejercicio de Prueba';

































