-- =====================================================
-- VERIFICAR DATOS EN taller_detalles
-- =====================================================
-- Ejecuta estas consultas en Supabase para verificar que
-- los datos se guardaron correctamente
-- =====================================================

-- 1. Ver todos los temas del taller de yoga (actividad_id = 48)
SELECT 
    id,
    actividad_id,
    nombre,
    descripcion,
    originales,
    secundarios,
    created_at
FROM taller_detalles
WHERE actividad_id = 48
ORDER BY created_at;

-- 2. Ver los horarios originales de cada tema
SELECT 
    nombre,
    jsonb_array_elements(originales->'fechas_horarios') as horario_original
FROM taller_detalles
WHERE actividad_id = 48;

-- 3. Ver los horarios secundarios de cada tema
SELECT 
    nombre,
    jsonb_array_elements(secundarios->'fechas_horarios') as horario_secundario
FROM taller_detalles
WHERE actividad_id = 48
AND jsonb_array_length(secundarios->'fechas_horarios') > 0;

-- 4. Contar total de horarios por tema
SELECT 
    nombre,
    jsonb_array_length(originales->'fechas_horarios') as total_originales,
    jsonb_array_length(secundarios->'fechas_horarios') as total_secundarios,
    jsonb_array_length(originales->'fechas_horarios') + 
    jsonb_array_length(secundarios->'fechas_horarios') as total_horarios
FROM taller_detalles
WHERE actividad_id = 48;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Deberías ver 2 temas:
-- 
-- 1. Flexibilidad y Movilidad
--    - 2 horarios originales (14/10 y 21/10 a las 10:00-12:00)
--    - 1 horario secundario (15/10 a las 14:00-16:00)
--
-- 2. Meditación y Relajación
--    - 2 horarios originales (16/10 y 23/10 a las 18:00-20:00)
--    - 1 horario secundario (17/10 a las 19:00-21:00)
-- =====================================================


