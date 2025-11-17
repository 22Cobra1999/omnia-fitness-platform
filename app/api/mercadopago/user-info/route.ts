import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { decrypt } from '@/lib/utils/encryption';

/**
 * Endpoint para obtener información del usuario de Mercado Pago
 * Usa el access_token del coach para obtener sus datos
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
      return NextResponse.json({ error: 'No hay cuenta conectada' }, { status: 404 });
    }

    // Desencriptar access token
    const accessToken = decrypt(credentials.access_token_encrypted);

    // Obtener información del usuario desde Mercado Pago
    const userInfoResponse = await fetch('https://api.mercadopago.com/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.json();
      console.error('Error obteniendo info de usuario MP:', errorData);
      return NextResponse.json({ 
        error: 'Error al obtener información del usuario',
        details: errorData 
      }, { status: userInfoResponse.status });
    }

    const userInfo = await userInfoResponse.json();

    return NextResponse.json({
      success: true,
      user: {
        id: userInfo.id,
        nickname: userInfo.nickname,
        email: userInfo.email,
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        country_id: userInfo.country_id,
      },
      mercadopago_user_id: credentials.mercadopago_user_id,
    });

  } catch (error: any) {
    console.error('Error en GET /api/mercadopago/user-info:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

