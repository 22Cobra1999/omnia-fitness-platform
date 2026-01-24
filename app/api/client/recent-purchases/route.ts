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
        activity_id,
        enrollment_id
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
    const enrollmentIds = (purchases || [])
      .map((p: any) => p.enrollment_id)
      .filter((id: any) => id != null);

    const activityIds = (purchases || [])
      .map((p: any) => p.activity_id)
      .filter((id: any) => id != null);

    let activitiesMap: Record<number, any> = {};
    let enrollmentToActivityMap: Record<number, any> = {};

    // First, try to get activities directly linked to purchases
    if (activityIds.length > 0) {
      const { data: directActivities } = await supabase
        .from('activities')
        .select('id, title, image_url, price')
        .in('id', activityIds);

      if (directActivities) {
        directActivities.forEach((activity: any) => {
          activitiesMap[activity.id] = activity;
        });
      }
    }

    // Second, for those with enrollment_id, fetch activity info via enrollment
    if (enrollmentIds.length > 0) {
      const { data: enrollmentsWithActivity } = await supabase
        .from('activity_enrollments')
        .select(`
          id,
          activity:activities!activity_enrollments_activity_id_fkey (
            id, title, image_url, price
          )
        `)
        .in('id', enrollmentIds);

      if (enrollmentsWithActivity) {
        enrollmentsWithActivity.forEach((e: any) => {
          if (e.activity) {
            enrollmentToActivityMap[e.id] = e.activity;
            if (!activitiesMap[e.activity.id]) {
              activitiesMap[e.activity.id] = e.activity;
            }
          }
        });
      }
    }

    // Formatear las compras
    const formattedPurchases = (purchases || []).map((purchase: any) => {
      // Find activity either by activity_id or through enrollment_id lookup
      let activityData = null;
      if (purchase.activity_id && activitiesMap[purchase.activity_id]) {
        activityData = activitiesMap[purchase.activity_id];
      } else if (purchase.enrollment_id && enrollmentToActivityMap[purchase.enrollment_id]) {
        activityData = enrollmentToActivityMap[purchase.enrollment_id];
      }

      const activity = activityData
        ? {
          id: activityData.id,
          title: activityData.title,
          imageUrl: activityData.image_url,
          price: activityData.price
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

