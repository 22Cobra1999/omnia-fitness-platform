import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { GoogleOAuth } from '@/lib/google/oauth';
import { encrypt } from '@/lib/utils/encryption';

/**
 * Callback de OAuth de Google Calendar
 * Intercambia el código de autorización por access_token y refresh_token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('🔵 [Google OAuth Callback] Iniciando callback:', {
      hasCode: !!code,
      hasState: !!state,
      hasError: !!error,
      error,
      url: request.url,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://omnia-app.vercel.app';
    
    // Si hay un error, redirigir con mensaje
    if (error) {
      console.error('❌ [Google OAuth Callback] Error recibido de Google:', error);
      return NextResponse.redirect(
        `${appUrl}/?tab=profile&google_calendar_auth=error&error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      console.error('❌ [Google OAuth Callback] Faltan parámetros:', { code: !!code, state: !!state });
      return NextResponse.redirect(
        `${appUrl}/?tab=profile&google_calendar_auth=error&error=missing_params`
      );
    }

    // El state contiene directamente el coach_id
    const coachId = state;

    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI?.trim() || 
                       `${appUrl}/api/google/oauth/callback`;

    console.log('🔵 [Google OAuth Callback] Configuración:', {
      coachId,
      redirectUri,
      appUrl,
      hasClientId: !!process.env.GOOGLE_CLIENT_ID?.trim(),
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET?.trim(),
    });

    if (!process.env.GOOGLE_CLIENT_ID?.trim() || !process.env.GOOGLE_CLIENT_SECRET?.trim()) {
      console.error('❌ [Google OAuth Callback] Credenciales de Google no configuradas');
      return NextResponse.redirect(
        `${appUrl}/?tab=profile&google_calendar_auth=error&error=config_error`
      );
    }

    // Intercambiar código por tokens usando GoogleOAuth
    let tokenData;
    try {
      console.log('🔄 [Google OAuth Callback] Intercambiando código por tokens...');
      tokenData = await GoogleOAuth.exchangeCodeForTokens(code, redirectUri);
      console.log('✅ [Google OAuth Callback] Tokens recibidos:', {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
      });
    } catch (tokenError: any) {
      console.error('❌ [Google OAuth Callback] Error intercambiando código por token:', {
        error: tokenError.message,
        stack: tokenError.stack,
      });
      return NextResponse.redirect(
        `${appUrl}/?tab=profile&google_calendar_auth=error&error=token_exchange_failed&details=${encodeURIComponent(tokenError.message)}`
      );
    }

    const { access_token, refresh_token, expires_in, scope } = tokenData;

    if (!access_token) {
      console.error('Token de acceso no recibido:', tokenData);
      return NextResponse.redirect(
        `${appUrl}/?tab=profile&google_calendar_auth=error&error=invalid_tokens`
      );
    }

    // Encriptar tokens antes de guardar
    const encryptedAccessToken = encrypt(access_token);
    const encryptedRefreshToken = refresh_token ? encrypt(refresh_token) : null;

    // Calcular fecha de expiración
    const expiresAt = expires_in 
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString(); // Default 1 hora

    // Guardar credenciales en la base de datos
    // Usar service role para evitar problemas con RLS
    const { getSupabaseAdmin } = await import('@/lib/config/db');
    const supabase = await getSupabaseAdmin();
    
    const { error: dbError } = await supabase
      .from('google_oauth_tokens')
      .upsert({
        coach_id: coachId,
        access_token: encryptedAccessToken, // Token encriptado
        refresh_token: encryptedRefreshToken, // Refresh token encriptado (si existe)
        expires_at: expiresAt,
        scope: scope || 'https://www.googleapis.com/auth/calendar',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'coach_id'
      });

    if (dbError) {
      console.error('❌ [Google OAuth Callback] Error guardando credenciales:', dbError);
      return NextResponse.redirect(
        `${appUrl}/?tab=profile&google_calendar_auth=error&error=db_error&details=${encodeURIComponent(dbError.message)}`
      );
    }

    console.log('✅ [Google OAuth Callback] Google Calendar conectado exitosamente para coach:', coachId);
    
    // Redirigir a la página de perfil con éxito
    return NextResponse.redirect(
      `${appUrl}/?tab=profile&google_calendar_auth=success`
    );

  } catch (error: any) {
    console.error('❌ [Google OAuth Callback] Error inesperado:', {
      error: error.message,
      stack: error.stack,
    });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://omnia-app.vercel.app';
    return NextResponse.redirect(
      `${appUrl}/?tab=profile&google_calendar_auth=error&error=internal_error&details=${encodeURIComponent(error.message)}`
    );
  }
}

