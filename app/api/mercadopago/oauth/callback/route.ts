import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { encrypt } from '@/lib/utils/encryption';

/**
 * Callback de OAuth de Mercado Pago
 * Intercambia el código de autorización por access_token y refresh_token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Contiene el coach_id
    const error = searchParams.get('error');

    // Si hay un error, redirigir con mensaje
    if (error) {
      console.error('Error en OAuth callback:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/coach/settings?mp_auth=error&error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/coach/settings?mp_auth=error&error=missing_params`
      );
    }

    const coachId = state;
    const clientId = process.env.MERCADOPAGO_CLIENT_ID;
    const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI || 
                       `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/oauth/callback`;

    if (!clientId || !clientSecret) {
      console.error('Credenciales de Mercado Pago no configuradas');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/coach/settings?mp_auth=error&error=config_error`
      );
    }

    // Intercambiar código por tokens
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Error intercambiando código por token:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/coach/settings?mp_auth=error&error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, user_id, expires_in } = tokenData;

    if (!access_token || !user_id) {
      console.error('Tokens incompletos recibidos:', tokenData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/coach/settings?mp_auth=error&error=invalid_tokens`
      );
    }

    // Encriptar tokens antes de guardar
    const encryptedAccessToken = encrypt(access_token);
    const encryptedRefreshToken = refresh_token ? encrypt(refresh_token) : null;

    // Calcular fecha de expiración
    const expiresAt = expires_in 
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null;

    // Guardar credenciales en la base de datos
    // Usar service role para evitar problemas con RLS
    const { getSupabaseAdmin } = await import('@/lib/config/db');
    const supabase = await getSupabaseAdmin();
    
    const { error: dbError } = await supabase
      .from('coach_mercadopago_credentials')
      .upsert({
        coach_id: coachId,
        mercadopago_user_id: user_id.toString(),
        access_token_encrypted: encryptedAccessToken,
        refresh_token_encrypted: encryptedRefreshToken,
        token_expires_at: expiresAt,
        oauth_authorized: true,
        oauth_authorized_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'coach_id'
      });

    if (dbError) {
      console.error('Error guardando credenciales:', dbError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/coach/settings?mp_auth=error&error=db_error`
      );
    }

    // Redirigir a la página de configuración con éxito
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/coach/settings?mp_auth=success`
    );

  } catch (error: any) {
    console.error('Error en OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/coach/settings?mp_auth=error&error=internal_error`
    );
  }
}






