-- Add sports column to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS sports text[] DEFAULT '{}';

-- Comment on column
COMMENT ON COLUMN clients.sports IS 'List of sports practiced by the client';
