#!/usr/bin/env tsx

/**
 * Script para verificar la consolidación de calendar_events
 * Consulta la base de datos y muestra un resumen
 */

import { getSupabaseAdmin } from '@/lib/config/db';

async function verificarConsolidacion() {
  console.log('🔍 Verificando consolidación de calendar_events...\n');

  try {
    const supabase = await getSupabaseAdmin();

    // 2. Verificar datos migrados
    console.log('📊 Verificando datos migrados...');
    
    const { count: totalEvents } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true });

    const { count: eventsWithMeet } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .not('meet_link', 'is', null);

    const { count: eventsCancelled } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled')
      .not('cancelled_by', 'is', null);

    const { count: eventsRescheduled } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rescheduled')
      .not('rescheduled_by', 'is', null);

    const { count: eventsWithAttendance } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .not('coach_attendance_status', 'is', null)
      .neq('coach_attendance_status', 'pending');

    // Verificar que los campos existen probando con una query
    const { data: sampleEvent, error: sampleError } = await supabase
      .from('calendar_events')
      .select('cancelled_by, cancelled_at, rescheduled_by, rescheduled_at, meet_link, meet_code, coach_joined_at, coach_attendance_status, actual_duration_minutes')
      .limit(1);

    console.log(`   Total eventos: ${totalEvents || 0}`);
    console.log(`   Eventos con Google Meet: ${eventsWithMeet || 0}`);
    console.log(`   Eventos cancelados (con datos): ${eventsCancelled || 0}`);
    console.log(`   Eventos reprogramados (con datos): ${eventsRescheduled || 0}`);
    console.log(`   Eventos con asistencia: ${eventsWithAttendance || 0}`);

    if (sampleError) {
      console.error('   ⚠️  Error verificando campos:', sampleError.message);
      console.error('   Algunos campos pueden no existir aún');
    } else {
      console.log('   ✅ Campos verificados correctamente');
    }

    // 3. Verificar tablas antiguas
    console.log('\n🗑️  Verificando tablas antiguas...');
    
    let totalSchedules = 0;
    let totalMeetLinks = 0;
    
    try {
      const { count } = await supabase
        .from('activity_schedules')
        .select('*', { count: 'exact', head: true });
      totalSchedules = count || 0;
    } catch (e: any) {
      console.log('   ✅ activity_schedules ya no existe (eliminada)');
    }

    try {
      const { count } = await supabase
        .from('google_meet_links')
        .select('*', { count: 'exact', head: true });
      totalMeetLinks = count || 0;
    } catch (e: any) {
      console.log('   ✅ google_meet_links ya no existe (eliminada)');
    }

    if (totalSchedules > 0 || totalMeetLinks > 0) {
      console.log(`   Registros en activity_schedules: ${totalSchedules}`);
      console.log(`   Registros en google_meet_links: ${totalMeetLinks}`);
    }

    // 4. Resumen
    console.log('\n' + '='.repeat(50));
    console.log('📋 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(50));
    
    const camposOk = !sampleError;
    const datosOk = (totalEvents || 0) > 0;
    const migracionOk = (eventsWithMeet || 0) > 0 || totalMeetLinks === 0;
    const tablasEliminadas = totalSchedules === 0 && totalMeetLinks === 0;
    
    console.log(`✅ Campos agregados: ${camposOk ? 'OK' : 'FALTA'}`);
    console.log(`✅ Datos en calendar_events: ${datosOk ? 'OK' : 'VACÍO'}`);
    console.log(`✅ Migración de datos: ${migracionOk ? 'OK' : 'REVISAR'}`);
    console.log(`✅ Tablas antiguas: ${tablasEliminadas ? 'ELIMINADAS' : 'PENDIENTES'}`);
    
    console.log('\n' + '='.repeat(50));
    
    if (camposOk && datosOk && migracionOk && tablasEliminadas) {
      console.log('✅ Consolidación completada y verificada correctamente');
      process.exit(0);
    } else if (camposOk && datosOk && migracionOk && !tablasEliminadas) {
      console.log('✅ Consolidación verificada correctamente');
      console.log('💡 Puedes ejecutar: eliminar-tablas-redundantes.sql');
      process.exit(0);
    } else {
      console.log('⚠️  Hay problemas que revisar');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verificarConsolidacion();

