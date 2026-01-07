-- 1) Ledger de créditos Meet por (coach, cliente) calculado desde activity_enrollments

-- Enrollments solo aportan créditos totales. El uso/descuento vive en el ledger.
ALTER TABLE public.activity_enrollments
  DROP COLUMN IF EXISTS meet_credits_used;

CREATE TABLE IF NOT EXISTS public.client_meet_credits_ledger (
  coach_id UUID NOT NULL,
  client_id UUID NOT NULL,
  meet_credits_total INTEGER NOT NULL DEFAULT 0,
  meet_credits_used INTEGER NOT NULL DEFAULT 0,
  meet_credits_available INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (coach_id, client_id),
  CONSTRAINT client_meet_credits_ledger_coach_fk FOREIGN KEY (coach_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT client_meet_credits_ledger_client_fk FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Si la tabla existía previamente con otro esquema, asegurar columnas mínimas
ALTER TABLE public.client_meet_credits_ledger
  ADD COLUMN IF NOT EXISTS coach_id UUID;

ALTER TABLE public.client_meet_credits_ledger
  ADD COLUMN IF NOT EXISTS client_id UUID;

ALTER TABLE public.client_meet_credits_ledger
  ADD COLUMN IF NOT EXISTS meet_credits_total INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.client_meet_credits_ledger
  ADD COLUMN IF NOT EXISTS meet_credits_used INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.client_meet_credits_ledger
  ADD COLUMN IF NOT EXISTS meet_credits_available INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.client_meet_credits_ledger
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Normalizar: si existían columnas legacy credits_* (duplicadas), eliminarlas.
-- A partir de este cambio, la fuente de verdad es meet_credits_*.
ALTER TABLE public.client_meet_credits_ledger
  DROP COLUMN IF EXISTS credits_total;

ALTER TABLE public.client_meet_credits_ledger
  DROP COLUMN IF EXISTS credits_used;

ALTER TABLE public.client_meet_credits_ledger
  DROP COLUMN IF EXISTS credits_available;

CREATE OR REPLACE FUNCTION public.recalculate_client_meet_credits(p_coach_id UUID, p_client_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total INTEGER;
  v_existing_used INTEGER;
BEGIN
  SELECT
    COALESCE(SUM(ae.meet_credits_total), 0)::INT
  INTO v_total
  FROM public.activity_enrollments ae
  JOIN public.activities ab ON ab.id = ae.activity_id
  WHERE ae.client_id = p_client_id
    AND ab.coach_id = p_coach_id;

  SELECT COALESCE(meet_credits_used, 0)::INT
  INTO v_existing_used
  FROM public.client_meet_credits_ledger
  WHERE coach_id = p_coach_id
    AND client_id = p_client_id;

  INSERT INTO public.client_meet_credits_ledger (
    coach_id,
    client_id,
    meet_credits_total,
    meet_credits_used,
    meet_credits_available,
    updated_at
  ) VALUES (
    p_coach_id,
    p_client_id,
    v_total,
    COALESCE(v_existing_used, 0),
    GREATEST(v_total - COALESCE(v_existing_used, 0), 0),
    NOW()
  )
  ON CONFLICT (coach_id, client_id) DO UPDATE
  SET
    meet_credits_total = EXCLUDED.meet_credits_total,
    -- No sobreescribir meet_credits_used: se gestiona en el ledger.
    meet_credits_available = GREATEST(EXCLUDED.meet_credits_total - public.client_meet_credits_ledger.meet_credits_used, 0),
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trg_recalculate_client_meet_credits()
RETURNS TRIGGER AS $$
DECLARE
  v_coach_id UUID;
  v_client_id UUID;
  v_activity_id BIGINT;
BEGIN
  v_client_id := COALESCE(NEW.client_id, OLD.client_id);
  v_activity_id := COALESCE(NEW.activity_id, OLD.activity_id);

  SELECT ab.coach_id INTO v_coach_id
  FROM public.activities ab
  WHERE ab.id = v_activity_id;

  IF v_coach_id IS NULL OR v_client_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  PERFORM public.recalculate_client_meet_credits(v_coach_id, v_client_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS activity_enrollments_recalculate_meet_credits ON public.activity_enrollments;
CREATE TRIGGER activity_enrollments_recalculate_meet_credits
AFTER INSERT OR UPDATE OR DELETE ON public.activity_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.trg_recalculate_client_meet_credits();

-- Backfill inicial
INSERT INTO public.client_meet_credits_ledger (coach_id, client_id, meet_credits_total, meet_credits_used, meet_credits_available, updated_at)
SELECT
  ab.coach_id,
  ae.client_id,
  COALESCE(SUM(ae.meet_credits_total), 0)::INT AS meet_credits_total,
  0::INT AS meet_credits_used,
  COALESCE(SUM(ae.meet_credits_total), 0)::INT AS meet_credits_available,
  NOW() AS updated_at
FROM public.activity_enrollments ae
JOIN public.activities ab ON ab.id = ae.activity_id
GROUP BY ab.coach_id, ae.client_id
ON CONFLICT (coach_id, client_id) DO UPDATE
SET
  meet_credits_total = EXCLUDED.meet_credits_total,
  meet_credits_available = GREATEST(EXCLUDED.meet_credits_total - public.client_meet_credits_ledger.meet_credits_used, 0),
  updated_at = EXCLUDED.updated_at;

ALTER TABLE public.client_meet_credits_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can view their client meet credits" ON public.client_meet_credits_ledger;
CREATE POLICY "Coaches can view their client meet credits"
  ON public.client_meet_credits_ledger
  FOR SELECT
  USING (auth.uid() = coach_id);


-- 2) Participantes por Meet con RSVP + estado de pago
CREATE TABLE IF NOT EXISTS public.calendar_event_participants (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  rsvp_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (rsvp_status IN ('pending', 'confirmed', 'declined', 'cancelled')),

  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('free', 'unpaid', 'paid', 'refunded')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (event_id, client_id)
);

ALTER TABLE public.calendar_event_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can view participants of their events" ON public.calendar_event_participants;
CREATE POLICY "Coaches can view participants of their events"
  ON public.calendar_event_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.calendar_events ce
      WHERE ce.id = calendar_event_participants.event_id
        AND ce.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Clients can view their own participation" ON public.calendar_event_participants;
CREATE POLICY "Clients can view their own participation"
  ON public.calendar_event_participants
  FOR SELECT
  USING (auth.uid() = client_id);

CREATE INDEX IF NOT EXISTS idx_calendar_event_participants_event_id
  ON public.calendar_event_participants(event_id);

CREATE INDEX IF NOT EXISTS idx_calendar_event_participants_client_id
  ON public.calendar_event_participants(client_id);


-- 3) Migrar calendar_events.client_id -> calendar_event_participants
DO $$
DECLARE
  v_has_is_free BOOLEAN;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'calendar_events'
      AND column_name = 'client_id'
  ) THEN
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'calendar_events'
        AND column_name = 'is_free'
    ) INTO v_has_is_free;

    IF v_has_is_free THEN
      EXECUTE '
        INSERT INTO public.calendar_event_participants (event_id, client_id, rsvp_status, payment_status)
        SELECT
          ce.id AS event_id,
          ce.client_id,
          ''pending''::TEXT AS rsvp_status,
          CASE WHEN ce.is_free = TRUE THEN ''free''::TEXT ELSE ''unpaid''::TEXT END AS payment_status
        FROM public.calendar_events ce
        WHERE ce.client_id IS NOT NULL
        ON CONFLICT (event_id, client_id) DO NOTHING
      ';
    ELSE
      EXECUTE '
        INSERT INTO public.calendar_event_participants (event_id, client_id, rsvp_status, payment_status)
        SELECT
          ce.id AS event_id,
          ce.client_id,
          ''pending''::TEXT AS rsvp_status,
          ''unpaid''::TEXT AS payment_status
        FROM public.calendar_events ce
        WHERE ce.client_id IS NOT NULL
        ON CONFLICT (event_id, client_id) DO NOTHING
      ';
    END IF;
  END IF;
