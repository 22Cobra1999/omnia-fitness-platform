-- QUERY CORRECTA PARA INSERTAR/ACTUALIZAR DATOS EN EL NUEVO ESQUEMA UNIFICADO
-- Esta query usa ON CONFLICT para asegurar que no haya errores si la fila ya existe, 
-- y fusiona los datos de Fitness y Nutrición en una sola fila.

INSERT INTO public.progreso_diario_actividad (
    cliente_id, 
    fecha, 
    actividad_id, 
    enrollment_id,
    tipo,
    fitness_items, 
    fitness_minutos, 
    nutricion_items, 
    nutricion_calorias, 
    nutricion_macros,
    recalculado_en
) VALUES 
-- Ejemplo Marzo 30
('00dedc23-0b17-4e50-b84e-b2e8100dc93c', '2026-03-30', 78, 216, 'programa', 
 '{"objetivo": 4, "completados": 4}'::jsonb, 
 '{"objetivo": 46, "completados": 46}'::jsonb, 
 '{"objetivo": 7, "completados": 7}'::jsonb, 
 '{"objetivo": 3050, "completados": 3050}'::jsonb, 
 '{"c": {"c": 352, "o": 352}, "f": {"c": 94, "o": 94}, "p": {"c": 197, "o": 197}}'::jsonb,
 NOW()
),
-- Ejemplo Marzo 31
('00dedc23-0b17-4e50-b84e-b2e8100dc93c', '2026-03-31', 78, 216, 'programa', 
 '{"objetivo": 4, "completados": 0}'::jsonb, 
 '{"objetivo": 46, "completados": 0}'::jsonb, 
 '{"objetivo": 5, "completados": 5}'::jsonb, 
 '{"objetivo": 2150, "completados": 2150}'::jsonb, 
 '{"c": {"c": 252, "o": 252}, "f": {"c": 70, "o": 70}, "p": {"c": 124, "o": 124}}'::jsonb,
 NOW()
)
-- ... agregar más fechas aquí ...
ON CONFLICT (cliente_id, fecha) 
DO UPDATE SET 
    fitness_items = EXCLUDED.fitness_items,
    fitness_minutos = EXCLUDED.fitness_minutos,
    nutricion_items = EXCLUDED.nutricion_items,
    nutricion_calorias = EXCLUDED.nutricion_calorias,
    nutricion_macros = EXCLUDED.nutricion_macros,
    actividad_id = EXCLUDED.actividad_id,
    enrollment_id = EXCLUDED.enrollment_id,
    recalculado_en = NOW();
