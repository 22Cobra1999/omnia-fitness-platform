SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('progreso_diario_actividad', 'activity_enrollments', 'progreso_cliente_nutricion', 'taller_progreso_temas')
ORDER BY table_name, ordinal_position;
