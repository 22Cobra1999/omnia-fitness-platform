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
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim();
    const redirectUri = process.env.NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI?.trim() || 
                       `${appUrl}/api/mercadopago/oauth/callback`;

    if (!clientId) {
        return NextResponse.json({ error: 'MERCADOPAGO_CLIENT_ID no configurado' }, { status: 500 });
    }

    if (!redirectUri) {
      return NextResponse.json({ error: 'Redirect URI no configurado' }, { status: 500 });
    }

    // Construir URL de autorización de Mercado Pago
    // Usar timestamp único para evitar reutilización de sesión
    const stateWithTimestamp = `${coachId}_${Date.now()}`;
    const timestamp = Date.now();
    
    // URL de autorización con todos los parámetros para forzar login
    // Usar auth.mercadopago.com.ar para Argentina
    const authUrl = new URL('https://auth.mercadopago.com.ar/authorization');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('platform_id', 'mp');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', stateWithTimestamp);
    
    // Forzar pantalla de login siempre
    // prompt=login: estándar OIDC para forzar login
    authUrl.searchParams.set('prompt', 'login');
    
    // force_login=true: específico de Mercado Pago para forzar login
    authUrl.searchParams.set('force_login', 'true');
    
    // approval_prompt=force: para requerir autorización incluso si ya se dio antes
    authUrl.searchParams.set('approval_prompt', 'force');
    
    // select_account=true: ayuda a que el usuario pueda elegir otra cuenta
    authUrl.searchParams.set('select_account', 'true');
    
    // Cache busting y sesión única
    authUrl.searchParams.set('_', timestamp.toString());
    authUrl.searchParams.set('session_id', `omnia_${timestamp}`);
    authUrl.searchParams.set('max_age', '0');

    const finalAuthUrl = authUrl.toString();
    console.log('🔗 URL de autorización limpia:', finalAuthUrl);

    // Si se solicita la URL (para popup), devolver JSON en lugar de redirect
    if (returnUrl === 'true') {
      return NextResponse.json({ 
        authUrl: finalAuthUrl 
      });
    }

    // Redirigir directamente a la autorización limpia
    return NextResponse.redirect(finalAuthUrl);

  } catch (error: any) {
    console.error('Error en OAuth authorize:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}






