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
    const returnUrl = searchParams.get('return_url'); // Si viene este parámetro, devolver JSON en lugar de redirect

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
    // Primero hacer logout para limpiar sesión, luego redirigir a login
    const stateWithTimestamp = `${coachId}_${Date.now()}`;
    
    // URL de autorización con todos los parámetros para forzar login
    const authUrl = new URL('https://auth.mercadopago.com/authorization');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('platform_id', 'mp');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', stateWithTimestamp);
    
    // Forzar pantalla de login siempre - múltiples parámetros para asegurar
    // prompt=login: fuerza mostrar la pantalla de login incluso si hay sesión activa
    authUrl.searchParams.set('prompt', 'login');
    
    // force_login: fuerza mostrar la pantalla de login incluso si hay sesión activa
    authUrl.searchParams.set('force_login', 'true');
    
    // Agregar parámetro de no-cache para evitar reutilización de sesión
    authUrl.searchParams.set('_', Date.now().toString());
    
    // Primero hacer logout para limpiar cualquier sesión existente
    // Luego redirigir a la página de autorización
    const logoutUrl = new URL('https://auth.mercadopago.com/logout');
    logoutUrl.searchParams.set('redirect_uri', authUrl.toString());
    
    const finalAuthUrl = logoutUrl.toString();
    console.log('🔗 URL de autorización de Mercado Pago:', finalAuthUrl);
    console.log('📋 Parámetros:', {
      clientId,
      redirectUri,
      coachId,
      appUrl,
      returnUrl
    });

    // Si se solicita la URL (para popup), devolver JSON en lugar de redirect
    if (returnUrl === 'true') {
      return NextResponse.json({ 
        authUrl: finalAuthUrl 
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

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






