-- Auto-insert all document topics into client_document_progress on purchase
-- This ensures we have all topics tracked from the start

CREATE OR REPLACE FUNCTION auto_insert_document_progress()
RETURNS TRIGGER AS $$
DECLARE
    topic_record RECORD;
BEGIN
    -- Only proceed if this is a document activity
    IF EXISTS (
        SELECT 1 FROM activities 
        WHERE id = NEW.activity_id 
        AND (type = 'document' OR type = 'documento')
    ) THEN
        -- Insert all topics for this document
        FOR topic_record IN 
            SELECT id, nombre 
            FROM taller_detalles 
            WHERE actividad_id = NEW.activity_id
        LOOP
            INSERT INTO client_document_progress (
                client_id,
                enrollment_id,
                activity_id,
                topic_id,
                completed
            ) VALUES (
                NEW.client_id,
                NEW.id,
                NEW.activity_id,
                topic_record.id,
                false
            )
            ON CONFLICT (client_id, enrollment_id, topic_id) 
            DO NOTHING;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on activity_enrollments
DROP TRIGGER IF EXISTS trigger_auto_insert_document_progress ON activity_enrollments;
CREATE TRIGGER trigger_auto_insert_document_progress
    AFTER INSERT ON activity_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION auto_insert_document_progress();
