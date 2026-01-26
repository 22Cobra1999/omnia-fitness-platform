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

    // Consultar la tabla optimizada 'progreso_diario_actividad'
    const { data: rows, error: summaryError } = await supabase
      .from('progreso_diario_actividad')
      .select('fecha, tipo, area, items_objetivo, items_completados, calorias, minutos')
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

    // Agrupar por fecha
    const byDate: Record<string, any> = {}

    // Inicializar estructura base
    const getBaseStats = () => ({
      platos_objetivo: 0,
      platos_completados: 0,
      platos_pendientes: 0,
      nutri_kcal: 0,
      nutri_kcal_objetivo: 0, // Nota: La tabla actual no guarda objetivo de kcal explícito, asumimos 0 o requeriría lógica extra
      nutri_mins: 0,
      nutri_mins_objetivo: 0,

      ejercicios_objetivo: 0,
      ejercicios_completados: 0,
      ejercicios_pendientes: 0,
      fitness_kcal: 0,
      fitness_kcal_objetivo: 0,
      fitness_mins: 0,
      fitness_mins_objetivo: 0
    });

    (rows || []).forEach((r: any) => {
      const dateKey = String(r.fecha).slice(0, 10);
      if (!byDate[dateKey]) {
        byDate[dateKey] = getBaseStats();
      }

      const stats = byDate[dateKey];
      const itemsObj = Number(r.items_objetivo) || 0;
      const itemsComp = Number(r.items_completados) || 0;
      const itemsPend = Math.max(0, itemsObj - itemsComp);
      const cals = Number(r.calorias) || 0;
      const mins = Number(r.minutos) || 0;

      if (r.area === 'nutricion') {
        stats.platos_objetivo += itemsObj;
        stats.platos_completados += itemsComp;
        stats.platos_pendientes += itemsPend;
        stats.nutri_kcal += cals;
        stats.nutri_mins += mins;
      } else if (r.area === 'fitness') {
        stats.ejercicios_objetivo += itemsObj;
        stats.ejercicios_completados += itemsComp;
        stats.ejercicios_pendientes += itemsPend;
        stats.fitness_kcal += cals;
        stats.fitness_mins += mins;
      }
      // Ignoramos 'general' / 'taller' para este resumen específico si solo muestra fitness/nutrición
    });

    const start = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T00:00:00`)
    const out: any[] = []

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const key = `${y}-${m}-${day}`

      const r = byDate[key] || getBaseStats();

      // Completar campos derivados y cálculo de progreso
      out.push({
        fecha: key,
        cliente_id: clienteId,

        platos_objetivo: r.platos_objetivo,
        platos_completados: r.platos_completados,
        platos_pendientes: r.platos_pendientes,
        nutri_kcal: r.nutri_kcal,
        nutri_kcal_objetivo: r.nutri_kcal_objetivo,
        nutri_mins: r.nutri_mins,
        nutri_mins_objetivo: r.nutri_mins_objetivo,

        ejercicios_objetivo: r.ejercicios_objetivo,
        ejercicios_completados: r.ejercicios_completados,
        ejercicios_pendientes: r.ejercicios_pendientes,
        fitness_kcal: r.fitness_kcal,
        fitness_kcal_objetivo: r.fitness_kcal_objetivo,
        fitness_mins: r.fitness_mins,
        fitness_mins_objetivo: r.fitness_mins_objetivo,

        nutri_kcal_progress: clamp01(safeDiv(r.nutri_kcal, r.nutri_kcal_objetivo)),
        nutri_mins_progress: clamp01(safeDiv(r.nutri_mins, r.nutri_mins_objetivo)),
        platos_progress: clamp01(safeDiv(r.platos_completados, r.platos_objetivo)),

        fitness_kcal_progress: clamp01(safeDiv(r.fitness_kcal, r.fitness_kcal_objetivo)),
        fitness_mins_progress: clamp01(safeDiv(r.fitness_mins, r.fitness_mins_objetivo)),
        ejercicios_progress: clamp01(safeDiv(r.ejercicios_completados, r.ejercicios_objetivo))
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

