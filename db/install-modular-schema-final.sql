-- =====================================================
-- INSTALACIÓN FINAL DEL ESQUEMA MODULAR OMNIA
-- =====================================================
-- Este script maneja todos los problemas de dependencias y tablas faltantes

-- IMPORTANTE: Hacer backup completo antes de ejecutar

-- =====================================================
-- PASO 1: VERIFICAR Y CREAR TABLAS DE USUARIOS
-- =====================================================
\echo 'Paso 1: Verificando tablas de usuarios...'

-- Verificar qué tablas de usuarios existen
DO $$
DECLARE
    v_user_profiles_exists BOOLEAN;
    v_profiles_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_profiles'
    ) INTO v_user_profiles_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles'
    ) INTO v_profiles_exists;
    
    RAISE NOTICE 'user_profiles existe: %, profiles existe: %', v_user_profiles_exists, v_profiles_exists;
    
    -- Si ninguna existe, crear user_profiles básica
    IF NOT v_user_profiles_exists AND NOT v_profiles_exists THEN
        RAISE NOTICE 'Creando tabla user_profiles básica...';
        
        CREATE TABLE user_profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT,
            name TEXT,
            role TEXT DEFAULT 'client',
            bio TEXT,
            avatar_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabla user_profiles creada';
    END IF;
    
    -- Si profiles existe pero user_profiles no, crear vista
    IF v_profiles_exists AND NOT v_user_profiles_exists THEN
        RAISE NOTICE 'Creando vista user_profiles...';
        CREATE VIEW user_profiles AS SELECT * FROM profiles;
        RAISE NOTICE 'Vista user_profiles creada';
    END IF;
END $$;

-- =====================================================
-- PASO 2: CREAR TABLAS BASE NECESARIAS
-- =====================================================
\echo 'Paso 2: Creando tablas base...'

-- Crear fitness_program_details si no existe
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
    client_id UUID REFERENCES user_profiles(id),
    scheduled_date DATE,
    video_url TEXT
);

-- Crear client_exercise_customizations si no existe
CREATE TABLE IF NOT EXISTS client_exercise_customizations (
    id SERIAL PRIMARY KEY,
    fitness_exercise_id INTEGER,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    detalle_series TEXT,
    duracion_min INTEGER,
    one_rm DECIMAL(5,2),
    calorias INTEGER,
    tiempo_segundos INTEGER,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    nota_cliente TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columnas faltantes a activity_enrollments
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_enrollments' AND column_name = 'expiration_date'
    ) THEN
        ALTER TABLE activity_enrollments ADD COLUMN expiration_date DATE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_enrollments' AND column_name = 'start_date'
    ) THEN
        ALTER TABLE activity_enrollments ADD COLUMN start_date DATE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_enrollments' AND column_name = 'status'
    ) THEN
        ALTER TABLE activity_enrollments ADD COLUMN status TEXT DEFAULT 'pendiente';
    END IF;
END $$;

-- =====================================================
-- PASO 3: CREAR ESQUEMA MODULAR
-- =====================================================
\echo 'Paso 3: Creando esquema modular...'

-- Crear ejercicios_detalles
CREATE TABLE IF NOT EXISTS ejercicios_detalles (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    nombre_ejercicio TEXT NOT NULL,
    tipo TEXT NOT NULL,
    descripcion TEXT,
    equipo TEXT,
    variantes JSONB,
    body_parts TEXT,
    replicar BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT valid_tipo CHECK (tipo IN ('fuerza', 'cardio', 'movilidad', 'flexibilidad', 'equilibrio', 'otro'))
);

-- Crear organizacion_ejercicios
CREATE TABLE IF NOT EXISTS organizacion_ejercicios (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    ejercicio_id INTEGER NOT NULL REFERENCES ejercicios_detalles(id) ON DELETE CASCADE,
    bloque TEXT NOT NULL,
    dia INTEGER NOT NULL,
    semana INTEGER NOT NULL,
    numero_periodo INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_bloque CHECK (bloque IN ('Mañana', 'Tarde', 'Noche')),
    CONSTRAINT valid_dia CHECK (dia >= 1 AND dia <= 31),
    CONSTRAINT valid_semana CHECK (semana >= 1 AND semana <= 52),
    CONSTRAINT valid_numero_periodo CHECK (numero_periodo >= 1),
    UNIQUE(activity_id, ejercicio_id, dia, semana, numero_periodo, bloque)
);

-- Crear periodos_asignados
CREATE TABLE IF NOT EXISTS periodos_asignados (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER NOT NULL REFERENCES activity_enrollments(id) ON DELETE CASCADE,
    numero_periodo INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_numero_periodo CHECK (numero_periodo >= 1),
    CONSTRAINT valid_fechas CHECK (fecha_fin >= fecha_inicio),
    UNIQUE(enrollment_id, numero_periodo)
);

