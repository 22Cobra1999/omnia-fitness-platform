-- Inspect planning and nutrition details for activity 93
SELECT id, actividad_id, numero_semana, lunes, martes, miercoles, jueves, viernes, sabado, domingo
FROM public.planificacion_ejercicios
WHERE actividad_id = 93;

SELECT id, nombre, receta_id
FROM public.nutrition_program_details
WHERE activity_id = 93;
