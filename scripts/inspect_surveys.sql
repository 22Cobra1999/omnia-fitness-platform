SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'activity_surveys'
ORDER BY ordinal_position;
