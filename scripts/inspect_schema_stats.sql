SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('calendar_events', 'calendar_event_participants', 'calendar_event_reschedule_requests', 'user_profiles') 
ORDER BY table_name, ordinal_position
