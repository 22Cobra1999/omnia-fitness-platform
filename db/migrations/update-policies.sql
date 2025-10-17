-- Eliminar políticas existentes para la tabla recent_activities
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."recent_activities";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."recent_activities";
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "public"."recent_activities";
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "public"."recent_activities";

-- Crear nuevas políticas para la tabla recent_activities
CREATE POLICY "Enable read access for all users" 
ON "public"."recent_activities" 
FOR SELECT 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON "public"."recent_activities" 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on user_id" 
ON "public"."recent_activities" 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" 
ON "public"."recent_activities" 
FOR DELETE 
USING (auth.uid() = user_id);

-- Asegurarse de que la tabla recent_activities tenga habilitado RLS
ALTER TABLE "public"."recent_activities" ENABLE ROW LEVEL SECURITY;

-- Verificar si la tabla recent_activities existe y crear si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'recent_activities') THEN
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
