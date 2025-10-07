-- Script para rediseñar la tabla intensidades
-- Eliminar tabla actual y crear nueva estructura

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

-- 8. Comentarios en la tabla
COMMENT ON TABLE intensidades IS 'Tabla para almacenar diferentes intensidades de ejercicios con sus series correspondientes';
COMMENT ON COLUMN intensidades.ejercicio_id IS 'ID del ejercicio en ejercicios_detalles';
COMMENT ON COLUMN intensidades.nombre_ejercicio IS 'Nombre del ejercicio para referencia rápida';
COMMENT ON COLUMN intensidades.intensidad IS 'Nivel de intensidad (Bajo, Medio, Alto, etc.)';
COMMENT ON COLUMN intensidades.detalle_series IS 'Series, repeticiones y peso en formato JSONB';
COMMENT ON COLUMN intensidades.duracion_minutos IS 'Duración del ejercicio en minutos';
COMMENT ON COLUMN intensidades.calorias IS 'Calorías quemadas estimadas para esta intensidad';
