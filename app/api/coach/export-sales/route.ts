import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

/**
 * Endpoint para exportar detalle de ventas en PDF o Excel
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'excel'; // 'excel' o 'pdf'
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const supabase = await createRouteHandlerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener plan del coach
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
      .select('id')
      .eq('coach_id', user.id);

    if (!activities || activities.length === 0) {
      return NextResponse.json({ error: 'No hay ventas para exportar' }, { status: 404 });
    }

    const activityIds = activities.map(a => a.id);

    // Obtener enrollments
    const { data: enrollments } = await supabase
      .from('activity_enrollments')
      .select('id')
      .in('activity_id', activityIds);

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ error: 'No hay ventas para exportar' }, { status: 404 });
    }

    const enrollmentIds = enrollments.map(e => e.id);

    // Construir query base
    let query = supabase
      .from('banco')
      .select(`
        id,
        amount_paid,
        seller_amount,
        marketplace_fee,
        payment_status,
        payment_date,
        created_at,
        activity_enrollments!inner(
          activity_id,
          activities!inner(
            title,
            price
          )
        )
      `)
      .in('enrollment_id', enrollmentIds)
      .eq('payment_status', 'completed');

    // Filtrar por mes si se especifica
    if (month && year) {
      const targetMonth = parseInt(month);
      const targetYear = parseInt(year);
      const startDate = new Date(targetYear, targetMonth - 1, 1).toISOString();
      const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59).toISOString();
      query = query.gte('payment_date', startDate).lte('payment_date', endDate);
    }

    const { data: payments, error: paymentsError } = await query.order('payment_date', { ascending: false });

    if (paymentsError) {
      console.error('Error obteniendo pagos:', paymentsError);
      return NextResponse.json({ error: 'Error obteniendo pagos' }, { status: 500 });
    }

    // Preparar datos para exportación
    const salesData = (payments || []).map((payment: any) => {
      const amount = parseFloat(payment.amount_paid?.toString() || '0');
      const commission = parseFloat(payment.marketplace_fee?.toString() || '0') || (amount * commissionRate);
      const sellerAmount = parseFloat(payment.seller_amount?.toString() || '0') || (amount - commission);

      return {
        fecha: new Date(payment.payment_date || payment.created_at).toLocaleDateString('es-AR'),
        concepto: payment.activity_enrollments?.activities?.title || 'Actividad',
        montoTotal: amount,
        comision: commission,
        feePlan: planFee,
        ganancia: sellerAmount - planFee
      };
    });

    if (format === 'excel') {
      // Generar CSV (compatible con Excel)
      const headers = ['Fecha', 'Concepto', 'Monto Total', 'Comisión OMNIA', 'Fee Plan', 'Ganancia'];
      const rows = salesData.map(sale => [
        sale.fecha,
        sale.concepto,
        sale.montoTotal.toFixed(2),
        sale.comision.toFixed(2),
        sale.feePlan.toFixed(2),
        sale.ganancia.toFixed(2)
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="ventas_${month || 'todas'}.csv"`
        }
      });
    } else {
      // Para PDF, retornar JSON y generar en el frontend
      return NextResponse.json({
        success: true,
        format: 'pdf',
        data: salesData,
        month: month || 'todas',
        planFee
      });
    }

  } catch (error: any) {
    console.error('Error en export-sales:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

