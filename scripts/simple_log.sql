-- Simple Log Test
-- Testing if raw INSERT works without DO block wrapper.

DELETE FROM public.debug_log_table;
INSERT INTO public.debug_log_table (log_key, log_value) VALUES ('TEST', 'Can you hear me?');
