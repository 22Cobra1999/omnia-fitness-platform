-- Migration: Fix calendar_event_participants constraints and RLS
-- Date: 2026-02-16

-- 1. Update check constraint for payment_status to include 'credit_deduction'
DO $$
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE public.calendar_event_participants 
    DROP CONSTRAINT IF EXISTS calendar_event_participants_payment_status_check;

    -- Add updated constraint
    ALTER TABLE public.calendar_event_participants
    ADD CONSTRAINT calendar_event_participants_payment_status_check 
    CHECK (payment_status IN ('free', 'unpaid', 'paid', 'refunded', 'credit_deduction'));
END $$;

-- 2. Ensure RLS for coaches (master fix might have used user_id but we confirm here)
-- We use a policy that allows the coach (owner of the event) to manage all participants
DROP POLICY IF EXISTS "Coaches can manage participants of their events" ON public.calendar_event_participants;
CREATE POLICY "Coaches can manage participants of their events"
  ON public.calendar_event_participants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.calendar_events ce
      WHERE ce.id = calendar_event_participants.event_id
        AND ce.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.calendar_events ce
      WHERE ce.id = calendar_event_participants.event_id
        AND ce.coach_id = auth.uid()
    )
  );

-- Reload config to apply changes
NOTIFY pgrst, 'reload config';
