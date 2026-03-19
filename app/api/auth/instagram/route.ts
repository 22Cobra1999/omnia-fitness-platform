import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const host = request.headers.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const currentDomain = `${protocol}://${host}`;

  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${currentDomain}/api/auth/callback/instagram`;
  
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Instagram client ID or redirect URI not configured' },
      { status: 500 }
    );
  }

  const scope = [
    'instagram_business_basic',
    'instagram_business_manage_messages',
    'instagram_business_manage_comments',
    'instagram_business_content_publish',
    'instagram_business_manage_insights'
  ].join(',');

  const authUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;

  return NextResponse.redirect(authUrl);
}
