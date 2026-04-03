-- Migration: Split coaches table into specialized tables
-- Date: 2026-04-03

-- 1. Create table for Meet/Consultation Pricing and Configuration
CREATE TABLE IF NOT EXISTS coach_meets_config (
    id UUID PRIMARY KEY REFERENCES coaches(id) ON DELETE CASCADE,
    cafe NUMERIC,
    cafe_enabled BOOLEAN DEFAULT false,
    meet_30 NUMERIC DEFAULT 0,
    meet_30_enabled BOOLEAN DEFAULT false,
    meet_1 NUMERIC DEFAULT 0,
    meet_1_enabled BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for coach_meets_config
ALTER TABLE coach_meets_config ENABLE ROW LEVEL SECURITY;

-- 2. Create table for Social Media Connections (Instagram)
CREATE TABLE IF NOT EXISTS coach_social_accounts (
    id UUID PRIMARY KEY REFERENCES coaches(id) ON DELETE CASCADE,
    instagram_username TEXT,
    instagram_verified BOOLEAN DEFAULT false,
    instagram_user_id TEXT,
    instagram_access_token TEXT,
    instagram_expires_at TIMESTAMP WITH TIME ZONE,
    instagram_connected_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for coach_social_accounts
ALTER TABLE coach_social_accounts ENABLE ROW LEVEL SECURITY;

-- 3. Create table for Private Contact and Personal Data
CREATE TABLE IF NOT EXISTS coach_contact_info (
    id UUID PRIMARY KEY REFERENCES coaches(id) ON DELETE CASCADE,
    whatsapp NUMERIC,
    phone TEXT,
    location TEXT,
    country TEXT,
    city TEXT,
    neighborhood TEXT,
    emergency_contact TEXT,
    birth_date DATE,
    gender TEXT,
    weight NUMERIC(5,2),
    height INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for coach_contact_info
ALTER TABLE coach_contact_info ENABLE ROW LEVEL SECURITY;

-- 4. Initial Data Migration
INSERT INTO coach_meets_config (id, cafe, cafe_enabled, meet_30, meet_30_enabled, meet_1, meet_1_enabled)
SELECT id, cafe, cafe_enabled, meet_30, meet_30_enabled, meet_1, meet_1_enabled FROM coaches
ON CONFLICT (id) DO UPDATE SET 
    cafe = EXCLUDED.cafe,
    cafe_enabled = EXCLUDED.cafe_enabled,
    meet_30 = EXCLUDED.meet_30,
    meet_30_enabled = EXCLUDED.meet_30_enabled,
    meet_1 = EXCLUDED.meet_1,
    meet_1_enabled = EXCLUDED.meet_1_enabled;

INSERT INTO coach_social_accounts (id, instagram_username, instagram_verified, instagram_user_id, instagram_access_token, instagram_expires_at, instagram_connected_at)
SELECT id, instagram_username, instagram_verified, instagram_user_id, instagram_access_token, instagram_expires_at, instagram_connected_at FROM coaches
ON CONFLICT (id) DO UPDATE SET
    instagram_username = EXCLUDED.instagram_username,
    instagram_verified = EXCLUDED.instagram_verified,
    instagram_user_id = EXCLUDED.instagram_user_id,
    instagram_access_token = EXCLUDED.instagram_access_token,
    instagram_expires_at = EXCLUDED.instagram_expires_at,
    instagram_connected_at = EXCLUDED.instagram_connected_at;

INSERT INTO coach_contact_info (id, whatsapp, phone, location, country, city, neighborhood, emergency_contact, birth_date, gender, weight, height)
SELECT id, whatsapp, phone, location, country, city, neighborhood, emergency_contact, birth_date, gender, weight, height FROM coaches
ON CONFLICT (id) DO UPDATE SET
    whatsapp = EXCLUDED.whatsapp,
    phone = EXCLUDED.phone,
    location = EXCLUDED.location,
    country = EXCLUDED.country,
    city = EXCLUDED.city,
    neighborhood = EXCLUDED.neighborhood,
    emergency_contact = EXCLUDED.emergency_contact,
    birth_date = EXCLUDED.birth_date,
    gender = EXCLUDED.gender,
    weight = EXCLUDED.weight,
    height = EXCLUDED.height;

-- 5. RLS Policies
-- General: Public read for config/social, private for contact
CREATE POLICY "Public read for coach_meets_config" ON coach_meets_config FOR SELECT USING (true);
CREATE POLICY "Coaches can manage their own meets" ON coach_meets_config FOR ALL USING (auth.uid() = id);

CREATE POLICY "Public read for coach_social_accounts" ON coach_social_accounts FOR SELECT USING (true);
CREATE POLICY "Coaches can manage their own social" ON coach_social_accounts FOR ALL USING (auth.uid() = id);

CREATE POLICY "Coaches can manage their own contact info" ON coach_contact_info FOR ALL USING (auth.uid() = id);
CREATE POLICY "Public read for coach location info" ON coach_contact_info FOR SELECT USING (true); -- Location is often public
