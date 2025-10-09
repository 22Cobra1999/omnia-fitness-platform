-- =====================================================
-- SCRIPT DE MIGRACIÓN: workshop_topics → taller_detalles
-- =====================================================
-- Este script elimina la tabla workshop_topics y crea
-- la nueva tabla taller_detalles con estructura simplificada
-- =====================================================

-- 1. ELIMINAR TABLA ANTERIOR
-- =====================================================
DROP TABLE IF EXISTS workshop_topics CASCADE;

-- 2. CREAR NUEVA TABLA: taller_detalles
-- =====================================================
-- Esta tabla almacena los temas/detalles de cada taller
-- Cada registro representa un tema específico con sus horarios
CREATE TABLE taller_detalles (
    id SERIAL PRIMARY KEY,
    actividad_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL, -- Nombre del tema (ej: "Yoga para Principiantes")
    descripcion TEXT, -- Descripción del tema
    originales JSONB DEFAULT '{"fechas_horarios": []}'::jsonb, -- Horarios principales del tema
    secundarios JSONB DEFAULT '{"fechas_horarios": []}'::jsonb, -- Horarios secundarios del tema
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================
CREATE INDEX idx_taller_detalles_actividad_id ON taller_detalles(actividad_id);
CREATE INDEX idx_taller_detalles_nombre ON taller_detalles(nombre);
CREATE INDEX idx_taller_detalles_originales ON taller_detalles USING GIN(originales);
CREATE INDEX idx_taller_detalles_secundarios ON taller_detalles USING GIN(secundarios);

-- 4. CONFIGURAR ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE taller_detalles ENABLE ROW LEVEL SECURITY;

-- 5. CREAR POLÍTICAS RLS
-- =====================================================
-- Política para que los coaches solo vean sus propios talleres
CREATE POLICY "Coaches pueden ver sus propios talleres" ON taller_detalles
    FOR SELECT USING (
        actividad_id IN (
            SELECT id FROM activities 
            WHERE coach_id = auth.uid()
        )
    );

-- Política para que los coaches puedan insertar talleres en sus actividades
CREATE POLICY "Coaches pueden crear talleres" ON taller_detalles
    FOR INSERT WITH CHECK (
        actividad_id IN (
            SELECT id FROM activities 
            WHERE coach_id = auth.uid()
        )
    );

-- Política para que los coaches puedan actualizar sus talleres
CREATE POLICY "Coaches pueden actualizar sus talleres" ON taller_detalles
    FOR UPDATE USING (
        actividad_id IN (
            SELECT id FROM activities 
            WHERE coach_id = auth.uid()
        )
    );

-- Política para que los coaches puedan eliminar sus talleres
CREATE POLICY "Coaches pueden eliminar sus talleres" ON taller_detalles
    FOR DELETE USING (
        actividad_id IN (
            SELECT id FROM activities 
            WHERE coach_id = auth.uid()
        )
    );

-- 6. CREAR FUNCIÓN PARA ACTUALIZAR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_taller_detalles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. CREAR TRIGGER PARA ACTUALIZAR updated_at
-- =====================================================
CREATE TRIGGER trigger_update_taller_detalles_updated_at
    BEFORE UPDATE ON taller_detalles
    FOR EACH ROW
    EXECUTE FUNCTION update_taller_detalles_updated_at();

-- 8. EJEMPLOS DE USO (COMENTADOS)
-- =====================================================
/*
-- Insertar un tema de taller con horarios originales y secundarios
INSERT INTO taller_detalles (
    actividad_id, 
    nombre, 
    descripcion, 
    originales, 
    secundarios
) VALUES (
    48, -- ID de la actividad (taller de yoga)
    'Flexibilidad y Movilidad', -- Nombre del tema
    'Sesión enfocada en mejorar la flexibilidad y movilidad articular', -- Descripción del tema
    '{
        "fechas_horarios": [
            {
                "fecha": "2025-10-15",
                "hora_inicio": "10:00",
                "hora_fin": "12:00",
                "cupo": 20
            },
            {
                "fecha": "2025-10-22",
                "hora_inicio": "10:00",
                "hora_fin": "12:00",
                "cupo": 20
            }
        ]
    }'::jsonb,
    '{
        "fechas_horarios": [
            {
                "fecha": "2025-10-16",
                "hora_inicio": "14:00",
                "hora_fin": "16:00",
                "cupo": 15
            }
        ]
    }'::jsonb
);

-- Consultar talleres con sus horarios
SELECT 
    td.id,
    td.nombre,
    td.descripcion,
    td.originales->'fechas_horarios' as horarios_originales,
    td.secundarios->'fechas_horarios' as horarios_secundarios,
    a.title as actividad_nombre
FROM taller_detalles td
JOIN activities a ON td.actividad_id = a.id
WHERE a.coach_id = auth.uid();

-- Consultar solo horarios originales
SELECT 
    td.nombre,
    jsonb_array_elements(td.originales->'fechas_horarios') as horario_original
FROM taller_detalles td
WHERE td.actividad_id = 48;
*/

-- 9. VERIFICACIÓN FINAL
-- =====================================================
-- Verificar que la tabla se creó correctamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'taller_detalles'
ORDER BY ordinal_position;

-- Verificar que los índices se crearon
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'taller_detalles';

-- Verificar que las políticas RLS están activas
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'taller_detalles';

-- =====================================================
-- MIGRACIÓN COMPLETADA
-- =====================================================
-- ✅ Tabla workshop_topics eliminada
-- ✅ Tabla taller_detalles creada con nueva estructura
-- ✅ Índices optimizados creados
-- ✅ RLS configurado con políticas de seguridad
-- ✅ Triggers para updated_at configurados
-- ✅ Estructura JSON simple y clara implementada
-- =====================================================
