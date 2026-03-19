import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { encrypt } from '@/lib/utils/encryption';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Error de Instagram OAuth:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/coach/profile?error=instagram_auth_failed`);
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/coach/profile?error=no_code`);
  }

  try {
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const currentDomain = `${protocol}://${host}`;
    
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    
    // IMPORTANTE: El redirect_uri debe ser exactamente el mismo que se envió en el paso GET inicial
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${currentDomain}/api/auth/callback/instagram`;

    console.log('--- Iniciando Intercambio de Token Instagram ---');
    console.log('Host actual:', host);
    console.log('Redirect URI utilizado:', redirectUri);

    // 1. Intercambiar el código por un Short-Lived Token
    const formData = new FormData();
    formData.append('client_id', clientId!);
    formData.append('client_secret', clientSecret!);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', redirectUri);
    formData.append('code', code);

    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: formData,
    });

    const responseText = await tokenResponse.text();
    let tokenData;
    
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parseando respuesta cruda de Instagram:', responseText);
      throw new Error(`Error de formato en respuesta de Instagram: ${responseText.substring(0, 100)}`);
    }

    if (tokenData.error || !tokenResponse.ok) {
      console.error('Error de Instagram API:', tokenData.error || tokenData);
      const msg = tokenData.error_message || tokenData.error?.message || 'Error en el intercambio de código';
      throw new Error(msg);
    }

    const shortLivedToken = tokenData.access_token;
    const instagramUserId = tokenData.user_id;

    console.log('Token de vida corta obtenido para el usuario:', instagramUserId);

    // 2. Intercambiar por un Long-Lived Token (dura 60 días)
    const longLivedResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`
    );

    const longLivedData = await longLivedResponse.json();

    if (longLivedData.error) {
      console.error('Error de Instagram en el long-lived token:', longLivedData.error);
      throw new Error(longLivedData.error.message || 'Error al extender el token');
    }

    const longLivedToken = longLivedData.access_token;
    const expiresSeconds = longLivedData.expires_in;
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (expiresSeconds || 5184000));

    // 2.5 OBTENER EL USERNAME REAL DE INSTAGRAM (NUEVO)
    const meResponse = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=username,id&access_token=${longLivedToken}`
    );
    const meData = await meResponse.json();
    const username = meData.username || instagramUserId.toString();

    console.log('Instagram @username obtenido:', username);

    // 3. Obtener sesión y guardar en Supabase
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('CRÍTICO: No se encontró sesión de usuario en el callback. ¿Cambio de dominio?');
      throw new Error('Sesión perdida. Por favor, asegúrate de iniciar sesión en el mismo dominio de producción.');
    }

    const encryptedToken = encrypt(longLivedToken);
    
    const { error: updateError } = await supabase
      .from('coaches')
      .update({
        instagram_access_token: encryptedToken,
        instagram_user_id: instagramUserId.toString(),
        instagram_username: username, // AHORA GUARDAMOS EL NOMBRE REAL
        instagram_expires_at: expiresAt.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error de base de datos guardando el token:', updateError);
      throw new Error('No se pudo guardar la conexión en tu base de datos.');
    }

    console.log('Instagram conectado con éxito para:', user.id);

    // REDIRIGIR AL HOME CON TAB PERFIL PARA EVITAR EL 404
    return NextResponse.redirect(`${currentDomain}/?tab=profile&success=instagram_connected#_`);
  } catch (err: any) {
    console.error('--- FALLO TOTAL EN CALLBACK INSTAGRAM ---');
    console.error(err);
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    return NextResponse.redirect(`${protocol}://${host}/?tab=profile&error=${encodeURIComponent(err.message)}`);
  }
}
