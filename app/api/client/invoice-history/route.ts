import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

/**
 * Endpoint para obtener el historial completo de facturas/compras del cliente
 * 
 * @route GET /api/client/invoice-history
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Obtener todas las compras del cliente desde banco
    const { data: purchases, error: purchasesError, count } = await supabase
      .from('banco')
      .select(`
        id,
        amount_paid,
        payment_status,
        payment_date,
        created_at,
        mercadopago_status,
        mercadopago_payment_id,
        mercadopago_preference_id,
        mercadopago_fee,
        marketplace_fee,
        seller_amount,
        currency,
        payment_method,
        external_reference,
        activities:activity_id (
          id,
          title,
          image_url,
          price,
          coach_id,
          coaches:coach_id (
            id,
            full_name
          )
        ),
        activity_enrollments:enrollment_id (
          id,
          status,
          created_at
        )
      `, { count: 'exact' })
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (purchasesError) {
      console.error('Error obteniendo historial de facturas:', purchasesError);
      return NextResponse.json(
        { error: 'Error obteniendo historial de facturas' },
        { status: 500 }
      );
    }

    // Formatear las compras
    const formattedPurchases = (purchases || []).map((purchase: any) => ({
      id: purchase.id,
      amount: purchase.amount_paid,
      status: purchase.payment_status || purchase.mercadopago_status || 'pending',
      paymentDate: purchase.payment_date || purchase.created_at,
      createdAt: purchase.created_at,
      paymentMethod: purchase.payment_method || 'mercadopago',
      currency: purchase.currency || 'ARS',
      mercadopagoPaymentId: purchase.mercadopago_payment_id,
      mercadopagoPreferenceId: purchase.mercadopago_preference_id,
      mercadopagoFee: purchase.mercadopago_fee,
      marketplaceFee: purchase.marketplace_fee,
      sellerAmount: purchase.seller_amount,
      externalReference: purchase.external_reference,
      activity: purchase.activities ? {
        id: purchase.activities.id,
        title: purchase.activities.title,
        imageUrl: purchase.activities.image_url,
        price: purchase.activities.price,
        coach: purchase.activities.coaches ? {
          id: purchase.activities.coaches.id,
          name: purchase.activities.coaches.full_name
        } : null
      } : null,
      enrollment: purchase.activity_enrollments ? {
        id: purchase.activity_enrollments.id,
        status: purchase.activity_enrollments.status,
        createdAt: purchase.activity_enrollments.created_at
      } : null
    }));

    // Calcular totales
    const totalAmount = formattedPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
    const completedPurchases = formattedPurchases.filter(p => 
      p.status === 'completed' || p.status === 'approved'
    ).length;

    return NextResponse.json({
      success: true,
      purchases: formattedPurchases,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      },
      summary: {
        totalPurchases: count || 0,
        completedPurchases,
        totalAmount
      }
    });

  } catch (error: any) {
    console.error('Error en invoice-history:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

