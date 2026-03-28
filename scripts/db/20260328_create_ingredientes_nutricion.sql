-- Query para crear tabla de ingredientes universales
CREATE TABLE IF NOT EXISTS ingredientes_nutricion (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    unidad TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nombre, unidad)
);

-- Índice para búsquedas rápidas por nombre
CREATE INDEX IF NOT EXISTS idx_ingredientes_nutricion_nombre ON ingredientes_nutricion(nombre);

-- Comentario explicativo
COMMENT ON TABLE ingredientes_nutricion IS 'Diccionario universal de ingredientes compartido entre coaches para normalizar porciones y unidades.';
