SELECT table_name, view_definition
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE 'meet%';
