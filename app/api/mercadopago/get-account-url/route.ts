import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { decrypt } from '@/lib/utils/encryption';

/**
 * Endpoint para obtener la URL de acceso directo a la cuenta de Mercado Pago del coach
 * Usa el access token del coach para generar un link seguro
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener credenciales del coach usando service role para leer tokens encriptados
    const { getSupabaseAdmin } = await import('@/lib/config/db');
    const adminSupabase = await getSupabaseAdmin();
    
    const { data: credentials, error: credError } = await adminSupabase
      .from('coach_mercadopago_credentials')
      .select('access_token_encrypted, mercadopago_user_id')
      .eq('coach_id', user.id)
      .eq('oauth_authorized', true)
      .maybeSingle();

    if (credError || !credentials || !credentials.access_token_encrypted) {
      return NextResponse.json({ 
        error: 'No hay cuenta conectada',
        details: 'El coach no tiene una cuenta de Mercado Pago conectada'
      }, { status: 404 });
    }

    // Desencriptar access token
    let accessToken: string;
    try {
      accessToken = decrypt(credentials.access_token_encrypted);
      if (!accessToken || accessToken.length === 0) {
        throw new Error('Token desencriptado está vacío');
      }
    } catch (decryptError: any) {
      console.error('Error desencriptando token:', decryptError);
      return NextResponse.json({ 
        error: 'Error al desencriptar el token',
        details: decryptError.message 
      }, { status: 500 });
    }

    // Obtener información del usuario para verificar que el token es válido
    const userInfoResponse = await fetch('https://api.mercadopago.com/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.json({ 
        error: 'Token inválido o expirado',
        details: 'El token de acceso no es válido. Por favor, desvincula y vuelve a vincular tu cuenta.'
      }, { status: 401 });
    }

    const userInfo = await userInfoResponse.json();
    
    // Mercado Pago no tiene una URL directa para acceder a una cuenta específica
    // La mejor opción es redirigir a la página de inicio con un parámetro que indique
    // que debe iniciar sesión, o usar el OAuth flow para forzar login con esa cuenta
    
    // Opción 1: Usar OAuth para forzar login con la cuenta específica
    // Esto requiere que el usuario autorice nuevamente, pero garantiza que use la cuenta correcta
    const clientId = process.env.MERCADOPAGO_CLIENT_ID?.trim();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const redirectUri = `${appUrl}/api/mercadopago/oauth/callback?return_to=account`;
    
    // Crear URL de autorización OAuth que fuerza login
    const authUrl = new URL('https://auth.mercadopago.com.ar/authorization');
    authUrl.searchParams.set('client_id', clientId || '');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('platform_id', 'mp');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', user.id);
    authUrl.searchParams.set('prompt', 'login');
    authUrl.searchParams.set('force_login', 'true');
    
    // Después de autorizar, redirigir a la página de inicio de Mercado Pago
    // Guardamos esto en un parámetro para que el callback lo use
    const finalRedirectUrl = `https://www.mercadopago.com.ar/home`;
    
    // Retornar la URL de autorización OAuth
    // El callback manejará la redirección final a la cuenta
    return NextResponse.json({
      success: true,
      accountUrl: authUrl.toString(),
      finalRedirectUrl: finalRedirectUrl,
      userId: credentials.mercadopago_user_id,
      userEmail: userInfo.email,
      // También retornar un link directo alternativo (aunque requiere login manual)
      directUrl: `https://www.mercadopago.com.ar/home?user_id=${credentials.mercadopago_user_id}`
    });

  } catch (error: any) {
    console.error('Error en get-account-url:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

