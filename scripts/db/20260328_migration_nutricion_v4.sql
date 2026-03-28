-- ==========================================
-- MIGRACIÓN NUTRICIÓN v4.0: NORMALIZACIÓN TOTAL
-- ==========================================

-- 1. Crear tabla independiente para Nutrición
CREATE TABLE IF NOT EXISTS ingredientes_nutricion (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    unidad TEXT NOT NULL DEFAULT 'u',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nombre, unidad)
);

-- 2. Migrar conceptos desde omnia_dictionary
-- Asumimos que categoria = 'nutricion' contiene nombres de ingredientes
INSERT INTO ingredientes_nutricion (nombre, unidad)
SELECT concepto, 'u'
FROM omnia_dictionary
WHERE categoria = 'nutricion'
ON CONFLICT DO NOTHING;

-- 3. Limpiar la tabla legacy de fitness para evitar colisiones
DELETE FROM omnia_dictionary 
WHERE categoria = 'nutricion';

-- 4. Índices de optimización
CREATE INDEX IF NOT EXISTS idx_ingredientes_nutricion_nombre ON ingredientes_nutricion(nombre);

-- 5. Comentario explicativo
COMMENT ON TABLE ingredientes_nutricion IS 'Diccionario universal de ingredientes (v4.0). Separado de fitness para escalabilidad y limpieza de JSON.';

-- ==========================================
-- QUERY SUGERIDA PARA REVISAR INSERCIÓN
-- ==========================================
-- SELECT * FROM ingredientes_nutricion ORDER BY created_at DESC LIMIT 20;
