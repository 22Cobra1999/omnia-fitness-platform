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
    const limit = parseInt(searchParams.get('limit') || '10');

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
        activity_id
      `)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (purchasesError) {
      console.error('Error obteniendo compras:', purchasesError);
      return NextResponse.json(
        { error: 'Error obteniendo compras', details: purchasesError.message },
        { status: 500 }
      );
    }

    // Obtener información de actividades por separado si hay activity_ids
    const activityIds = (purchases || [])
      .map((p: any) => p.activity_id)
      .filter((id: any) => id != null);
    
    let activitiesMap: Record<number, any> = {};
    
    if (activityIds.length > 0) {
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('id, title, image_url, price')
        .in('id', activityIds);
      
      if (!activitiesError && activities) {
        activities.forEach((activity: any) => {
          activitiesMap[activity.id] = activity;
        });
      }
    }

    // Formatear las compras
    const formattedPurchases = (purchases || []).map((purchase: any) => {
      const activity = purchase.activity_id && activitiesMap[purchase.activity_id]
        ? {
            id: activitiesMap[purchase.activity_id].id,
            title: activitiesMap[purchase.activity_id].title,
            imageUrl: activitiesMap[purchase.activity_id].image_url,
            price: activitiesMap[purchase.activity_id].price
          }
        : null;
      
      return {
        id: purchase.id,
        amount: purchase.amount_paid,
        status: purchase.payment_status || purchase.mercadopago_status || 'pending',
        paymentDate: purchase.payment_date || purchase.created_at,
        activity
      };
    });

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

