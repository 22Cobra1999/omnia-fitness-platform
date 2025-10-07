-- =====================================================
-- CREAR TABLAS BASE NECESARIAS PARA EL ESQUEMA MODULAR
-- =====================================================
-- Este script crea las tablas base que necesita el esquema modular

-- =====================================================
-- 1. CREAR fitness_program_details SI NO EXISTE
-- =====================================================

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
    coach_id UUID REFERENCES user_profiles(id),
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
    client_id UUID REFERENCES user_profiles(id), -- Client ID for duplicated rows
    scheduled_date DATE, -- Scheduled date for client's program
    video_url TEXT -- URL for video content
);

-- =====================================================
-- 2. CREAR client_exercise_customizations SI NO EXISTE
-- =====================================================

CREATE TABLE IF NOT EXISTS client_exercise_customizations (
    id SERIAL PRIMARY KEY,
    fitness_exercise_id INTEGER, -- Referencia flexible
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Datos personalizables por cliente
    detalle_series TEXT,            -- Ej: "(3x12@50kg)", "(4x8-10@60kg);(3x12@55kg)" - series, reps y peso
    duracion_min INTEGER,           -- Duración en minutos
    one_rm DECIMAL(5,2),           -- 1RM del cliente
    calorias INTEGER,               -- Calorías quemadas
    tiempo_segundos INTEGER,        -- Tiempo real que tardó el cliente en completar
    
    -- Estado del ejercicio para este cliente
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    nota_cliente TEXT,              -- Notas del cliente sobre el ejercicio
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. VERIFICAR QUE ACTIVITIES Y ACTIVITY_ENROLLMENTS EXISTEN
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
        RAISE EXCEPTION 'Tabla activities no existe. Debes crear primero las tablas base del sistema.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_enrollments') THEN
        RAISE EXCEPTION 'Tabla activity_enrollments no existe. Debes crear primero las tablas base del sistema.';
    END IF;
    
    RAISE NOTICE 'Tablas base verificadas correctamente';
END $$;

-- =====================================================
-- 4. AGREGAR COLUMNAS FALTANTES A ACTIVITY_ENROLLMENTS
-- =====================================================

-- Agregar expiration_date si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_enrollments' 
        AND column_name = 'expiration_date'
    ) THEN
        ALTER TABLE activity_enrollments 
        ADD COLUMN expiration_date DATE;
        RAISE NOTICE 'Columna expiration_date agregada a activity_enrollments';
    END IF;
    
    -- Agregar start_date si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_enrollments' 
        AND column_name = 'start_date'
    ) THEN
        ALTER TABLE activity_enrollments 
        ADD COLUMN start_date DATE;
        RAISE NOTICE 'Columna start_date agregada a activity_enrollments';
    END IF;
    
    -- Agregar status si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_enrollments' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE activity_enrollments 
        ADD COLUMN status TEXT DEFAULT 'pendiente';
        RAISE NOTICE 'Columna status agregada a activity_enrollments';
    END IF;
END $$;

-- =====================================================
-- 5. CREAR ÍNDICES BÁSICOS
-- =====================================================

-- Índices para fitness_program_details
CREATE INDEX IF NOT EXISTS idx_fitness_program_details_activity_id 
    ON fitness_program_details(activity_id);

CREATE INDEX IF NOT EXISTS idx_fitness_program_details_client_id 
    ON fitness_program_details(client_id);

CREATE INDEX IF NOT EXISTS idx_fitness_program_details_semana_dia 
    ON fitness_program_details(semana, día);

-- Índices para client_exercise_customizations
CREATE INDEX IF NOT EXISTS idx_client_exercise_customizations_client_id 
    ON client_exercise_customizations(client_id);

CREATE INDEX IF NOT EXISTS idx_client_exercise_customizations_completed 
    ON client_exercise_customizations(completed);

-- =====================================================
-- 6. VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
    v_fitness_count INTEGER;
    v_customizations_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_fitness_count FROM fitness_program_details;
    SELECT COUNT(*) INTO v_customizations_count FROM client_exercise_customizations;
    
    RAISE NOTICE '=== TABLAS BASE CREADAS ===';
    RAISE NOTICE 'fitness_program_details: % registros', v_fitness_count;
    RAISE NOTICE 'client_exercise_customizations: % registros', v_customizations_count;
    RAISE NOTICE '========================';
END $$;

RAISE NOTICE 'Tablas base configuradas exitosamente. Ahora puedes ejecutar el esquema modular.';
