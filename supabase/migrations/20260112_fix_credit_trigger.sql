-- Modify the trigger function to respect payment_status
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

    -- CASO 1: Nueva Solicitud (INSERT) - Solo si el pago es via creditos
    IF TG_OP = 'INSERT' AND NEW.participant_role = 'client' AND NEW.payment_status = 'credit_deduction' THEN
        -- Calcular costo
        v_cost := calculate_event_cost(v_event_start, v_event_end);
        
        -- Verificar saldo
        SELECT credits INTO v_current_credits FROM user_profiles WHERE id = NEW.client_id;
        
        IF v_current_credits IS NULL THEN v_current_credits := 0; END IF;
        
        IF v_current_credits < v_cost THEN
            RAISE EXCEPTION 'Saldo insuficiente. Se requieren % créditos, tenés %.', v_cost, v_current_credits;
        END IF;

        -- Descontar
        UPDATE user_profiles SET credits = credits - v_cost WHERE id = NEW.client_id;
        
        -- Registrar
        INSERT INTO credit_transactions (user_id, amount, transaction_type, event_id, description)
        VALUES (NEW.client_id, -v_cost, 'booking', NEW.event_id, 'Reserva solicitada (Pago Total)');
        
        RETURN NEW;
    END IF;

    -- CASO 2: Cancelación / Cambio de RSVP (UPDATE)
    IF TG_OP = 'UPDATE' AND NEW.participant_role = 'client' THEN
        -- Si cambia a 'declined' (Client Cancel) y antes no lo estaba
        IF NEW.rsvp_status = 'declined' AND OLD.rsvp_status != 'declined' THEN
             v_cost := calculate_event_cost(v_event_start, v_event_end);
             
             -- Solo devolver si pagó con créditos (full o parcial - asumimos que si hay reembolso logic, devolvemos creditos "teoricos" o lo que se pueda)
             -- Simplificación: Si el status original era 'credit_deduction', devolvemos.
             -- Si era 'unpaid' o 'free', no devolvemos creditos?
             -- Por ahora mantenemos logica simple: devolver el costo standard.
             
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
    
    RETURN NEW;
END;
$$;

-- RPC for Manual Deduction (Partial Payments)
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