-- Crear ejecuciones_ejercicio
CREATE TABLE IF NOT EXISTS ejecuciones_ejercicio (
    id SERIAL PRIMARY KEY,
    periodo_id INTEGER NOT NULL REFERENCES periodos_asignados(id) ON DELETE CASCADE,
    ejercicio_id INTEGER NOT NULL REFERENCES ejercicios_detalles(id) ON DELETE CASCADE,
    intensidad_aplicada TEXT NOT NULL,
    duracion INTEGER,
    calorias_estimadas INTEGER,
    fecha_ejecucion DATE NOT NULL,
    completado BOOLEAN DEFAULT FALSE,
    peso_usado DECIMAL(5,2),
    repeticiones_realizadas INTEGER,
    series_completadas INTEGER,
    tiempo_real_segundos INTEGER,
    nota_cliente TEXT,
    nota_coach TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Crear intensidades
CREATE TABLE IF NOT EXISTS intensidades (
    id SERIAL PRIMARY KEY,
    ejercicio_id INTEGER NOT NULL REFERENCES ejercicios_detalles(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    orden INTEGER NOT NULL,
    reps INTEGER,
    series INTEGER,
    peso DECIMAL(5,2),
    duracion_minutos INTEGER,
    descanso_segundos INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT valid_orden CHECK (orden >= 1),
    UNIQUE(ejercicio_id, nombre)
);

-- =====================================================
-- PASO 4: CREAR ÍNDICES BÁSICOS
-- =====================================================
\echo 'Paso 4: Creando índices...'

CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_activity_id ON ejercicios_detalles(activity_id);
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_tipo ON ejercicios_detalles(tipo);
CREATE INDEX IF NOT EXISTS idx_organizacion_ejercicios_activity_id ON organizacion_ejercicios(activity_id);
CREATE INDEX IF NOT EXISTS idx_organizacion_ejercicios_ejercicio_id ON organizacion_ejercicios(ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_periodos_asignados_enrollment_id ON periodos_asignados(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_periodo_id ON ejecuciones_ejercicio(periodo_id);
CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_ejercicio_id ON ejecuciones_ejercicio(ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_intensidades_ejercicio_id ON intensidades(ejercicio_id);

-- =====================================================
-- PASO 5: MIGRAR DATOS EXISTENTES
-- =====================================================
\echo 'Paso 5: Migrando datos existentes...'

-- Migrar ejercicios desde fitness_program_details
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM fitness_program_details WHERE client_id IS NULL;
    
    IF v_count > 0 THEN
        RAISE NOTICE 'Migrando % ejercicios...', v_count;
        
        INSERT INTO ejercicios_detalles (
            activity_id, nombre_ejercicio, tipo, descripcion, equipo, variantes, body_parts, replicar, created_at, updated_at
        )
        SELECT DISTINCT
            fpd.activity_id,
            COALESCE(fpd.nombre_actividad, 'Ejercicio sin nombre'),
            CASE WHEN fpd.tipo_ejercicio IS NOT NULL THEN LOWER(fpd.tipo_ejercicio) ELSE 'fuerza' END,
            fpd.descripción,
            fpd.equipo_necesario,
            CASE 
                WHEN fpd.repeticiones IS NOT NULL OR fpd.series IS NOT NULL OR fpd.peso IS NOT NULL THEN
                    jsonb_build_object('reps', fpd.repeticiones, 'series', fpd.series, 'peso', fpd.peso)
                ELSE NULL
            END,
            '',
            true,
            fpd.created_at,
            fpd.updated_at
        FROM fitness_program_details fpd
        WHERE fpd.client_id IS NULL
        AND NOT EXISTS (
            SELECT 1 FROM ejercicios_detalles ed 
            WHERE ed.activity_id = fpd.activity_id 
            AND ed.nombre_ejercicio = COALESCE(fpd.nombre_actividad, 'Ejercicio sin nombre')
        );
        
        RAISE NOTICE 'Ejercicios migrados exitosamente';
    ELSE
        RAISE NOTICE 'No hay ejercicios para migrar';
    END IF;
END $$;

-- =====================================================
-- PASO 6: VERIFICACIÓN FINAL
-- =====================================================
\echo 'Verificación final...'

DO $$
DECLARE
    v_ejercicios INTEGER;
    v_organizaciones INTEGER;
    v_periodos INTEGER;
    v_ejecuciones INTEGER;
    v_intensidades INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_ejercicios FROM ejercicios_detalles;
    SELECT COUNT(*) INTO v_organizaciones FROM organizacion_ejercicios;
    SELECT COUNT(*) INTO v_periodos FROM periodos_asignados;
    SELECT COUNT(*) INTO v_ejecuciones FROM ejecuciones_ejercicio;
    SELECT COUNT(*) INTO v_intensidades FROM intensidades;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'INSTALACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Ejercicios: %', v_ejercicios;
    RAISE NOTICE 'Organizaciones: %', v_organizaciones;
    RAISE NOTICE 'Períodos: %', v_periodos;
    RAISE NOTICE 'Ejecuciones: %', v_ejecuciones;
    RAISE NOTICE 'Intensidades: %', v_intensidades;
    RAISE NOTICE '=========================================';
END $$;

\echo 'Esquema modular instalado correctamente!'
