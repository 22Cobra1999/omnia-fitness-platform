-- ==========================================
-- CREACIÓN DE EJERCICIO (FITNESS)
-- ==========================================
INSERT INTO public.ejercicios_detalles 
(nombre_ejercicio, tipo, coach_id, activity_id) 
VALUES 
('Nombre', 'fuerza', 'COACH_ID', '{"ACTIVITY_ID": {"activo": true}}');

-- ==========================================
-- CREACIÓN DE PLATO (NUTRICIÓN)
-- ==========================================
-- 1. Insertar Receta
INSERT INTO public.recetas (receta) VALUES ('Instrucciones...');
-- 2. Insertar Plato (con receta_id del paso anterior)
INSERT INTO public.nutrition_program_details 
(nombre, tipo, coach_id, activity_id, receta_id, activity_id_new) 
VALUES 
('Plato', 'almuerzo', 'COACH_ID', 123, RECETA_ID, '{"123": {"activo": true}}');
