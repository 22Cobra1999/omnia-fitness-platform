-- Enable RLS on the table
ALTER TABLE IF EXISTS client_meet_credits_ledger ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Clients can view their own credit ledger" ON client_meet_credits_ledger;

-- Create policy to allow clients to view their own rows
CREATE POLICY "Clients can view their own credit ledger"
ON client_meet_credits_ledger
FOR SELECT
USING (auth.uid() = client_id);

-- Optional: If coaches also need to see it
DROP POLICY IF EXISTS "Coaches can view their clients credit ledger" ON client_meet_credits_ledger;

CREATE POLICY "Coaches can view their clients credit ledger"
ON client_meet_credits_ledger
FOR SELECT
USING (auth.uid() = coach_id);
