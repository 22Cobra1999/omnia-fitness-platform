-- =====================================================
-- TABLA: ejecuciones_taller
-- Descripción: Registra la ejecución y asistencia de cada cliente a los talleres
-- =====================================================

-- Eliminar tabla si existe (para desarrollo)
DROP TABLE IF EXISTS ejecuciones_taller CASCADE;

-- Crear tabla ejecuciones_taller
CREATE TABLE ejecuciones_taller (
    id SERIAL PRIMARY KEY,
    
    -- Referencias
    cliente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actividad_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    
    -- Estado general
    estado VARCHAR(50) DEFAULT 'en_progreso', -- en_progreso, completado, cancelado
    progreso_porcentaje INTEGER DEFAULT 0, -- % de temas completados
    
    -- Temas cubiertos (completados)
    temas_cubiertos JSONB DEFAULT '[]'::jsonb,
    /* Estructura de temas_cubiertos:
    [
        {
            "tema_id": 2,
            "tema_nombre": "Flexibilidad y Movilidad",
            "fecha_seleccionada": "2025-10-15",
            "horario_seleccionado": {
                "hora_inicio": "10:00",
                "hora_fin": "12:00",
                "tipo": "original" // o "secundario"
            },
            "confirmo_asistencia": true,
            "asistio": true,
            "fecha_asistencia": "2025-10-15T10:05:00Z",
            "duracion_minutos": 115,
            "completado_en": "2025-10-15T12:00:00Z"
        }
    ]
    */
    
    -- Temas pendientes
    temas_pendientes JSONB DEFAULT '[]'::jsonb,
    /* Estructura de temas_pendientes:
    [
        {
            "tema_id": 3,
            "tema_nombre": "Meditación y Relajación",
            "fecha_seleccionada": null,
            "horario_seleccionado": null,
            "confirmo_asistencia": false,
            "asistio": false
        }
    ]
    */
    
    -- Metadata
    fecha_inscripcion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_inicio TIMESTAMP WITH TIME ZONE,
    fecha_finalizacion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX idx_ejecuciones_taller_cliente ON ejecuciones_taller(cliente_id);
CREATE INDEX idx_ejecuciones_taller_actividad ON ejecuciones_taller(actividad_id);
CREATE INDEX idx_ejecuciones_taller_estado ON ejecuciones_taller(estado);
CREATE INDEX idx_ejecuciones_taller_cliente_actividad ON ejecuciones_taller(cliente_id, actividad_id);

-- Índices GIN para búsquedas en JSONB
CREATE INDEX idx_ejecuciones_taller_temas_cubiertos ON ejecuciones_taller USING GIN(temas_cubiertos);
CREATE INDEX idx_ejecuciones_taller_temas_pendientes ON ejecuciones_taller USING GIN(temas_pendientes);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_ejecuciones_taller_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ejecuciones_taller_updated_at
    BEFORE UPDATE ON ejecuciones_taller
    FOR EACH ROW
    EXECUTE FUNCTION update_ejecuciones_taller_updated_at();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE ejecuciones_taller ENABLE ROW LEVEL SECURITY;

-- Policy: Los clientes pueden ver sus propias ejecuciones
CREATE POLICY "Clientes pueden ver sus propias ejecuciones"
    ON ejecuciones_taller
    FOR SELECT
    USING (auth.uid() = cliente_id);

-- Policy: Los coaches pueden ver ejecuciones de sus actividades
CREATE POLICY "Coaches pueden ver ejecuciones de sus actividades"
    ON ejecuciones_taller
    FOR SELECT
    USING (
        actividad_id IN (
            SELECT id FROM activities WHERE coach_id = auth.uid()
        )
    );

-- Policy: Sistema puede insertar ejecuciones cuando un cliente se inscribe
CREATE POLICY "Sistema puede insertar ejecuciones"
    ON ejecuciones_taller
    FOR INSERT
    WITH CHECK (
        auth.uid() = cliente_id
        OR
        actividad_id IN (
            SELECT id FROM activities WHERE coach_id = auth.uid()
        )
    );

-- Policy: Clientes pueden actualizar sus propias ejecuciones
CREATE POLICY "Clientes pueden actualizar sus propias ejecuciones"
    ON ejecuciones_taller
    FOR UPDATE
    USING (auth.uid() = cliente_id)
    WITH CHECK (auth.uid() = cliente_id);

-- Policy: Coaches pueden actualizar ejecuciones de sus actividades (para marcar asistencia)
CREATE POLICY "Coaches pueden actualizar ejecuciones de sus actividades"
    ON ejecuciones_taller
    FOR UPDATE
    USING (
        actividad_id IN (
            SELECT id FROM activities WHERE coach_id = auth.uid()
        )
    );

-- =====================================================
-- Función auxiliar: Calcular progreso
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_progreso_taller(ejecucion_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    total_temas INTEGER;
    temas_completados INTEGER;
    porcentaje INTEGER;
BEGIN
    -- Obtener datos de la ejecución
    SELECT 
        jsonb_array_length(temas_cubiertos),
        jsonb_array_length(temas_pendientes)
    INTO temas_completados, total_temas
    FROM ejecuciones_taller
    WHERE id = ejecucion_id;
    
    total_temas := total_temas + temas_completados;
    
    IF total_temas = 0 THEN
        RETURN 0;
    END IF;
    
    porcentaje := ROUND((temas_completados::NUMERIC / total_temas::NUMERIC) * 100);
    
    -- Actualizar el progreso en la tabla
    UPDATE ejecuciones_taller
    SET progreso_porcentaje = porcentaje
    WHERE id = ejecucion_id;
    
    RETURN porcentaje;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Función auxiliar: Inicializar ejecución al inscribirse
-- =====================================================

CREATE OR REPLACE FUNCTION inicializar_ejecucion_taller(
    p_cliente_id UUID,
    p_actividad_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_ejecucion_id INTEGER;
    v_temas JSONB;
BEGIN
    -- Obtener todos los temas de la actividad desde taller_detalles
    SELECT jsonb_agg(
        jsonb_build_object(
            'tema_id', id,
            'tema_nombre', nombre,
            'fecha_seleccionada', null,
            'horario_seleccionado', null,
            'confirmo_asistencia', false,
            'asistio', false
        )
    )
    INTO v_temas
    FROM taller_detalles
    WHERE actividad_id = p_actividad_id;
    
    -- Crear ejecución
    INSERT INTO ejecuciones_taller (
        cliente_id,
        actividad_id,
        temas_pendientes,
        fecha_inicio
    ) VALUES (
        p_cliente_id,
        p_actividad_id,
        COALESCE(v_temas, '[]'::jsonb),
        NOW()
    )
    RETURNING id INTO v_ejecucion_id;
    
    RETURN v_ejecucion_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comentarios en la tabla
-- =====================================================

COMMENT ON TABLE ejecuciones_taller IS 'Registra la ejecución y asistencia de cada cliente a los talleres';
COMMENT ON COLUMN ejecuciones_taller.temas_cubiertos IS 'Array JSON con los temas que el cliente ya completó';
COMMENT ON COLUMN ejecuciones_taller.temas_pendientes IS 'Array JSON con los temas que el cliente aún no ha completado';
COMMENT ON COLUMN ejecuciones_taller.progreso_porcentaje IS 'Porcentaje de temas completados (0-100)';

-- =====================================================
-- Datos de ejemplo (opcional, para testing)
-- =====================================================

-- Comentar esta sección en producción
/*
-- Ejemplo: Cliente inscrito en yoga avanzada (actividad 48)
INSERT INTO ejecuciones_taller (
    cliente_id,
    actividad_id,
    temas_pendientes
) VALUES (
    '00dedc23-0b17-4e50-b84e-b2e8100dc93c', -- ID del cliente de prueba
    48, -- yoga avanzada
    '[
        {
            "tema_id": 2,
            "tema_nombre": "Flexibilidad y Movilidad",
            "fecha_seleccionada": null,
            "horario_seleccionado": null,
            "confirmo_asistencia": false,
            "asistio": false
        },
        {
            "tema_id": 3,
            "tema_nombre": "Meditación y Relajación",
            "fecha_seleccionada": null,
            "horario_seleccionado": null,
            "confirmo_asistencia": false,
            "asistio": false
        }
    ]'::jsonb
);
*/



