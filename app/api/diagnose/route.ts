import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/supabase-server';

export async function GET() {
  const diagnostics = {
    env: {
      has_ig_client_id: !!process.env.INSTAGRAM_CLIENT_ID,
      has_ig_client_secret: !!process.env.INSTAGRAM_CLIENT_SECRET,
      has_ig_redirect: !!process.env.INSTAGRAM_REDIRECT_URI,
      has_encryption_key: !!process.env.ENCRYPTION_KEY,
      encryption_key_length: process.env.ENCRYPTION_KEY?.length || 0,
      site_url: process.env.NEXT_PUBLIC_SITE_URL,
    },
    instagram_config: {
      expected_redirect: process.env.INSTAGRAM_REDIRECT_URI,
    }
  };

  return NextResponse.json(diagnostics);
}
