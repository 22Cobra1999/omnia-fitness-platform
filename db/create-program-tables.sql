-- This script creates or updates the program details tables with necessary columns and unique constraints.

-- Create fitness_program_details table if it doesn't exist
CREATE TABLE IF NOT EXISTS fitness_program_details (
    id SERIAL PRIMARY KEY,
    día INTEGER NOT NULL,
    semana INTEGER NOT NULL,
    nombre_actividad VARCHAR(255),
    descripción TEXT,
    duración INTEGER,
    tipo_ejercicio VARCHAR(255),
    repeticiones VARCHAR(255),
    intervalos_secs VARCHAR(255),
    descanso VARCHAR(255),
    peso VARCHAR(255),
    nivel_intensidad VARCHAR(255),
    equipo_necesario TEXT,
    rm VARCHAR(255),
    coach_id UUID REFERENCES profiles(id),
    activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    video TEXT,
    series VARCHAR(255),
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    calorias_consumidas INTEGER,
    intevalos_cant VARCHAR(255),
    nota_cliente TEXT,
    client_id UUID REFERENCES profiles(id), -- Client ID for duplicated rows
    scheduled_date DATE, -- Scheduled date for client's program
    video_url TEXT -- URL for video content
);

-- Add unique constraint for template rows (client_id IS NULL)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_fitness_program_template') THEN
        ALTER TABLE fitness_program_details
        ADD CONSTRAINT unique_fitness_program_template UNIQUE (activity_id, día, semana) WHERE client_id IS NULL;
    END IF;
END $$;

-- Add unique constraint for client-specific rows (client_id IS NOT NULL)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_fitness_program_client') THEN
        ALTER TABLE fitness_program_details
        ADD CONSTRAINT unique_fitness_program_client UNIQUE (activity_id, día, semana, client_id) WHERE client_id IS NOT NULL;
    END IF;
END $$;

-- Create nutrition_program_details table if it doesn't exist
CREATE TABLE IF NOT EXISTS nutrition_program_details (
    id SERIAL PRIMARY KEY,
    día INTEGER NOT NULL,
    semana INTEGER NOT NULL,
    comida VARCHAR(255),
    nombre VARCHAR(255),
    calorías NUMERIC,
    proteínas NUMERIC,
    carbohidratos NUMERIC,
    peso VARCHAR(255),
    receta TEXT,
    coach_id UUID REFERENCES profiles(id),
    activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    video TEXT,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    client_id UUID REFERENCES profiles(id), -- Client ID for duplicated rows
    scheduled_date DATE, -- Scheduled date for client's program
    video_url TEXT -- URL for video content
);

-- Add unique constraint for template rows (client_id IS NULL)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_nutrition_program_template') THEN
        ALTER TABLE nutrition_program_details
        ADD CONSTRAINT unique_nutrition_program_template UNIQUE (activity_id, día, semana) WHERE client_id IS NULL;
    END IF;
END $$;

-- Add unique constraint for client-specific rows (client_id IS NOT NULL)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_nutrition_program_client') THEN
        ALTER TABLE nutrition_program_details
        ADD CONSTRAINT unique_nutrition_program_client UNIQUE (activity_id, día, semana, client_id) WHERE client_id IS NOT NULL;
    END IF;
END $$;

-- Add or update the 'status' column in activity_enrollments if it doesn't exist or has a different type
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_enrollments' AND column_name = 'status') THEN
        ALTER TABLE activity_enrollments ADD COLUMN status TEXT DEFAULT 'pending';
    ELSE
        -- If it exists but you want to ensure the default
        ALTER TABLE activity_enrollments ALTER COLUMN status SET DEFAULT 'pending';
    END IF;
END $$;

-- Add or update the 'start_date' column in activity_enrollments if it doesn't exist or has a different type
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_enrollments' AND column_name = 'start_date') THEN
        ALTER TABLE activity_enrollments ADD COLUMN start_date DATE;
    END IF;
END $$;
