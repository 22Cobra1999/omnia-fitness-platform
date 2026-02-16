SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'calendar_events' 
  AND column_name IN ('invited_by_user_id', 'created_by_user_id')
