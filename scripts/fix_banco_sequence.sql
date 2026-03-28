-- Fix for "duplicate key value violates unique constraint 'banco_pkey'"
-- This error happens when the database sequence for automatic IDs is out of sync with the actual data in the table.
-- This command syncs the sequence to the maximum existing ID + 1.

SELECT setval(pg_get_serial_sequence('banco', 'id'), COALESCE((SELECT MAX(id) + 1 FROM banco), 1), false);
