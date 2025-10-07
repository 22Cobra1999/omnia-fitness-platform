import { NextResponse } from "next/server"
import { getServerSupabaseClient } from "@/lib/supabase"
export async function POST() {
  try {
    const supabase = getServerSupabaseClient()
    // Check if profiles table exists, if not create it
    const { error: tableError } = await supabase.rpc("check_if_table_exists", {
      table_name: "profiles",
    })
    if (tableError) {
      // Create the profiles table
      const { error: createError } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID REFERENCES auth.users(id) PRIMARY KEY,
          email TEXT NOT NULL,
          name TEXT,
          avatar_url TEXT,
          level TEXT DEFAULT 'user',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        -- Create a trigger to update updated_at when a profile is updated
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        -- Set up RLS (Row Level Security)
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        -- Create policies
        CREATE POLICY "Users can view their own profile"
          ON profiles FOR SELECT
          USING (auth.uid() = id);
        CREATE POLICY "Users can update their own profile"
          ON profiles FOR UPDATE
          USING (auth.uid() = id);
      `)
      if (createError) {
        console.error("Error creating profiles table:", createError)
        return NextResponse.json({ error: "Error setting up database" }, { status: 500 })
      }
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: "An error occurred during setup" }, { status: 500 })
  }
}
