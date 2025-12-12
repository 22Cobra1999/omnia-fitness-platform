#!/usr/bin/env tsx

/**
 * Script para verificar y eliminar tablas redundantes
 * Usa el cliente de Supabase para verificar datos y ejecutar eliminaciones
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno manualmente
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
    // Ignorar si el archivo no existe
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables de entorno faltantes');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function verificarYLimpiar() {
  console.log('🔍 Verificando y limpiando tablas redundantes...\n');
  console.log('='.repeat(60));

  try {

    // 1. Verificar datos en calendar_events
    console.log('\n📊 1. Verificando datos en calendar_events...');
    
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

    console.log(`   ✅ Total eventos: ${totalEvents || 0}`);
    console.log(`   ✅ Eventos con Google Meet: ${eventsWithMeet || 0}`);
    console.log(`   ✅ Eventos cancelados (con datos): ${eventsCancelled || 0}`);

    if ((totalEvents || 0) === 0) {
      console.error('\n❌ ERROR: No hay eventos en calendar_events. No se puede proceder.');
      process.exit(1);
    }

    // 2. Verificar tablas antiguas
    console.log('\n🗑️  2. Verificando tablas antiguas...');
    
    let totalSchedules = 0;
    let totalMeetLinks = 0;
    let totalAttendanceLogs = 0;
    let schedulesExists = false;
    let meetLinksExists = false;
    let attendanceLogsExists = false;

    try {
      const { count } = await supabase
        .from('activity_schedules')
        .select('*', { count: 'exact', head: true });
      totalSchedules = count || 0;
      schedulesExists = true;
      console.log(`   ⚠️  activity_schedules existe: ${totalSchedules} registros`);
    } catch (e: any) {
      console.log(`   ✅ activity_schedules no existe (ya eliminada)`);
    }

    try {
      const { count } = await supabase
        .from('google_meet_links')
        .select('*', { count: 'exact', head: true });
      totalMeetLinks = count || 0;
      meetLinksExists = true;
      console.log(`   ⚠️  google_meet_links existe: ${totalMeetLinks} registros`);
    } catch (e: any) {
      console.log(`   ✅ google_meet_links no existe (ya eliminada)`);
    }

    try {
      const { count } = await supabase
        .from('meeting_attendance_logs')
        .select('*', { count: 'exact', head: true });
      totalAttendanceLogs = count || 0;
      attendanceLogsExists = true;
      console.log(`   ⚠️  meeting_attendance_logs existe: ${totalAttendanceLogs} registros`);
    } catch (e: any) {
      console.log(`   ✅ meeting_attendance_logs no existe (ya eliminada)`);
    }

    // 3. Intentar eliminar usando RPC execute_sql si está disponible
    if (schedulesExists || meetLinksExists || attendanceLogsExists) {
      console.log('\n🗑️  3. Intentando eliminar tablas...');
      
      const tablesToDrop = [];
      if (attendanceLogsExists) tablesToDrop.push('meeting_attendance_logs');
      if (meetLinksExists) tablesToDrop.push('google_meet_links');
      if (schedulesExists) tablesToDrop.push('activity_schedules');

      for (const tableName of tablesToDrop) {
        try {
          // Intentar usar RPC execute_sql
          const { data, error } = await supabase.rpc('execute_sql', {
            sql_query: `DROP TABLE IF EXISTS public.${tableName} CASCADE;`
          });

          if (error) {
            if (error.message.includes('function') || error.message.includes('does not exist')) {
              console.log(`   ⚠️  Función execute_sql no disponible para ${tableName}`);
              console.log(`   💡 Ejecuta manualmente en Supabase: DROP TABLE IF EXISTS public.${tableName} CASCADE;`);
            } else {
              throw error;
            }
          } else {
            console.log(`   ✅ ${tableName} eliminada`);
          }
        } catch (error: any) {
          console.log(`   ⚠️  No se pudo eliminar ${tableName}: ${error.message}`);
          console.log(`   💡 Ejecuta manualmente en Supabase: DROP TABLE IF EXISTS public.${tableName} CASCADE;`);
        }
      }

      // Intentar eliminar función relacionada
      try {
        const { error } = await supabase.rpc('execute_sql', {
          sql_query: `DROP FUNCTION IF EXISTS public.calculate_meeting_duration() CASCADE;`
        });
        if (!error) {
          console.log(`   ✅ Función calculate_meeting_duration eliminada`);
        }
      } catch (e) {
        // Ignorar
      }
    } else {
      console.log('\n✅ Todas las tablas redundantes ya fueron eliminadas');
    }

    // 4. Verificación final
    console.log('\n📋 4. Verificación final...');
    
    const { count: finalEvents } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true });

    const { count: finalEventsWithMeet } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .not('meet_link', 'is', null);

    console.log(`   ✅ Total eventos en calendar_events: ${finalEvents || 0}`);
    console.log(`   ✅ Eventos con Google Meet: ${finalEventsWithMeet || 0}`);

    // Verificar si las tablas aún existen
    let stillExists = false;
    for (const table of ['activity_schedules', 'google_meet_links', 'meeting_attendance_logs']) {
      try {
        await supabase.from(table).select('id', { count: 'exact', head: true }).limit(1);
        console.log(`   ⚠️  ${table} aún existe - requiere eliminación manual`);
        stillExists = true;
      } catch (e) {
        console.log(`   ✅ ${table} no existe`);
      }
    }

    console.log('\n' + '='.repeat(60));
    if (!stillExists) {
      console.log('✅ Consolidación completada exitosamente');
      console.log('   Todas las funcionalidades ahora usan calendar_events');
    } else {
      console.log('⚠️  Consolidación parcialmente completada');
      console.log('   Algunas tablas requieren eliminación manual en Supabase Dashboard');
      console.log('   Ejecuta: DROP TABLE IF EXISTS public.<tabla> CASCADE;');
    }
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verificarYLimpiar();

