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
      console.error('❌ Error de autenticación:', authError);
      return NextResponse.json({ 
        success: false,
        error: 'No autenticado',
        details: authError?.message || 'Usuario no autenticado'
      }, { status: 401 });
    }

    console.log('Desvinculando cuenta de Mercado Pago para coach:', user.id);

    // Usar service role para evitar problemas con RLS
    let adminSupabase;
    try {
      const { getSupabaseAdmin } = await import('@/lib/config/db');
      adminSupabase = await getSupabaseAdmin();
      
      if (!adminSupabase) {
        throw new Error('No se pudo obtener el cliente de Supabase admin');
      }
    } catch (importError: any) {
      console.error('❌ Error importando getSupabaseAdmin:', importError);
      return NextResponse.json({ 
        success: false,
        error: 'Error de configuración del servidor',
        details: importError.message 
      }, { status: 500 });
    }

    // Verificar que existe un registro antes de actualizar
    const { data: existingCredentials, error: checkError } = await adminSupabase
      .from('coach_mercadopago_credentials')
      .select('id, oauth_authorized')
      .eq('coach_id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error verificando credenciales existentes:', checkError);
      return NextResponse.json({ 
        success: false,
        error: 'Error al verificar credenciales',
        details: checkError.message 
      }, { status: 500 });
    }

    if (!existingCredentials) {
      console.log('No hay credenciales para desvincular');
      return NextResponse.json({
        success: true,
        message: 'No había cuenta vinculada',
      });
    }

    // Actualizar credenciales (marcarlas como no autorizadas)
    // Nota: No podemos establecer access_token_encrypted como null porque tiene restricción NOT NULL
    // En su lugar, solo marcamos oauth_authorized como false
    const { data: updatedData, error: updateError } = await adminSupabase
      .from('coach_mercadopago_credentials')
      .update({
        oauth_authorized: false,
        token_expires_at: null, // Podemos establecer esto como null porque no tiene restricción NOT NULL
        updated_at: new Date().toISOString(),
      })
      .eq('coach_id', user.id)
      .select();

    if (updateError) {
      console.error('❌ Error actualizando credenciales:', updateError);
      console.error('❌ Detalles del error:', JSON.stringify(updateError, null, 2));
      console.error('❌ Código de error:', updateError.code);
      console.error('❌ Mensaje:', updateError.message);
      console.error('❌ Detalles:', updateError.details);
      
      // Intentar obtener más información sobre el error
      const errorDetails = {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      };
      
      return NextResponse.json({ 
        success: false,
        error: 'Error al desvincular cuenta',
        details: updateError.message || 'Error desconocido al actualizar las credenciales',
        code: updateError.code || 'UPDATE_ERROR',
        debug: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      }, { status: 500 });
    }

    console.log('✅ Cuenta desvinculada correctamente:', updatedData);

    return NextResponse.json({
      success: true,
      message: 'Cuenta desvinculada correctamente',
      data: updatedData
    });

  } catch (error: any) {
    console.error('❌ Error en POST /api/mercadopago/disconnect:', error);
    console.error('❌ Stack trace:', error.stack);
    return NextResponse.json({ 
      success: false,
      error: 'Error interno del servidor',
      details: error.message || 'Error desconocido'
    }, { status: 500 });
  }
}

