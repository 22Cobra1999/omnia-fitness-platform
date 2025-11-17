import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { decrypt } from '@/lib/utils/encryption';

/**
 * Endpoint para obtener información del usuario de Mercado Pago
 * Usa el access_token del coach para obtener sus datos
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar que la clave de encriptación esté configurada
    if (!process.env.ENCRYPTION_KEY) {
      console.error('ENCRYPTION_KEY no está configurada');
      return NextResponse.json({ 
        error: 'Configuración de encriptación faltante',
        details: 'ENCRYPTION_KEY no está configurada en las variables de entorno'
      }, { status: 500 });
    }

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

    // Validar que el token encriptado tenga el formato correcto
    if (typeof credentials.access_token_encrypted !== 'string' || credentials.access_token_encrypted.length === 0) {
      console.error('Token encriptado inválido:', credentials.access_token_encrypted);
      return NextResponse.json({ error: 'Token encriptado inválido' }, { status: 500 });
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
      console.error('Token encriptado (primeros 50 chars):', credentials.access_token_encrypted.substring(0, 50));
      
      // Si el error es de autenticación GCM, el token fue encriptado con otra clave
      if (decryptError.message?.includes('unable to authenticate') || 
          decryptError.message?.includes('Unsupported state')) {
        return NextResponse.json({ 
          error: 'Token encriptado con clave diferente',
          code: 'ENCRYPTION_KEY_MISMATCH',
          details: 'El token fue encriptado con una clave diferente. Por favor, desvincula y vuelve a vincular tu cuenta.',
          mercadopago_user_id: credentials.mercadopago_user_id
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'Error al desencriptar el token',
        details: decryptError.message 
      }, { status: 500 });
    }

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
    
    console.log('Información de usuario MP recibida:', {
      id: userInfo.id,
      nickname: userInfo.nickname,
      email: userInfo.email,
      first_name: userInfo.first_name,
      last_name: userInfo.last_name,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userInfo.id,
        nickname: userInfo.nickname || null,
        email: userInfo.email || null,
        first_name: userInfo.first_name || null,
        last_name: userInfo.last_name || null,
        country_id: userInfo.country_id || null,
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

