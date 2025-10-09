-- Script para ejecutar la configuración completa de intensidades
-- Ejecutar en Supabase SQL Editor

-- PASO 1: Crear la nueva tabla intensidades
-- 1. Eliminar la tabla intensidades actual
DROP TABLE IF EXISTS intensidades CASCADE;

-- 2. Crear nueva tabla intensidades con estructura simplificada
CREATE TABLE intensidades (
    id SERIAL PRIMARY KEY,
    ejercicio_id INTEGER NOT NULL REFERENCES ejercicios_detalles(id) ON DELETE CASCADE,
    nombre_ejercicio TEXT NOT NULL, -- Nombre del ejercicio para referencia
    intensidad TEXT NOT NULL, -- Bajo, Medio, Alto, etc.
    detalle_series JSONB NOT NULL, -- Mismo formato que en ejercicios_detalles
    duracion_minutos INTEGER DEFAULT 30,
    calorias INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear índices para optimizar consultas
CREATE INDEX idx_intensidades_ejercicio_id ON intensidades(ejercicio_id);
CREATE INDEX idx_intensidades_intensidad ON intensidades(intensidad);
CREATE INDEX idx_intensidades_ejercicio_intensidad ON intensidades(ejercicio_id, intensidad);

-- 4. Agregar constraint para intensidad válida
ALTER TABLE intensidades ADD CONSTRAINT valid_intensidad 
CHECK (intensidad IN ('Bajo', 'Medio', 'Alto', 'Principiante', 'Intermedio', 'Avanzado'));

-- 5. Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_intensidades_updated_at 
    BEFORE UPDATE ON intensidades 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Habilitar RLS
ALTER TABLE intensidades ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas RLS
CREATE POLICY "Users can view intensidades" ON intensidades
    FOR SELECT USING (true);

CREATE POLICY "Users can insert intensidades" ON intensidades
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update intensidades" ON intensidades
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete intensidades" ON intensidades
    FOR DELETE USING (auth.uid() = created_by);

-- PASO 2: Poblar la tabla con datos
-- 1. Insertar intensidad Principiante para ejercicios existentes
INSERT INTO intensidades (
    ejercicio_id,
    nombre_ejercicio,
    intensidad,
    detalle_series,
    duracion_minutos,
    calorias,
    created_by
)
SELECT 
    ed.id as ejercicio_id,
    ed.nombre_ejercicio,
    'Principiante' as intensidad,
    ed.detalle_series, -- Usar las series originales
    30 as duracion_minutos, -- Duración por defecto
    COALESCE(ed.calorias, 0) as calorias, -- Usar las calorías del ejercicio o 0 si es NULL
    ed.created_by
FROM ejercicios_detalles ed
WHERE ed.activity_id = 59
  AND ed.detalle_series IS NOT NULL
  AND jsonb_array_length(ed.detalle_series) > 0;

-- 2. Insertar intensidad Intermedio para ejercicios existentes
INSERT INTO intensidades (
    ejercicio_id,
    nombre_ejercicio,
    intensidad,
    detalle_series,
    duracion_minutos,
    calorias,
    created_by
)
SELECT 
    ed.id as ejercicio_id,
    ed.nombre_ejercicio,
    'Intermedio' as intensidad,
    -- Aumentar peso en 15% para intensidad intermedia
    jsonb_agg(
        jsonb_build_object(
            'peso', ROUND((serie->>'peso')::numeric * 1.15, 2),
            'repeticiones', (serie->>'repeticiones')::integer,
            'series', (serie->>'series')::integer
        )
    ) as detalle_series,
    30 as duracion_minutos,
    ROUND(COALESCE(ed.calorias, 0) * 1.1) as calorias, -- Aumentar calorías en 10%
    ed.created_by
FROM ejercicios_detalles ed,
     jsonb_array_elements(ed.detalle_series) as serie
WHERE ed.activity_id = 59
  AND ed.detalle_series IS NOT NULL
  AND jsonb_array_length(ed.detalle_series) > 0
GROUP BY ed.id, ed.nombre_ejercicio, ed.calorias, ed.created_by;

-- 3. Insertar intensidad Avanzado para ejercicios existentes
INSERT INTO intensidades (
    ejercicio_id,
    nombre_ejercicio,
    intensidad,
    detalle_series,
    duracion_minutos,
    calorias,
    created_by
)
SELECT 
    ed.id as ejercicio_id,
    ed.nombre_ejercicio,
    'Avanzado' as intensidad,
    -- Aumentar peso en 30% para intensidad avanzada
    jsonb_agg(
        jsonb_build_object(
            'peso', ROUND((serie->>'peso')::numeric * 1.30, 2),
            'repeticiones', (serie->>'repeticiones')::integer,
            'series', (serie->>'series')::integer
        )
    ) as detalle_series,
    30 as duracion_minutos,
    ROUND(COALESCE(ed.calorias, 0) * 1.2) as calorias, -- Aumentar calorías en 20%
    ed.created_by
FROM ejercicios_detalles ed,
     jsonb_array_elements(ed.detalle_series) as serie
WHERE ed.activity_id = 59
  AND ed.detalle_series IS NOT NULL
  AND jsonb_array_length(ed.detalle_series) > 0
GROUP BY ed.id, ed.nombre_ejercicio, ed.calorias, ed.created_by;

-- PASO 3: Verificar resultado
SELECT 
    'RESULTADO FINAL' as seccion,
    COUNT(*) as total_intensidades,
    COUNT(DISTINCT ejercicio_id) as ejercicios_unicos,
    COUNT(DISTINCT intensidad) as intensidades_unicas
FROM intensidades;

-- Mostrar distribución por intensidad
SELECT 
    intensidad,
    COUNT(*) as cantidad,
    ROUND(AVG(calorias), 2) as calorias_promedio,
    MIN(calorias) as calorias_min,
    MAX(calorias) as calorias_max
FROM intensidades
GROUP BY intensidad
ORDER BY intensidad;

-- Mostrar ejemplo de datos
SELECT 
    ejercicio_id,
    nombre_ejercicio,
    intensidad,
    detalle_series,
    duracion_minutos,
    calorias
FROM intensidades
WHERE ejercicio_id IN (255, 256, 257) -- Primeros 3 ejercicios
ORDER BY ejercicio_id, intensidad
LIMIT 10;







































