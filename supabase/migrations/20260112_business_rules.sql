-- 1. Agregamos columna credits a user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS credits INT DEFAULT 0;

-- 2. Tabla de transacciones para audit (ledger)
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    amount INT NOT NULL, -- Negativo para descuento, positivo para devolución
    transaction_type TEXT NOT NULL, -- 'booking', 'refund_cancellation', 'refund_coach', 'manual_adjustment', 'purchase'
    event_id UUID REFERENCES calendar_events(id),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Función auxiliar para calcular costo
CREATE OR REPLACE FUNCTION calculate_event_cost(start_time TIMESTAMP WITH TIME ZONE, end_time TIMESTAMP WITH TIME ZONE)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    minutes INT;
    cost INT;
BEGIN
    minutes := EXTRACT(EPOCH FROM (end_time - start_time)) / 60;
    -- 1 crédito cada 15 minutos. Ceiling o Round? "15 mins -> 1". 20 mins -> ? Regla: 1 crédito = 15 minutos.
    -- Asumimos bloques de 15. Si es 60, es 4.
    cost := CEIL(minutes / 15.0);
    RETURN cost;
END;
$$;

-- 4. Trigger principal: Manage Credits on Participation
CREATE OR REPLACE FUNCTION manage_credits_on_participation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_event_start TIMESTAMP WITH TIME ZONE;
    v_event_end TIMESTAMP WITH TIME ZONE;
    v_cost INT;
    v_current_credits INT;
    v_event_status TEXT;
    v_hours_until_start NUMERIC;
BEGIN
    -- Obtener datos del evento
    SELECT start_time, end_time, status INTO v_event_start, v_event_end, v_event_status
    FROM calendar_events WHERE id = COALESCE(NEW.event_id, OLD.event_id);

    -- CASO 1: Nueva Solicitud (INSERT)
    IF TG_OP = 'INSERT' AND NEW.participant_role = 'client' THEN
        -- Calcular costo
        v_cost := calculate_event_cost(v_event_start, v_event_end);
        
        -- Verificar saldo
        SELECT credits INTO v_current_credits FROM user_profiles WHERE id = NEW.client_id;
        
        -- Si no tiene creditos definidos, asumir 0
        IF v_current_credits IS NULL THEN v_current_credits := 0; END IF;
        
        IF v_current_credits < v_cost THEN
            RAISE EXCEPTION 'Saldo insuficiente. Se requieren % créditos, tenés %.', v_cost, v_current_credits;
        END IF;

        -- Descontar
        UPDATE user_profiles SET credits = credits - v_cost WHERE id = NEW.client_id;
        
        -- Registrar
        INSERT INTO credit_transactions (user_id, amount, transaction_type, event_id, description)
        VALUES (NEW.client_id, -v_cost, 'booking', NEW.event_id, 'Reserva solicitada');
        
        RETURN NEW;
    END IF;

    -- CASO 2: Cancelación / Cambio de RSVP (UPDATE)
    IF TG_OP = 'UPDATE' AND NEW.participant_role = 'client' THEN
        -- Si cambia a 'declined' (Client Cancel) y antes no lo estaba
        IF NEW.rsvp_status = 'declined' AND OLD.rsvp_status != 'declined' THEN
             v_cost := calculate_event_cost(v_event_start, v_event_end);
             
             -- Calcular horas hasta el evento
             v_hours_until_start := EXTRACT(EPOCH FROM (v_event_start - NOW())) / 3600;
             
             -- Regla: > 24hs = Devolución
             IF v_hours_until_start > 24 THEN
                 UPDATE user_profiles SET credits = credits + v_cost WHERE id = NEW.client_id;
                 
                 INSERT INTO credit_transactions (user_id, amount, transaction_type, event_id, description)
                 VALUES (NEW.client_id, v_cost, 'refund_cancellation', NEW.event_id, 'Cancelación anticipada (>24h)');
             ELSE
                 -- < 24hs = No devolución (Penalty)
                 INSERT INTO credit_transactions (user_id, amount, transaction_type, event_id, description)
                 VALUES (NEW.client_id, 0, 'penalty_late_cancellation', NEW.event_id, 'Cancelación tardía (<24h) - Sin devolución');
             END IF;
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Trigger para cancellation del COACH (en calendar_events)
CREATE OR REPLACE FUNCTION manage_credits_on_event_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    r RECORD;
    v_cost INT;
BEGIN
    -- Si el evento pasa a 'cancelled'
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        v_cost := calculate_event_cost(NEW.start_time, NEW.end_time);
        
        -- Devolver créditos a todos los clientes confirmados/pendientes
        FOR r IN SELECT client_id FROM calendar_event_participants 
                 WHERE event_id = NEW.id AND participant_role = 'client' AND rsvp_status IN ('confirmed', 'pending')
        LOOP
            UPDATE user_profiles SET credits = credits + v_cost WHERE id = r.client_id;
            
            INSERT INTO credit_transactions (user_id, amount, transaction_type, event_id, description)
            VALUES (r.client_id, v_cost, 'refund_coach', NEW.id, 'Cancelación por Coach');
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;

-- Triggers
DROP TRIGGER IF EXISTS trg_credits_participation ON calendar_event_participants;
CREATE TRIGGER trg_credits_participation
BEFORE INSERT OR UPDATE ON calendar_event_participants
FOR EACH ROW EXECUTE FUNCTION manage_credits_on_participation();

DROP TRIGGER IF EXISTS trg_credits_event_cancel ON calendar_events;
CREATE TRIGGER trg_credits_event_cancel
AFTER UPDATE ON calendar_events
FOR EACH ROW EXECUTE FUNCTION manage_credits_on_event_cancel();
