-- Insertar 2 períodos para la actividad 59 (Programa de Fuerza y Resistencia — 8 semanas)
-- Esto hará que la actividad dure 16 semanas en total (8 semanas × 2 períodos)

-- Período 1: Semanas 1-8
INSERT INTO periodos_asignados (
    activity_id,
    numero_periodo,
    fecha_inicio,
    fecha_fin,
    created_by
) VALUES (
    59, -- activity_id
    1,  -- numero_periodo
    '2025-01-01', -- fecha_inicio (ajustar según necesidad)
    '2025-02-26', -- fecha_fin (8 semanas después)
    '00dedc23-0b17-4e50-b84e-b2e8100dc93c' -- created_by (tu user ID)
);

-- Período 2: Semanas 9-16
INSERT INTO periodos_asignados (
    activity_id,
    numero_periodo,
    fecha_inicio,
    fecha_fin,
    created_by
) VALUES (
    59, -- activity_id
    2,  -- numero_periodo
    '2025-02-27', -- fecha_inicio (día siguiente al fin del período 1)
    '2025-04-23', -- fecha_fin (8 semanas después)
    '00dedc23-0b17-4e50-b84e-b2e8100dc93c' -- created_by (tu user ID)
);

-- Verificar que se insertaron correctamente
SELECT 
    id,
    activity_id,
    numero_periodo,
    fecha_inicio,
    fecha_fin,
    created_at
FROM periodos_asignados 
WHERE activity_id = 59 
ORDER BY numero_periodo;







