END $$;


-- 4) Actualizar RLS calendar_events: clientes ven eventos donde son participantes
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view their own events" ON public.calendar_events;
CREATE POLICY "Clients can view events they participate in"
  ON public.calendar_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.calendar_event_participants cep
      WHERE cep.event_id = calendar_events.id
        AND cep.client_id = auth.uid()
    )
  );


-- 5) Eliminar columna client_id de calendar_events (después de migrar)
DO $$
DECLARE
  v_attnum INTEGER;
  r RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'calendar_events'
      AND column_name = 'client_id'
  ) THEN
    -- Eliminar constraints que referencien a client_id (FK, CHECKs, etc.)
    SELECT attnum INTO v_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.calendar_events'::regclass
      AND attname = 'client_id'
      AND NOT attisdropped;

    IF v_attnum IS NOT NULL THEN
      FOR r IN (
        SELECT c.conname
        FROM pg_constraint c
        WHERE c.conrelid = 'public.calendar_events'::regclass
          AND v_attnum = ANY (c.conkey)
      ) LOOP
        EXECUTE format('ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS %I', r.conname);
      END LOOP;
    END IF;

    -- Eliminar índices que incluyan client_id
    DROP INDEX IF EXISTS public.idx_calendar_events_client_id;
    FOR r IN (
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'calendar_events'
        AND indexdef ILIKE '%(client_id%'
    ) LOOP
      EXECUTE format('DROP INDEX IF EXISTS public.%I', r.indexname);
    END LOOP;

    ALTER TABLE public.calendar_events
      DROP COLUMN client_id;
  END IF;
END $$;
