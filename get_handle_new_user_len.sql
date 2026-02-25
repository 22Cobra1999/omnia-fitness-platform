SELECT proname, length(prosrc) as src_length
FROM pg_proc
WHERE proname = 'handle_new_user'
