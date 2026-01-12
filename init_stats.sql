DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM user_profiles WHERE role = 'coach'
    LOOP
        PERFORM calculate_coach_stats(r.id);
    END LOOP;
END $$;
