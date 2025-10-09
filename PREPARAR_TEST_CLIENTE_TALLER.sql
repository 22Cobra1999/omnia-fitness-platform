-- =====================================================
-- PREPARACIÓN PARA TESTING DE VISTA CLIENTE - TALLER
-- =====================================================

-- 1. VERIFICAR DATOS DEL CLIENTE
-- =====================================================
SELECT 
    id,
    email,
    raw_user_meta_data->>'full_name' as nombre
FROM auth.users
WHERE id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c';

-- 2. VERIFICAR SI TIENE EL TALLER COMPRADO
-- =====================================================
SELECT 
    e.id,
    e.user_id,
    e.activity_id,
    a.title as taller_nombre,
    e.estado,
    e.created_at
FROM activity_enrollments e
JOIN activities a ON e.activity_id = a.id
WHERE e.user_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
  AND a.type = 'workshop';

-- 3. SI NO TIENE ENROLLMENT, CREAR UNO PARA YOGA AVANZADA
-- =====================================================
-- Solo ejecutar si no tiene enrollment
INSERT INTO activity_enrollments (
    user_id,
    activity_id,
    estado,
    fecha_inicio
) VALUES (
    '00dedc23-0b17-4e50-b84e-b2e8100dc93c',
    48, -- yoga avanzada
    'activa',
    NOW()
)
ON CONFLICT DO NOTHING;

-- 4. VERIFICAR TEMAS DEL TALLER
-- =====================================================
SELECT 
    id,
    actividad_id,
    nombre,
    descripcion,
    originales,
    secundarios
FROM taller_detalles
WHERE actividad_id = 48
ORDER BY id;

-- 5. VERIFICAR SI YA EXISTE EJECUCIÓN
-- =====================================================
SELECT 
    id,
    cliente_id,
    actividad_id,
    estado,
    progreso_porcentaje,
    temas_cubiertos,
    temas_pendientes
FROM ejecuciones_taller
WHERE cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
  AND actividad_id = 48;

-- 6. SI NO EXISTE EJECUCIÓN, CREAR UNA
-- =====================================================
-- El componente WorkshopClientView la creará automáticamente,
-- pero si quieres crearla manualmente:

-- Primero, obtener los temas como JSON
WITH temas AS (
    SELECT jsonb_agg(
        jsonb_build_object(
            'tema_id', id,
            'tema_nombre', nombre,
            'fecha_seleccionada', null,
            'horario_seleccionado', null,
            'confirmo_asistencia', false,
            'asistio', false
        )
    ) as temas_json
    FROM taller_detalles
    WHERE actividad_id = 48
)
INSERT INTO ejecuciones_taller (
    cliente_id,
    actividad_id,
    estado,
    temas_pendientes,
    fecha_inicio
)
SELECT 
    '00dedc23-0b17-4e50-b84e-b2e8100dc93c'::uuid,
    48,
    'en_progreso',
    COALESCE(temas_json, '[]'::jsonb),
    NOW()
FROM temas
ON CONFLICT DO NOTHING;

-- 7. VERIFICAR TODO JUNTO
-- =====================================================
SELECT 
    'Ejecución creada' as paso,
    e.id as ejecucion_id,
    e.estado,
    jsonb_array_length(e.temas_pendientes) as total_temas,
    e.progreso_porcentaje
FROM ejecuciones_taller e
WHERE e.cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
  AND e.actividad_id = 48;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- El cliente debe tener:
-- ✓ Enrollment activo en el taller de yoga (activity_id = 48)
-- ✓ Ejecución creada con todos los temas en "pendientes"
-- ✓ Progreso = 0%
-- ✓ Estado = 'en_progreso'

-- =====================================================
-- AHORA PUEDES PROBAR EL COMPONENTE!
-- =====================================================
-- En tu código React/Next.js, importa y usa:
-- 
-- import { WorkshopClientView } from '@/components/client/workshop-client-view'
-- 
-- <WorkshopClientView 
--   activityId={48}
--   activityTitle="Yoga Avanzada"
--   activityDescription="Técnicas avanzadas de yoga..."
-- />



