import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

/**
 * Endpoint para iniciar el flujo OAuth de Mercado Pago
 * Redirige al coach a Mercado Pago para autorizar a OMNIA
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coach_id');

    if (!coachId) {
      return NextResponse.json({ error: 'coach_id es requerido' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el coach_id coincida con el usuario autenticado
    if (session.user.id !== coachId) {
      return NextResponse.json({ error: 'No autorizado para este coach' }, { status: 403 });
    }

    const clientId = process.env.MERCADOPAGO_CLIENT_ID?.trim();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const redirectUri = process.env.NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI?.trim() || 
                       `${appUrl}/api/mercadopago/oauth/callback`;

    if (!clientId) {
      return NextResponse.json({ error: 'MERCADOPAGO_CLIENT_ID no configurado' }, { status: 500 });
    }

    if (!redirectUri) {
      return NextResponse.json({ error: 'Redirect URI no configurado' }, { status: 500 });
    }

    // Construir URL de autorización de Mercado Pago
    const authUrl = new URL('https://auth.mercadopago.com.ar/authorization');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('platform_id', 'mp');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', coachId); // Pasar coach_id en el state
    
    // Forzar pantalla de login/selección de cuenta
    // prompt=login: fuerza al usuario a iniciar sesión nuevamente
    // Esto asegura que el usuario pueda elegir con qué cuenta conectarse
    // Si Mercado Pago no soporta 'prompt', también intentamos con 'force_login'
    authUrl.searchParams.set('prompt', 'login');
    
    // Parámetro adicional para asegurar que se muestre la pantalla de selección
    // Algunos proveedores OAuth usan este parámetro para forzar login
    authUrl.searchParams.set('force_login', 'true');

    const finalAuthUrl = authUrl.toString();
    console.log('🔗 Redirigiendo a Mercado Pago:', finalAuthUrl);
    console.log('📋 Parámetros:', {
      clientId,
      redirectUri,
      coachId,
      appUrl
    });

    // Redirigir a Mercado Pago con headers explícitos
    // Usar 307 (Temporary Redirect) para mantener el método GET
    return NextResponse.redirect(finalAuthUrl, {
      status: 307,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Location': finalAuthUrl
      }
    });

  } catch (error: any) {
    console.error('Error en OAuth authorize:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}






