import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { getSupabaseAdmin } from '@/lib/config/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coach_id');

    if (!coachId) {
      return NextResponse.json({ error: 'coach_id es requerido' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.id !== coachId) {
      return NextResponse.json({ error: 'No autorizado para este coach' }, { status: 403 });
    }

    const adminSupabase = await getSupabaseAdmin();

    // Query pre-aggregated stats from the new table
    const { data: stats, error } = await adminSupabase
      .from('coach_statistics')
      .select('*')
      .eq('coach_id', coachId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }

    // Default values if no stats found yet
    const responseRate = stats ? stats.response_rate : null;
    const avgResponseTimeMinutes = stats ? stats.avg_response_time_minutes : null;
    // Round to 1 decimal place for hours
    const avgResponseTimeHours = (avgResponseTimeMinutes !== null && avgResponseTimeMinutes > 0)
      ? Number((avgResponseTimeMinutes / 60).toFixed(1))
      : (avgResponseTimeMinutes === 0 ? 0 : null);
    const cancellations = stats ? stats.cancellations_count : 0;
    const lateReschedules = stats ? stats.late_reschedules_count : 0;
    const attendanceRate = stats ? stats.attendance_rate : null;
    const incidents = stats ? stats.incidents_count : 0;

    return NextResponse.json({
      responseRate,
      avgResponseTimeHours,
      cancellations,
      lateReschedules,
      attendanceRate,
      incidents,
      period: '30 días'
    });

  } catch (error: any) {
    console.error('Error obteniendo estadísticas del coach:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}

