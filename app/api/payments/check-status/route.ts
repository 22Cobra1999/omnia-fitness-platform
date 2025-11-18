import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

/**
 * Endpoint para verificar el estado de un pago por preference_id
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const preferenceId = searchParams.get('preference_id');

    if (!preferenceId) {
      return NextResponse.json({ error: 'preference_id es requerido' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Buscar en banco por preference_id
    const { data: bancoRecord, error: bancoError } = await supabase
      .from('banco')
      .select('payment_status, mercadopago_status')
      .eq('mercadopago_preference_id', preferenceId)
      .maybeSingle();

    if (bancoError) {
      console.error('Error buscando pago:', bancoError);
      return NextResponse.json({ error: 'Error buscando pago' }, { status: 500 });
    }

    const completed = bancoRecord && (
      bancoRecord.payment_status === 'completed' || 
      bancoRecord.mercadopago_status === 'approved'
    );

    return NextResponse.json({
      completed,
      status: bancoRecord?.payment_status || 'pending',
      mercadopagoStatus: bancoRecord?.mercadopago_status || 'pending'
    });

  } catch (error: any) {
    console.error('Error en check-status:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

