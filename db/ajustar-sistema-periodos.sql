-- Script para ajustar el sistema para tener un período por fila por actividad
-- Crear tabla de períodos de actividad

-- PASO 1: Crear tabla de períodos de actividad
CREATE TABLE IF NOT EXISTS periodos_actividad (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    periodo_numero INTEGER NOT NULL,
    nombre_periodo TEXT,
    descripcion TEXT,
    duracion_semanas INTEGER DEFAULT 1,
    activo BOOLEAN DEFAULT true,
    fecha_inicio DATE,
    fecha_fin DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraint para evitar duplicados
    UNIQUE(activity_id, periodo_numero)
);

-- PASO 2: Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_periodos_actividad_activity_id ON periodos_actividad(activity_id);
CREATE INDEX IF NOT EXISTS idx_periodos_actividad_periodo_numero ON periodos_actividad(activity_id, periodo_numero);
CREATE INDEX IF NOT EXISTS idx_periodos_actividad_activo ON periodos_actividad(activity_id, activo);

-- PASO 3: Poblar períodos para actividad 59
INSERT INTO periodos_actividad (
    activity_id,
    periodo_numero,
    nombre_periodo,
    descripcion,
    duracion_semanas,
    activo,
    created_by
) VALUES (
    59,
    1,
    'Período 1 - Fase Inicial',
    'Primera fase del programa de fuerza con ejercicios básicos',
    4,
    true,
    'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
) ON CONFLICT (activity_id, periodo_numero) DO NOTHING;

-- PASO 4: Verificar que se creó correctamente
SELECT 
    'PERÍODOS CREADOS' as seccion,
    id,
    activity_id,
    periodo_numero,
    nombre_periodo,
    descripcion,
    duracion_semanas,
    activo,
    created_at
FROM periodos_actividad
WHERE activity_id = 59;

-- PASO 5: Crear función para obtener ejercicios por período
CREATE OR REPLACE FUNCTION obtener_ejercicios_por_periodo(
    p_activity_id INTEGER,
    p_periodo_numero INTEGER DEFAULT 1
)
RETURNS TABLE (
    ejercicio_id INTEGER,
    nombre_ejercicio TEXT,
    semana INTEGER,
    dia INTEGER,
    bloque INTEGER,
    orden INTEGER,
    intensidad TEXT,
    calorias INTEGER,
    detalle_series JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ed.id,
        ed.nombre_ejercicio,
        ed.semana,
        ed.dia,
        ed.bloque,
        ed.orden,
        ed.intensidad,
        ed.calorias,
        i.detalle_series
    FROM ejercicios_detalles ed
    LEFT JOIN intensidades i ON ed.id = i.ejercicio_id
    WHERE ed.activity_id = p_activity_id
      AND ed.periodo = p_periodo_numero
    ORDER BY ed.semana, ed.dia, ed.orden;
END;
$$ LANGUAGE plpgsql;

-- PASO 6: Probar la función
SELECT 
    'PRUEBA DE FUNCIÓN' as seccion,
    *
FROM obtener_ejercicios_por_periodo(59, 1)
LIMIT 10;

-- PASO 7: Crear vista para facilitar consultas
CREATE OR REPLACE VIEW vista_ejercicios_completa AS
SELECT 
    ed.id as ejercicio_id,
    ed.activity_id,
    ed.nombre_ejercicio,
    ed.descripcion,
    ed.tipo,
    ed.equipo,
    ed.body_parts,
    ed.calorias,
    ed.intensidad,
    ed.video_url,
    ed.semana,
    ed.dia,
    ed.periodo,
    ed.bloque,
    ed.orden,
    pa.nombre_periodo,
    pa.descripcion as descripcion_periodo,
    pa.duracion_semanas,
    pa.activo as periodo_activo,
    i.id as intensidad_id,
    i.intensidad as intensidad_nombre,
    i.detalle_series,
    i.duracion_minutos,
    i.calorias as calorias_intensidad,
    ed.created_at,
    ed.updated_at
FROM ejercicios_detalles ed
LEFT JOIN periodos_actividad pa ON ed.activity_id = pa.activity_id AND ed.periodo = pa.periodo_numero
LEFT JOIN intensidades i ON ed.id = i.ejercicio_id;

-- PASO 8: Probar la vista
SELECT 
    'PRUEBA DE VISTA' as seccion,
    ejercicio_id,
    nombre_ejercicio,
    semana,
    dia,
    periodo,
    nombre_periodo,
    intensidad,
    calorias
FROM vista_ejercicios_completa
WHERE activity_id = 59
ORDER BY semana, dia, orden
LIMIT 10;








































