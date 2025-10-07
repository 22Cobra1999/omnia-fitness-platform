-- Función para incrementar el contador de cupos reservados de forma segura
CREATE OR REPLACE FUNCTION increment_booked_slots(session_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE calendar_events
  SET booked_slots = booked_slots + 1
  WHERE id = session_id::uuid
  AND booked_slots < available_slots;
END;
$$ LANGUAGE plpgsql;
