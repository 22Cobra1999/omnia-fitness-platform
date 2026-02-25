SELECT proname, substring(prosrc from 501 for 1000) as src_part
FROM pg_proc
WHERE proname = 'handle_new_user'
