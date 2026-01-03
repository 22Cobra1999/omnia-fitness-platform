import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

/**
 * Endpoint para obtener facturación del coach
 * Retorna ingresos, ganancias (sin comisión ni fee del plan), y lista de facturas
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM
    const year = searchParams.get('year'); // YYYY

    const supabase = await createRouteHandlerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener plan del coach para calcular fee
    // Intentar primero con coach_plans, luego con planes_uso_coach
    let { data: planData } = await supabase
      .from('coach_plans')
      .select('plan_type')
      .eq('coach_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!planData) {
      // Si no existe en coach_plans, buscar en planes_uso_coach
      const { data: planDataAlt } = await supabase
        .from('planes_uso_coach')
        .select('plan_type')
        .eq('coach_id', user.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      planData = planDataAlt;
    }

    const planType = planData?.plan_type || 'free';
    const planFees: Record<string, number> = {
      free: 0,
      basico: 12000,
      black: 22000,
      premium: 35000
    };
    const planFee = planFees[planType] || 0;

    // Obtener comisión según el plan
    const commissionRates: Record<string, number> = {
      free: 0.08,
      basico: 0.08,
      black: 0.06,
      premium: 0.05
    };
    const commissionRate = commissionRates[planType] || 0.08;

    // Obtener actividades del coach
    const { data: activities } = await supabase
      .from('activities')
      .select('id, coach_id')
      .eq('coach_id', user.id);

    // Construir filtro de fecha primero (necesario para suscripciones)
    const now = new Date();
    let targetMonth: number;
    let targetYear: number;
    
    if (month) {
      // month viene como "YYYY-MM"
      const parts = month.split('-');
      targetYear = parseInt(parts[0]);
      targetMonth = parseInt(parts[1]);
    } else {
      targetMonth = now.getMonth() + 1;
      targetYear = now.getFullYear();
    }
    
    if (year) {
      targetYear = parseInt(year);
    }
    
    // Validar que el mes y año sean válidos
    if (isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12) {
      return NextResponse.json({ error: 'Mes inválido' }, { status: 400 });
    }
    
    if (isNaN(targetYear) || targetYear < 2000 || targetYear > 2100) {
      return NextResponse.json({ error: 'Año inválido' }, { status: 400 });
    }
    
    const startDate = new Date(targetYear, targetMonth - 1, 1).toISOString();
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59).toISOString();

    // Obtener suscripciones de planes del mes (siempre, incluso si no hay ventas)
    let planSubscriptionsList: Array<{id: string, date: string, planType: string, amount: number}> = [];
    try {
      const { data: planSubscriptions, error: planSubsError } = await supabase
        .from('planes_uso_coach')
        .select('id, plan_type, started_at, created_at')
        .eq('coach_id', user.id)
        .gte('started_at', startDate)
        .lte('started_at', endDate)
        .order('started_at', { ascending: false });

      if (!planSubsError && planSubscriptions) {
        planSubscriptionsList = planSubscriptions.map((sub: any) => ({
          id: sub.id,
          date: sub.started_at || sub.created_at,
          planType: sub.plan_type,
          amount: planFees[sub.plan_type] || 0
        }));
      }
    } catch (error) {
      console.error('Error obteniendo suscripciones de planes:', error);
      // Continuar sin suscripciones si hay error
    }

    if (!activities || activities.length === 0) {
      return NextResponse.json({
        success: true,
        month: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
        totalIncome: 0,
        totalCommission: 0,
        planFee: planFee,
        earnings: 0,
        invoices: [],
        planSubscriptions: planSubscriptionsList
      });
    }

    const activityIds = activities.map((a: any) => a.id);

    // Obtener enrollments
    const { data: enrollments } = await supabase
      .from('activity_enrollments')
      .select('id, activity_id, created_at')
      .in('activity_id', activityIds);

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        success: true,
        month: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
        totalIncome: 0,
        totalCommission: 0,
        planFee: planFee,
        earnings: 0,
        invoices: [],
        planSubscriptions: planSubscriptionsList
      });
    }

    const enrollmentIds = enrollments.map((e: any) => e.id);

    // Obtener pagos del mes
    const { data: payments, error: paymentsError } = await supabase
      .from('banco')
      .select(`
        id,
        enrollment_id,
        amount_paid,
        seller_amount,
        marketplace_fee,
        payment_status,
        payment_date,
        created_at,
        activity_enrollments!inner(
          activity_id,
          activities!activity_enrollments_activity_id_fkey!inner(
            id,
            title,
            price,
            type,
            categoria
          )
        )
      `)
      .in('enrollment_id', enrollmentIds)
      .eq('payment_status', 'completed')
      .gte('payment_date', startDate)
      .lte('payment_date', endDate)
      .order('payment_date', { ascending: false });

    if (paymentsError) {
      console.error('Error obteniendo pagos:', paymentsError);
      return NextResponse.json({
        success: true,
        month: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
        totalIncome: 0,
        totalCommission: 0,
        planFee,
        earnings: 0,
        invoices: [],
        planSubscriptions: planSubscriptionsList,
        planType,
        warning: 'Error obteniendo pagos'
      });
    }

    // Calcular totales
    let totalIncome = 0;
    let totalCommission = 0;

    const salesBreakdown = {
      programs: 0,
      workshops: 0,
      documents: 0,
      consultations: 0,
    };

    const invoices = (payments || []).map((payment: any) => {
      const amount = parseFloat(payment.amount_paid?.toString() || '0');
      const commission = parseFloat(payment.marketplace_fee?.toString() || '0') || (amount * commissionRate);
      const sellerAmount = parseFloat(payment.seller_amount?.toString() || '0') || (amount - commission);

      totalIncome += amount;
      totalCommission += commission;

      const activity = payment.activity_enrollments?.activities;
      const activityType = String(activity?.type || '').toLowerCase();
      const activityCategory = String(activity?.categoria || '').toLowerCase();
      const normalized = activityCategory || activityType;
      if (normalized.includes('program')) {
        salesBreakdown.programs += sellerAmount;
      } else if (normalized.includes('workshop') || normalized.includes('taller')) {
        salesBreakdown.workshops += sellerAmount;
      } else if (normalized.includes('document') || normalized.includes('doc')) {
        salesBreakdown.documents += sellerAmount;
      } else if (normalized.includes('consult')) {
        salesBreakdown.consultations += sellerAmount;
      }

      return {
        id: payment.id,
        date: payment.payment_date || payment.created_at,
        concept: payment.activity_enrollments?.activities?.title || 'Actividad',
        amount: amount,
        commission: commission,
        sellerAmount: sellerAmount,
        enrollmentId: payment.enrollment_id
      };
    });

    // Ganancia neta del coach (por ventas/enrollments) sin incluir fee del plan.
    // El fee del plan se expone por separado como gasto/abono mensual.
    const earnings = totalIncome - totalCommission;

    return NextResponse.json({
      success: true,
      month: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
      totalIncome,
      totalCommission,
      planFee,
      earnings,
      invoices,
      planSubscriptions: planSubscriptionsList,
      salesBreakdown,
      planType
    });

  } catch (error: any) {
    console.error('❌ [Billing] Error en billing endpoint:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error procesando facturación'
    }, { status: 500 });
  }
}

