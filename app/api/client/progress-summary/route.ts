import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

/**
 * GET /api/client/progress-summary
 * Obtiene el resumen de progreso del cliente usando la query SQL
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('cliente_id') || user.id;
    const startDate = searchParams.get('start_date'); // YYYY-MM-DD
    const endDate = searchParams.get('end_date'); // YYYY-MM-DD

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing start_date/end_date' },
        { status: 400 }
      );
    }

    const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
    const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0);

    const { data: rows, error: summaryError } = await supabase
      .from('progreso_cliente_daily_summary')
      .select(
        [
          'fecha',
          'cliente_id',
          'platos_objetivo',
          'platos_completados',
          'platos_pendientes',
          'nutri_kcal',
          'nutri_kcal_objetivo',
          'nutri_mins',
          'nutri_mins_objetivo',
          'ejercicios_objetivo',
          'ejercicios_completados',
          'ejercicios_pendientes',
          'fitness_kcal',
          'fitness_kcal_objetivo',
          'fitness_mins',
          'fitness_mins_objetivo'
        ].join(',')
      )
      .eq('cliente_id', clienteId)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .order('fecha', { ascending: true });

    if (summaryError) {
      console.error('Error obteniendo daily summary:', summaryError);
      return NextResponse.json(
        { error: 'Error obteniendo daily summary', details: summaryError.message },
        { status: 500 }
      );
    }

    const byDate: Record<string, any> = {}
    ;(rows || []).forEach((r: any) => {
      byDate[String(r.fecha).slice(0, 10)] = r
    })

    const start = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T00:00:00`)
    const out: any[] = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const key = `${y}-${m}-${day}`
      const r = byDate[key] || { fecha: key, cliente_id: clienteId }

      const nutriKcal = Number(r.nutri_kcal) || 0
      const nutriKcalObj = Number(r.nutri_kcal_objetivo) || 0
      const nutriMins = Number(r.nutri_mins) || 0
      const nutriMinsObj = Number(r.nutri_mins_objetivo) || 0
      const platosComp = Number(r.platos_completados) || 0
      const platosObj = Number(r.platos_objetivo) || 0

      const fitKcal = Number(r.fitness_kcal) || 0
      const fitKcalObj = Number(r.fitness_kcal_objetivo) || 0
      const fitMins = Number(r.fitness_mins) || 0
      const fitMinsObj = Number(r.fitness_mins_objetivo) || 0
      const ejComp = Number(r.ejercicios_completados) || 0
      const ejObj = Number(r.ejercicios_objetivo) || 0

      out.push({
        fecha: key,
        cliente_id: clienteId,

        platos_objetivo: platosObj,
        platos_completados: platosComp,
        platos_pendientes: Number(r.platos_pendientes) || 0,
        nutri_kcal: nutriKcal,
        nutri_kcal_objetivo: nutriKcalObj,
        nutri_mins: nutriMins,
        nutri_mins_objetivo: nutriMinsObj,

        ejercicios_objetivo: ejObj,
        ejercicios_completados: ejComp,
        ejercicios_pendientes: Number(r.ejercicios_pendientes) || 0,
        fitness_kcal: fitKcal,
        fitness_kcal_objetivo: fitKcalObj,
        fitness_mins: fitMins,
        fitness_mins_objetivo: fitMinsObj,

        nutri_kcal_progress: clamp01(safeDiv(nutriKcal, nutriKcalObj)),
        nutri_mins_progress: clamp01(safeDiv(nutriMins, nutriMinsObj)),
        platos_progress: clamp01(safeDiv(platosComp, platosObj)),

        fitness_kcal_progress: clamp01(safeDiv(fitKcal, fitKcalObj)),
        fitness_mins_progress: clamp01(safeDiv(fitMins, fitMinsObj)),
        ejercicios_progress: clamp01(safeDiv(ejComp, ejObj))
      })
    }

    return NextResponse.json({
      success: true,
      data: out
    });

  } catch (error: any) {
    console.error('Error en progress-summary:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

