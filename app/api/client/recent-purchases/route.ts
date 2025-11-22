import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

/**
 * Endpoint para obtener compras recientes del cliente
 * 
 * @route GET /api/client/recent-purchases
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    // Obtener compras recientes del cliente desde banco
    const { data: purchases, error: purchasesError } = await supabase
      .from('banco')
      .select(`
        id,
        amount_paid,
        payment_status,
        payment_date,
        created_at,
        mercadopago_status,
        activities:activity_id (
          id,
          title,
          image_url,
          price
        )
      `)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (purchasesError) {
      console.error('Error obteniendo compras:', purchasesError);
      return NextResponse.json(
        { error: 'Error obteniendo compras' },
        { status: 500 }
      );
    }

    // Formatear las compras
    const formattedPurchases = (purchases || []).map((purchase: any) => ({
      id: purchase.id,
      amount: purchase.amount_paid,
      status: purchase.payment_status || purchase.mercadopago_status || 'pending',
      paymentDate: purchase.payment_date || purchase.created_at,
      activity: purchase.activities ? {
        id: purchase.activities.id,
        title: purchase.activities.title,
        imageUrl: purchase.activities.image_url,
        price: purchase.activities.price
      } : null
    }));

    return NextResponse.json({
      success: true,
      purchases: formattedPurchases
    });

  } catch (error: any) {
    console.error('Error en recent-purchases:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

