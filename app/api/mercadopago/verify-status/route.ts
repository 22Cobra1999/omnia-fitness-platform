import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { getSupabaseAdmin } from '@/lib/config/db';

/**
 * Endpoint temporal para verificar el estado de las credenciales de Mercado Pago en la BD
 * Usa service role para verificar el estado real sin restricciones RLS
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Usar service role para verificar el estado real en la BD
    const adminSupabase = await getSupabaseAdmin();

    const { data: credentials, error: dbError } = await adminSupabase
      .from('coach_mercadopago_credentials')
      .select('id, coach_id, mercadopago_user_id, oauth_authorized, oauth_authorized_at, token_expires_at, created_at, updated_at')
      .eq('coach_id', user.id)
      .maybeSingle();

    if (dbError) {
      console.error('Error consultando credenciales:', dbError);
      return NextResponse.json({ 
        error: 'Error consultando credenciales',
        details: dbError.message 
      }, { status: 500 });
    }

    if (!credentials) {
      return NextResponse.json({
        success: true,
        message: 'No hay credenciales en la base de datos',
        credentials: null
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Estado de credenciales obtenido',
      credentials: {
        id: credentials.id,
        coach_id: credentials.coach_id,
        mercadopago_user_id: credentials.mercadopago_user_id,
        oauth_authorized: credentials.oauth_authorized,
        oauth_authorized_at: credentials.oauth_authorized_at,
        token_expires_at: credentials.token_expires_at,
        created_at: credentials.created_at,
        updated_at: credentials.updated_at,
        // Información sobre el estado
        is_connected: credentials.oauth_authorized === true,
        has_token: !!credentials.token_expires_at,
      }
    });

  } catch (error: any) {
    console.error('Error en GET /api/mercadopago/verify-status:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

