#!/usr/bin/env tsx

/**
 * Script para probar las estadísticas del coach
 * Verifica que todos los datos se obtengan correctamente de calendar_events
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno
const envPaths = ['.env.local', '.env'];
for (const envPath of envPaths) {
  try {
    const envFile = readFileSync(join(process.cwd(), envPath), 'utf8');
    envFile.split('\n').forEach(line => {
      if (line.trim() && !line.trim().startsWith('#')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
      }
    });
  } catch (e) {
    // Ignorar
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function probarEstadisticas() {
  console.log('🧪 Probando estadísticas del coach...\n');
  console.log('='.repeat(60));

  try {
    // 1. Obtener un coach_id
    const { data: coaches, error: coachesError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name')
      .eq('role', 'coach')
      .limit(1);

    if (coachesError || !coaches || coaches.length === 0) {
      console.error('❌ No se encontraron coaches');
      process.exit(1);
    }

    const coachId = coaches[0].id;
    console.log(`📋 Coach: ${coaches[0].full_name || coaches[0].email} (${coachId})\n`);

    // 2. Verificar datos en calendar_events
    console.log('📊 Verificando datos en calendar_events...');
    
    const { count: totalEvents } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId);

    const { count: eventsWithMeet } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .not('meet_link', 'is', null);

    const { count: eventsCancelled } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .eq('status', 'cancelled')
      .eq('cancelled_by', 'coach');

    const { count: eventsRescheduled } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .eq('status', 'rescheduled')
      .eq('rescheduled_by', 'coach');

    const { count: eventsPresent } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .eq('coach_attendance_status', 'present');

    const { count: eventsLate } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .eq('coach_attendance_status', 'late');

    const { count: eventsAbsent } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .eq('coach_attendance_status', 'absent');

    console.log(`   ✅ Total eventos: ${totalEvents || 0}`);
    console.log(`   ✅ Eventos con Google Meet: ${eventsWithMeet || 0}`);
    console.log(`   ✅ Cancelaciones del coach: ${eventsCancelled || 0}`);
    console.log(`   ✅ Reprogramaciones del coach: ${eventsRescheduled || 0}`);
    console.log(`   ✅ Asistencia presente: ${eventsPresent || 0}`);
    console.log(`   ✅ Asistencia tardía: ${eventsLate || 0}`);
    console.log(`   ✅ Sin asistencia: ${eventsAbsent || 0}`);

    // 3. Probar endpoint de estadísticas
    console.log('\n🔌 Probando endpoint de estadísticas...');
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const statsUrl = `${baseUrl}/api/coach/stats?coach_id=${coachId}`;
    
    console.log(`   URL: ${statsUrl}`);
    
    try {
      const response = await fetch(statsUrl);
      const stats = await response.json();
      
      if (response.ok) {
        console.log('\n✅ Estadísticas obtenidas:');
        console.log(`   📊 Tasa de respuesta: ${stats.responseRate}%`);
        console.log(`   ⏱️  Tiempo promedio de respuesta: ${stats.avgResponseTimeHours}h`);
        console.log(`   ❌ Cancelaciones: ${stats.cancellations}`);
        console.log(`   📅 Reprogramaciones tardías: ${stats.lateReschedules}`);
        console.log(`   ✅ Asistencia: ${stats.attendanceRate}%`);
        console.log(`   ⚠️  Incidentes: ${stats.incidents}`);
        console.log(`   📆 Período: ${stats.period}`);
      } else {
        console.error('❌ Error:', stats.error);
        console.error('   Detalles:', stats.details);
      }
    } catch (error: any) {
      console.error('❌ Error al llamar al endpoint:', error.message);
      console.log('   💡 Asegúrate de que el servidor esté corriendo (npm run dev)');
    }

    // 4. Verificar campos en calendar_events
    console.log('\n🔍 Verificando campos en calendar_events...');
    
    const { data: sampleEvent } = await supabase
      .from('calendar_events')
      .select('cancelled_by, cancelled_at, rescheduled_by, rescheduled_at, coach_attendance_status, coach_joined_at, actual_duration_minutes')
      .eq('coach_id', coachId)
      .limit(1);

    if (sampleEvent && sampleEvent.length > 0) {
      const event = sampleEvent[0];
      console.log('   ✅ Campos disponibles:');
      console.log(`      - cancelled_by: ${event.cancelled_by ? '✅' : '❌'}`);
      console.log(`      - cancelled_at: ${event.cancelled_at ? '✅' : '❌'}`);
      console.log(`      - rescheduled_by: ${event.rescheduled_by ? '✅' : '❌'}`);
      console.log(`      - rescheduled_at: ${event.rescheduled_at ? '✅' : '❌'}`);
      console.log(`      - coach_attendance_status: ${event.coach_attendance_status ? '✅' : '❌'}`);
      console.log(`      - coach_joined_at: ${event.coach_joined_at ? '✅' : '❌'}`);
      console.log(`      - actual_duration_minutes: ${event.actual_duration_minutes ? '✅' : '❌'}`);
    } else {
      console.log('   ⚠️  No hay eventos para verificar campos');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Prueba completada');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

probarEstadisticas();

