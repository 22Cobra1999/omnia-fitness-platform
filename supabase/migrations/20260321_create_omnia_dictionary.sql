-- Crear tabla de diccionario de conceptos
CREATE TABLE IF NOT EXISTS omnia_dictionary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concepto TEXT NOT NULL,
    categoria TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(concepto, categoria)
);

-- Habilitar RLS
ALTER TABLE omnia_dictionary ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS (lectura para todos los autenticados, inserción para coaches)
CREATE POLICY "Lectura pública de diccionario" 
ON omnia_dictionary FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Coaches pueden insertar nuevos conceptos" 
ON omnia_dictionary FOR INSERT 
TO authenticated 
WITH CHECK (true); -- Podría refinarse para solo coaches, pero por ahora permitimos a todos los auth

-- Poblar con datos iniciales (Diversidad de opciones)

-- FITNESS: PARTES DEL CUERPO
INSERT INTO omnia_dictionary (concepto, categoria) VALUES 
('Pecho', 'parte_cuerpo'),
('Espalda', 'parte_cuerpo'),
('Hombros', 'parte_cuerpo'),
('Bíceps', 'parte_cuerpo'),
('Tríceps', 'parte_cuerpo'),
('Antebrazos', 'parte_cuerpo'),
('Core', 'parte_cuerpo'),
('Abdominales', 'parte_cuerpo'),
('Glúteos', 'parte_cuerpo'),
('Cuádriceps', 'parte_cuerpo'),
('Isquiotibiales', 'parte_cuerpo'),
('Pantorrillas', 'parte_cuerpo'),
('Caderas', 'parte_cuerpo'),
('Trapecio', 'parte_cuerpo'),
('Lumbar', 'parte_cuerpo'),
('Oblicuos', 'parte_cuerpo'),
('Cuerpo Completo', 'parte_cuerpo'),
('Tren Superior', 'parte_cuerpo'),
('Tren Inferior', 'parte_cuerpo')
ON CONFLICT DO NOTHING;

-- FITNESS: EQUIPO NECESARIO
INSERT INTO omnia_dictionary (concepto, categoria) VALUES 
('Mancuernas', 'equipo_fitness'),
('Barra Olímpica', 'equipo_fitness'),
('Banco Plano', 'equipo_fitness'),
('Rack de Potencia', 'equipo_fitness'),
('Bandas de Resistencia', 'equipo_fitness'),
('Kettlebell', 'equipo_fitness'),
('Máquina de Poleas', 'equipo_fitness'),
('Mat de Yoga', 'equipo_fitness'),
('Chaleco Lastrado', 'equipo_fitness'),
('Escalera de Agilidad', 'equipo_fitness'),
('Pelota Suiza (Fitball)', 'equipo_fitness'),
('Pelota Medicinal', 'equipo_fitness'),
('Step', 'equipo_fitness'),
('TRX / Suspensión', 'equipo_fitness'),
('Smith Machine', 'equipo_fitness'),
('Prensa de Piernas', 'equipo_fitness'),
('Bicicleta Fija', 'equipo_fitness'),
('Cinta de Correr', 'equipo_fitness'),
('Máquina de Remo', 'equipo_fitness'),
('Cajón de Salto (Plyo Box)', 'equipo_fitness'),
('Soga de Saltar', 'equipo_fitness'),
('Discos de Pesas', 'equipo_fitness'),
('Barra de Dominadas', 'equipo_fitness'),
('Paralelas', 'equipo_fitness'),
('Anillas de Gimnasia', 'equipo_fitness'),
('Foam Roller', 'equipo_fitness'),
('Bosu', 'equipo_fitness'),
('Battling Ropes', 'equipo_fitness')
ON CONFLICT DO NOTHING;

-- NUTRICIÓN: CATEGORÍAS Y CONCEPTOS
INSERT INTO omnia_dictionary (concepto, categoria) VALUES 
('Proteína Animal', 'nutricion'),
('Proteína Vegetal', 'nutricion'),
('Carbohidrato Complejo', 'nutricion'),
('Carbohidrato Simple', 'nutricion'),
('Grasas Saludables', 'nutricion'),
('Vegetales Verdes', 'nutricion'),
('Frutos Rojos', 'nutricion'),
('Cereales Integrales', 'nutricion'),
('Legumbres', 'nutricion'),
('Lácteos Descremados', 'nutricion'),
('Frutos Secos', 'nutricion'),
('Semillas', 'nutricion'),
('Tubérculos', 'nutricion'),
('Pescados Azules', 'nutricion'),
('Aves', 'nutricion'),
('Carnes Rojas Magras', 'nutricion'),
('Suplemementos', 'nutricion')
ON CONFLICT DO NOTHING;
