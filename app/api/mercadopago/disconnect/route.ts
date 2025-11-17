import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

/**
 * Endpoint para desvincular la cuenta de Mercado Pago del coach
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Usar service role para evitar problemas con RLS
    const { getSupabaseAdmin } = await import('@/lib/config/db');
    const adminSupabase = await getSupabaseAdmin();

    // Eliminar credenciales (o marcarlas como no autorizadas)
    const { error: deleteError } = await adminSupabase
      .from('coach_mercadopago_credentials')
      .update({
        oauth_authorized: false,
        access_token_encrypted: null,
        refresh_token_encrypted: null,
        token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('coach_id', user.id);

    if (deleteError) {
      console.error('Error desvinculando cuenta:', deleteError);
      return NextResponse.json({ 
        error: 'Error al desvincular cuenta',
        details: deleteError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Cuenta desvinculada correctamente',
    });

  } catch (error: any) {
    console.error('Error en POST /api/mercadopago/disconnect:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

