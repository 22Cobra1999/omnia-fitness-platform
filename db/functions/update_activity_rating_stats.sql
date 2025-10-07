CREATE OR REPLACE FUNCTION update_activity_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Refrescar la vista materializada cuando cambian los surveys
    REFRESH MATERIALIZED VIEW activity_program_stats;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
