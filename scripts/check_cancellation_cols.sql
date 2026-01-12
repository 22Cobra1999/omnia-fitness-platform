SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('calendar_events', 'calendar_event_participants') 
AND column_name IN ('cancelled_by', 'created_at')
ORDER BY table_name, ordinal_position
