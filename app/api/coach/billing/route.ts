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
    const { data: planData } = await supabase
      .from('coach_plans')
      .select('plan_type')
      .eq('coach_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

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

    if (!activities || activities.length === 0) {
      return NextResponse.json({
        success: true,
        month: month || new Date().toISOString().slice(0, 7),
        totalIncome: 0,
        totalCommission: 0,
        planFee: planFee,
        earnings: 0,
        invoices: []
      });
    }

    const activityIds = activities.map(a => a.id);

    // Obtener enrollments
    const { data: enrollments } = await supabase
      .from('activity_enrollments')
      .select('id, activity_id, created_at')
      .in('activity_id', activityIds);

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        success: true,
        month: month || new Date().toISOString().slice(0, 7),
        totalIncome: 0,
        totalCommission: 0,
        planFee: planFee,
        earnings: 0,
        invoices: []
      });
    }

    const enrollmentIds = enrollments.map(e => e.id);

    // Construir filtro de fecha
    const now = new Date();
    const targetMonth = month ? parseInt(month.split('-')[1]) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();
    const startDate = new Date(targetYear, targetMonth - 1, 1).toISOString();
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59).toISOString();

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
          activities!inner(
            id,
            title,
            price
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
      return NextResponse.json({ error: 'Error obteniendo pagos' }, { status: 500 });
    }

    // Calcular totales
    let totalIncome = 0;
    let totalCommission = 0;

    const invoices = (payments || []).map((payment: any) => {
      const amount = parseFloat(payment.amount_paid?.toString() || '0');
      const commission = parseFloat(payment.marketplace_fee?.toString() || '0') || (amount * commissionRate);
      const sellerAmount = parseFloat(payment.seller_amount?.toString() || '0') || (amount - commission);

      totalIncome += amount;
      totalCommission += commission;

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

    const earnings = totalIncome - totalCommission - planFee;

    return NextResponse.json({
      success: true,
      month: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
      totalIncome,
      totalCommission,
      planFee,
      earnings,
      invoices,
      planType
    });

  } catch (error: any) {
    console.error('Error en billing endpoint:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

