-- Modificar la columna día en fitness_program_details para que sea de tipo TEXT
ALTER TABLE fitness_program_details 
ALTER COLUMN día TYPE TEXT USING día::TEXT;

-- Modificar la columna semana en fitness_program_details para que sea de tipo TEXT
ALTER TABLE fitness_program_details 
ALTER COLUMN semana TYPE TEXT USING semana::TEXT;

-- Modificar la columna día en nutrition_program_details para que sea de tipo TEXT
ALTER TABLE nutrition_program_details 
ALTER COLUMN día TYPE TEXT USING día::TEXT;

-- Modificar la columna semana en nutrition_program_details para que sea de tipo TEXT
ALTER TABLE nutrition_program_details 
ALTER COLUMN semana TYPE TEXT USING semana::TEXT;
