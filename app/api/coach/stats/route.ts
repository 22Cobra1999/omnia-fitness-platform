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

    // 1. Tasa de respuesta (%)
    // Calcular mensajes recibidos del cliente y respuestas del coach
    const { data: conversations } = await adminSupabase
      .from('conversations')
      .select('id')
      .eq('coach_id', coachId);

    const conversationIds = conversations?.map(c => c.id) || [];

    let responseRate = 0;
    let avgResponseTime = 0;

    if (conversationIds.length > 0) {
      // Obtener todos los mensajes de estas conversaciones
      const { data: allMessages } = await adminSupabase
        .from('messages')
        .select('id, sender_type, created_at, conversation_id')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: true });

      if (allMessages && allMessages.length > 0) {
        // Agrupar por conversación y calcular tasa de respuesta
        const conversationStats = new Map<string, { clientMessages: number, coachResponses: number, responseTimes: number[] }>();

        for (let i = 0; i < allMessages.length; i++) {
          const msg = allMessages[i];
          const convId = msg.conversation_id;

          if (!conversationStats.has(convId)) {
            conversationStats.set(convId, { clientMessages: 0, coachResponses: 0, responseTimes: [] });
          }

          const stats = conversationStats.get(convId)!;

          if (msg.sender_type === 'client') {
            stats.clientMessages++;
            // Buscar siguiente mensaje del coach
            for (let j = i + 1; j < allMessages.length; j++) {
              const nextMsg = allMessages[j];
              if (nextMsg.conversation_id === convId && nextMsg.sender_type === 'coach') {
                const responseTime = new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime();
                stats.responseTimes.push(responseTime);
                stats.coachResponses++;
                break;
              }
            }
          }
        }

        let totalClientMessages = 0;
        let totalCoachResponses = 0;
        let totalResponseTime = 0;
        let responseCount = 0;

        conversationStats.forEach(stats => {
          totalClientMessages += stats.clientMessages;
          totalCoachResponses += stats.coachResponses;
          stats.responseTimes.forEach(rt => {
            totalResponseTime += rt;
            responseCount++;
          });
        });

        responseRate = totalClientMessages > 0 
          ? Math.round((totalCoachResponses / totalClientMessages) * 100) 
          : 0;

        avgResponseTime = responseCount > 0 
          ? Math.round(totalResponseTime / responseCount / (1000 * 60 * 60)) // Convertir a horas
          : 0;
      }
    }

    // 2. Cancelaciones del coach
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: cancellationsCount } = await adminSupabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .eq('status', 'cancelled')
      .gte('created_at', thirtyDaysAgo.toISOString());

    // También contar cancelaciones en activity_schedules
    const { count: scheduleCancellationsCount } = await adminSupabase
      .from('activity_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .eq('status', 'cancelled')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const totalCancellations = (cancellationsCount || 0) + (scheduleCancellationsCount || 0);

    // 3. Reprogramaciones tardías (dentro de 12-24h previas)
    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { count: lateReschedulesCount } = await adminSupabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .eq('status', 'rescheduled')
      .gte('start_time', twentyFourHoursAgo.toISOString())
      .lte('start_time', twelveHoursAgo.toISOString());

    const { count: scheduleLateReschedulesCount } = await adminSupabase
      .from('activity_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .eq('status', 'rescheduled')
      .gte('scheduled_date', twentyFourHoursAgo.toISOString().split('T')[0])
      .lte('scheduled_date', twelveHoursAgo.toISOString().split('T')[0]);

    const totalLateReschedules = (lateReschedulesCount || 0) + (scheduleLateReschedulesCount || 0);

    // 4. Asistencia / puntualidad del coach
    // Contar eventos completados vs programados
    const { count: completedEvents } = await adminSupabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .eq('status', 'completed')
      .gte('start_time', thirtyDaysAgo.toISOString());

    const { count: scheduledEvents } = await adminSupabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .in('status', ['scheduled', 'completed', 'cancelled', 'rescheduled'])
      .gte('start_time', thirtyDaysAgo.toISOString());

    const attendanceRate = scheduledEvents && scheduledEvents > 0
      ? Math.round(((completedEvents || 0) / scheduledEvents) * 100)
      : 0;

    // 5. Incidentes reportados por clientes
    // Buscar en mensajes que contengan palabras clave de quejas
    const complaintKeywords = ['queja', 'problema', 'disputa', 'reclamo', 'mal', 'malo', 'insatisfecho', 'insatisfecha'];
    
    const { data: recentMessages } = await adminSupabase
      .from('messages')
      .select('id, content, sender_type, created_at')
      .in('conversation_id', conversationIds)
      .eq('sender_type', 'client')
      .gte('created_at', thirtyDaysAgo.toISOString());

    let incidentsCount = 0;
    if (recentMessages) {
      incidentsCount = recentMessages.filter(msg => {
        const content = msg.content.toLowerCase();
        return complaintKeywords.some(keyword => content.includes(keyword));
      }).length;
    }

    return NextResponse.json({
      responseRate,
      avgResponseTimeHours: avgResponseTime,
      cancellations: totalCancellations,
      lateReschedules: totalLateReschedules,
      attendanceRate,
      incidents: incidentsCount,
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

