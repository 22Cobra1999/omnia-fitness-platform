ALTER TABLE google_oauth_tokens
ADD COLUMN IF NOT EXISTS google_email text null;
