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
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    // 1. Intercambiar el código por un Short-Lived Token
    const formData = new FormData();
    formData.append('client_id', clientId!);
    formData.append('client_secret', clientSecret!);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', redirectUri!);
    formData.append('code', code);

    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: formData,
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Error obteniendo token:', tokenData.error);
      throw new Error(tokenData.error_message || 'Error al obtener token');
    }

    const shortLivedToken = tokenData.access_token;
    const instagramUserId = tokenData.user_id;

    // 2. Intercambiar por un Long-Lived Token (dura 60 días)
    const longLivedResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`
    );

    const longLivedData = await longLivedResponse.json();

    if (longLivedData.error) {
      console.error('Error obteniendo long-lived token:', longLivedData.error);
      throw new Error(longLivedData.error.message || 'Error al obtener long-lived token');
    }

    const longLivedToken = longLivedData.access_token;
    const expiresSeconds = longLivedData.expires_in; // Generalmente 5184000 (60 días)
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresSeconds);

    // 3. Encriptar el token y guardarlo en Supabase
    const encryptedToken = encrypt(longLivedToken);
    const supabase = await createRouteHandlerClient();
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No hay sesión de usuario activa');
    }

    const { error: updateError } = await supabase
      .from('coaches')
      .update({
        instagram_access_token: encryptedToken,
        instagram_user_id: instagramUserId.toString(),
        instagram_expires_at: expiresAt.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error actualizando coach en Supabase:', updateError);
      throw new Error('Error al guardar en base de datos');
    }

    // Redirigir de vuelta al perfil del coach
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/coach/profile?success=instagram_connected`);
  } catch (err: any) {
    console.error('Error en callback de Instagram:', err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/coach/profile?error=${encodeURIComponent(err.message)}`);
  }
}
