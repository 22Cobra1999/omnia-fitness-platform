-- Verificar si la tabla recent_activities existe y crearla si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'recent_activities') THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        CREATE TABLE "public"."recent_activities" (
            "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
            "user_id" UUID NOT NULL,
            "name" TEXT NOT NULL,
            "category" TEXT NOT NULL,
            "value" NUMERIC NOT NULL,
            "unit" TEXT NOT NULL,
            "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "color" TEXT,
            "km" NUMERIC,
            "mins" INTEGER,
            "kg" NUMERIC,
            "reps" INTEGER,
            "sets" INTEGER,
            "kcal" INTEGER,
            "distance" NUMERIC,
            "duration" INTEGER,
            "weight" NUMERIC,
            PRIMARY KEY ("id"),
            FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
        );
    END IF;
END
$$;

-- Verificar que la tabla tenga todas las columnas necesarias
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Verificar y añadir columna km si no existe
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recent_activities' 
        AND column_name = 'km'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE "public"."recent_activities" ADD COLUMN "km" NUMERIC;
    END IF;
    
    -- Verificar y añadir columna mins si no existe
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recent_activities' 
        AND column_name = 'mins'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE "public"."recent_activities" ADD COLUMN "mins" INTEGER;
    END IF;
    
    -- Verificar y añadir columna kg si no existe
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recent_activities' 
        AND column_name = 'kg'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE "public"."recent_activities" ADD COLUMN "kg" NUMERIC;
    END IF;
    
    -- Verificar y añadir columna reps si no existe
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recent_activities' 
        AND column_name = 'reps'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE "public"."recent_activities" ADD COLUMN "reps" INTEGER;
    END IF;
    
    -- Verificar y añadir columna sets si no existe
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recent_activities' 
        AND column_name = 'sets'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE "public"."recent_activities" ADD COLUMN "sets" INTEGER;
    END IF;
    
    -- Verificar y añadir columna kcal si no existe
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recent_activities' 
        AND column_name = 'kcal'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE "public"."recent_activities" ADD COLUMN "kcal" INTEGER;
    END IF;
    
    -- Verificar y añadir columna distance si no existe
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recent_activities' 
        AND column_name = 'distance'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE "public"."recent_activities" ADD COLUMN "distance" NUMERIC;
    END IF;
    
    -- Verificar y añadir columna duration si no existe
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recent_activities' 
        AND column_name = 'duration'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE "public"."recent_activities" ADD COLUMN "duration" INTEGER;
    END IF;
    
    -- Verificar y añadir columna weight si no existe
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recent_activities' 
        AND column_name = 'weight'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE "public"."recent_activities" ADD COLUMN "weight" NUMERIC;
    END IF;
END
$$;

-- Asegurarse de que la tabla recent_activities tenga habilitado RLS
ALTER TABLE "public"."recent_activities" ENABLE ROW LEVEL SECURITY;

-- Crear políticas para la tabla recent_activities
DROP POLICY IF EXISTS "Allow users to view their recent activities" ON "public"."recent_activities";
DROP POLICY IF EXISTS "Allow users to create their recent activities" ON "public"."recent_activities";
DROP POLICY IF EXISTS "Allow users to update their recent activities" ON "public"."recent_activities";
DROP POLICY IF EXISTS "Allow users to delete their recent activities" ON "public"."recent_activities";
DROP POLICY IF EXISTS "Temporary full access policy" ON "public"."recent_activities";

-- Crear nuevas políticas
CREATE POLICY "Allow users to view their recent activities" 
ON "public"."recent_activities" 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to create their recent activities" 
ON "public"."recent_activities" 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their recent activities" 
ON "public"."recent_activities" 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their recent activities" 
ON "public"."recent_activities" 
FOR DELETE 
USING (auth.uid() = user_id);

-- Política temporal para desarrollo
CREATE POLICY "Temporary full access policy" 
ON "public"."recent_activities" 
FOR ALL 
USING (true);
