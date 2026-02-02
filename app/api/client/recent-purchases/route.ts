import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

/**
 * Endpoint para obtener compras recientes del cliente (Versión Robusta con Mapeo Manual)
 * Evita joins complejos que pueden fallar por configuración de RLS o FKs.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // 1. Obtener registros de la tabla banco (Query simple, siempre funciona)
    const { data: purchases, error: purchasesError } = await supabase
      .from('banco')
      .select(`
        id, amount_paid, payment_status, payment_date, created_at, 
        mercadopago_status, activity_id, enrollment_id, external_reference, concept
      `)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (purchasesError) {
      console.error('❌ [API] Error obteniendo banco:', purchasesError);
      return NextResponse.json({ success: false, error: 'Error al obtener transacciones' }, { status: 500 });
    }

    if (!purchases || purchases.length === 0) {
      return NextResponse.json({ success: true, purchases: [] });
    }

    // 2. Colectar IDs para búsquedas secundarias
    const directActivityIds = purchases.map(p => p.activity_id).filter(Boolean);
    const enrollmentIds = purchases.map(p => p.enrollment_id).filter(Boolean);

    let activitiesMap: Record<string, any> = {};

    // 3. Buscar actividades vinculadas directamente
    if (directActivityIds.length > 0) {
      const { data: directActs } = await supabase
        .from('activities')
        .select('id, title, image_url, price, type, categoria')
        .in('id', directActivityIds);

      directActs?.forEach(a => { activitiesMap[a.id] = a; });
    }

    // 4. Buscar actividades vinculadas por inscripciones (enrollments)
    if (enrollmentIds.length > 0) {
      const { data: enrollments } = await supabase
        .from('activity_enrollments')
        .select(`
          id,
          activity:activities!activity_enrollments_activity_id_fkey (
            id, title, image_url, price, type, categoria
          )
        `)
        .in('id', enrollmentIds);

      enrollments?.forEach((e: any) => {
        if (e.activity) {
          activitiesMap[`enr_${e.id}`] = e.activity;
        }
      });
    }

    // 5. Formatear y Unir todo en memoria
    const formattedPurchases = purchases.map((p: any) => {
      // Prioridad: actividad directa -> actividad vía enrollment -> fallback
      const activityData = activitiesMap[p.activity_id] || activitiesMap[`enr_${p.enrollment_id}`];

      return {
        id: p.id,
        amount: p.amount_paid,
        status: p.payment_status || p.mercadopago_status || 'pending',
        paymentDate: p.payment_date || p.created_at,
        concept: p.concept,
        activity: activityData ? {
          id: activityData.id,
          title: activityData.title,
          imageUrl: activityData.image_url,
          price: activityData.price,
          type: activityData.type,
          category: activityData.categoria
        } : {
          id: null,
          title: p.concept || (p.external_reference?.includes('_') ? p.external_reference.split('_')[1] : 'Actividad'),
          type: null,
          category: null
        }
      };
    });

    console.log(`✅ [API] Compras procesadas para ${user.id}: ${formattedPurchases.length}`);

    return NextResponse.json({
      success: true,
      purchases: formattedPurchases
    });

  } catch (error: any) {
    console.error('💥 Error crítico en recent-purchases:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
