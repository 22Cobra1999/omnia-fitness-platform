SELECT proname, substring(prosrc from 1 for 500) as src_part
FROM pg_proc
WHERE proname = 'handle_new_user'
