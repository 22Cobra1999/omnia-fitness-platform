-- ==============================================================================
-- MIGRATION: FIX COACH VISIBILITY FOR CLIENT PROGRESS
-- Allows coaches to see their clients' progress in Fitness, Nutrition, and Workshops
-- ==============================================================================

-- 1. Policies for progreso_cliente (Fitness)
DROP POLICY IF EXISTS "Coaches can view their clients fitness progress" ON public.progreso_cliente;
CREATE POLICY "Coaches can view their clients fitness progress"
ON public.progreso_cliente
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = progreso_cliente.actividad_id
    AND a.coach_id = auth.uid()
  )
);

-- 2. Policies for progreso_cliente_nutricion (Nutrition)
DROP POLICY IF EXISTS "Coaches can view their clients nutrition progress" ON public.progreso_cliente_nutricion;
CREATE POLICY "Coaches can view their clients nutrition progress"
ON public.progreso_cliente_nutricion
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = progreso_cliente_nutricion.actividad_id
    AND a.coach_id = auth.uid()
  )
);

-- 3. Policies for progreso_diario_actividad (Consolidated Progress)
DROP POLICY IF EXISTS "Coaches can view their clients daily activity progress" ON public.progreso_diario_actividad;
CREATE POLICY "Coaches can view their clients daily activity progress"
ON public.progreso_diario_actividad
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = progreso_diario_actividad.actividad_id
    AND a.coach_id = auth.uid()
  )
);

-- 4. Policies for taller_progreso_temas (Workshops Progress)
-- (Already exists in 20260122_fix_rls_taller_progreso.sql, but ensuring here)
DROP POLICY IF EXISTS "Coaches can manage their clients workshop progress" ON public.taller_progreso_temas;
CREATE POLICY "Coaches can manage their clients workshop progress"
ON public.taller_progreso_temas
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = taller_progreso_temas.actividad_id
    AND a.coach_id = auth.uid()
  )
);

-- 5. Policies for taller_detalles (Workshop Themes)
DROP POLICY IF EXISTS "Coaches can manage their own workshop themes" ON public.taller_detalles;
CREATE POLICY "Coaches can manage their own workshop themes"
ON public.taller_detalles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = taller_detalles.actividad_id
    AND a.coach_id = auth.uid()
  )
);
