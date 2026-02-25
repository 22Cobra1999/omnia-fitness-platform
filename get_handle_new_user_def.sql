SELECT proname, prosrc
FROM pg_proc
WHERE proname LIKE 'handle_new_user%'
