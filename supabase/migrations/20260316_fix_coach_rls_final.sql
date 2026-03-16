-- Final RLS Repair for Coach Visibility
-- This ensures coaches can see and manage all progress of their clients.

-- 1. Fitness Progress (progreso_cliente)
DROP POLICY IF EXISTS "Coaches can view their clients fitness progress" ON public.progreso_cliente;
CREATE POLICY "Coaches can view their clients fitness progress"
ON public.progreso_cliente FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = progreso_cliente.actividad_id
    AND a.coach_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Coaches can update their clients fitness progress" ON public.progreso_cliente;
CREATE POLICY "Coaches can update their clients fitness progress"
ON public.progreso_cliente FOR UPDATE TO authenticated
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

-- 2. Nutrition Progress (progreso_cliente_nutricion)
DROP POLICY IF EXISTS "Coaches can view their clients nutrition progress" ON public.progreso_cliente_nutricion;
CREATE POLICY "Coaches can view their clients nutrition progress"
ON public.progreso_cliente_nutricion FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = progreso_cliente_nutricion.actividad_id
    AND a.coach_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Coaches can update their clients nutrition progress" ON public.progreso_cliente_nutricion;
CREATE POLICY "Coaches can update their clients nutrition progress"
ON public.progreso_cliente_nutricion FOR UPDATE TO authenticated
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

-- 3. Daily Summary (progreso_diario_actividad)
DROP POLICY IF EXISTS "Coaches can view their clients daily activity progress" ON public.progreso_diario_actividad;
CREATE POLICY "Coaches can view their clients daily activity progress"
ON public.progreso_diario_actividad FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = progreso_diario_actividad.actividad_id
    AND a.coach_id = auth.uid()
  )
);

-- 4. Calendar Participants (calendar_event_participants)
-- Ensure selecting by user_id is allowed
DROP POLICY IF EXISTS "Coaches can view participants of their events" ON public.calendar_event_participants;
CREATE POLICY "Coaches can view participants of their events"
  ON public.calendar_event_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.calendar_events ce
      WHERE ce.id = calendar_event_participants.event_id
        AND ce.coach_id = auth.uid()
    )
  );
