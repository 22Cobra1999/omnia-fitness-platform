SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name IN ('meet_events', 'calendar_events')
AND table_schema = 'public';

-- Also check views definition if it is a view
SELECT table_name, view_definition
FROM information_schema.views
WHERE table_name = 'meet_events'
AND table_schema = 'public';
