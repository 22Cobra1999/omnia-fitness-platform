-- FORCE update of credit trigger logic part 2
-- Renaming function to v3 to ensure it is picked up

DROP TRIGGER IF EXISTS trg_credits_participation ON calendar_event_participants;
DROP FUNCTION IF EXISTS manage_credits_on_participation CASCADE;

CREATE FUNCTION manage_credits_on_participation_v3()
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
    SELECT start_time, end_time, status INTO v_event_start, v_event_end, v_event_status
    FROM calendar_events WHERE id = COALESCE(NEW.event_id, OLD.event_id);

    -- CASO 1: INSERT Client
    IF TG_OP = 'INSERT' AND NEW.participant_role = 'client' THEN
        -- Only check credits if status is explicitly 'credit_deduction'
        IF NEW.payment_status = 'credit_deduction' THEN
            v_cost := calculate_event_cost(v_event_start, v_event_end);
            
            SELECT credits INTO v_current_credits FROM user_profiles WHERE id = NEW.client_id;
            IF v_current_credits IS NULL THEN v_current_credits := 0; END IF;
            
            IF v_current_credits < v_cost THEN
                RAISE EXCEPTION 'Saldo insuficiente. Se requieren % créditos, tenés %.', v_cost, v_current_credits;
            END IF;

            UPDATE user_profiles SET credits = credits - v_cost WHERE id = NEW.client_id;
            
            INSERT INTO credit_transactions (user_id, amount, transaction_type, event_id, description)
            VALUES (NEW.client_id, -v_cost, 'booking', NEW.event_id, 'Reserva solicitada (Pago Total)');
        END IF;
        
        -- If status is 'unpaid' or 'free', DO NOT raise exception.
        RETURN NEW;
    END IF;

    -- CASO 2: UPDATE (Cancellation)
    IF TG_OP = 'UPDATE' AND NEW.participant_role = 'client' THEN
        IF NEW.rsvp_status = 'declined' AND OLD.rsvp_status != 'declined' THEN
             v_cost := calculate_event_cost(v_event_start, v_event_end);
             v_hours_until_start := EXTRACT(EPOCH FROM (v_event_start - NOW())) / 3600;
             
             IF v_hours_until_start > 24 THEN
                 UPDATE user_profiles SET credits = credits + v_cost WHERE id = NEW.client_id;
                 INSERT INTO credit_transactions (user_id, amount, transaction_type, event_id, description)
                 VALUES (NEW.client_id, v_cost, 'refund_cancellation', NEW.event_id, 'Cancelación anticipada (>24h)');
             ELSE
                 INSERT INTO credit_transactions (user_id, amount, transaction_type, event_id, description)
                 VALUES (NEW.client_id, 0, 'penalty_late_cancellation', NEW.event_id, 'Cancelación tardía (<24h) - Sin devolución');
             END IF;
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_credits_participation
BEFORE INSERT OR UPDATE ON calendar_event_participants
FOR EACH ROW EXECUTE FUNCTION manage_credits_on_participation_v3();

-- RPC Re-definition just in case
CREATE OR REPLACE FUNCTION deduct_client_credits(p_client_id UUID, p_amount INT, p_event_id UUID, p_description TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current INT;
BEGIN
    SELECT credits INTO v_current FROM user_profiles WHERE id = p_client_id;
    IF v_current IS NULL THEN v_current := 0; END IF;

    IF v_current < p_amount THEN
        RETURN json_build_object('success', false, 'message', 'Saldo insuficiente');
    END IF;

    UPDATE user_profiles SET credits = credits - p_amount WHERE id = p_client_id;

    INSERT INTO credit_transactions (user_id, amount, transaction_type, event_id, description)
    VALUES (p_client_id, -p_amount, 'booking', p_event_id, p_description);

    RETURN json_build_object('success', true, 'new_balance', v_current - p_amount);
END;
$$;
