-- ==============================================================================
-- MIGRATION: ALLOW COACHES TO UPDATE CLIENT PROGRESS
-- Date: 2026-03-13
-- Description: Grants Coaches UPDATE and INSERT permissions on progression tables
-- ==============================================================================

-- 1. Policies for progreso_cliente (Fitness)
DROP POLICY IF EXISTS "Coaches can update their clients fitness progress" ON public.progreso_cliente;
CREATE POLICY "Coaches can update their clients fitness progress"
ON public.progreso_cliente
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = progreso_cliente.actividad_id
    AND a.coach_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = progreso_cliente.actividad_id
    AND a.coach_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Coaches can insert their clients fitness progress" ON public.progreso_cliente;
CREATE POLICY "Coaches can insert their clients fitness progress"
ON public.progreso_cliente
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = actividad_id
    AND a.coach_id = auth.uid()
  )
);

-- 2. Policies for progreso_cliente_nutricion (Nutrition)
DROP POLICY IF EXISTS "Coaches can update their clients nutrition progress" ON public.progreso_cliente_nutricion;
CREATE POLICY "Coaches can update their clients nutrition progress"
ON public.progreso_cliente_nutricion
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = progreso_cliente_nutricion.actividad_id
    AND a.coach_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = progreso_cliente_nutricion.actividad_id
    AND a.coach_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Coaches can insert their clients nutrition progress" ON public.progreso_cliente_nutricion;
CREATE POLICY "Coaches can insert their clients nutrition progress"
ON public.progreso_cliente_nutricion
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = actividad_id
    AND a.coach_id = auth.uid()
  )
);
