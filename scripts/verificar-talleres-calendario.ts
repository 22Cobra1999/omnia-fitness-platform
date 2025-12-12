#!/usr/bin/env tsx

/**
 * Script para verificar por qué los talleres no aparecen en el calendario
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

async function verificarTalleres() {
  console.log('🔍 Verificando talleres en el calendario...\n');
  console.log('='.repeat(60));

  try {
    // 1. Verificar workshop_topics
    console.log('📋 1. Verificando workshop_topics...');
    
    const { data: topics, error: topicsError } = await supabase
      .from('workshop_topics')
      .select('*')
      .gte('start_date', '2024-12-30')
      .lte('end_date', '2024-12-31');

    if (topicsError) {
      console.error('   ❌ Error:', topicsError.message);
    } else {
      console.log(`   ✅ Talleres encontrados: ${topics?.length || 0}`);
      if (topics && topics.length > 0) {
        topics.forEach((topic: any) => {
          console.log(`      - ${topic.topic_title} (${topic.start_date} - ${topic.end_date})`);
          console.log(`        original_dates: ${JSON.stringify(topic.original_dates)}`);
          console.log(`        bis_dates: ${JSON.stringify(topic.bis_dates)}`);
        });
      }
    }

    // 2. Verificar calendar_events para esos días
    console.log('\n📅 2. Verificando calendar_events para 30-31 de diciembre...');
    
    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('start_time', '2024-12-30')
      .lte('start_time', '2024-12-31 23:59:59')
      .eq('event_type', 'workshop');

    if (eventsError) {
      console.error('   ❌ Error:', eventsError.message);
    } else {
      console.log(`   ✅ Eventos de taller en calendario: ${events?.length || 0}`);
      if (events && events.length > 0) {
        events.forEach((event: any) => {
          console.log(`      - ${event.title} (${event.start_time})`);
        });
      } else {
        console.log('   ⚠️  No hay eventos de taller en el calendario para esos días');
      }
    }

    // 3. Verificar si hay función de sincronización
    console.log('\n🔄 3. Verificando función de sincronización...');
    
    const { data: functions, error: funcError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
          AND routine_name LIKE '%sync%calendar%' OR routine_name LIKE '%workshop%';
      `
    });

    if (funcError) {
      console.log('   ⚠️  No se pudo verificar funciones (normal si execute_sql no existe)');
    } else {
      console.log('   ✅ Funciones encontradas:', functions);
    }

    // 4. Verificar actividades relacionadas
    console.log('\n📦 4. Verificando actividades relacionadas...');
    
    if (topics && topics.length > 0) {
      const activityIds = topics.map((t: any) => t.activity_id);
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('id, title, activity_type')
        .in('id', activityIds);

      if (activitiesError) {
        console.error('   ❌ Error:', activitiesError.message);
      } else {
        console.log(`   ✅ Actividades encontradas: ${activities?.length || 0}`);
        activities?.forEach((activity: any) => {
          console.log(`      - ${activity.title} (${activity.activity_type})`);
        });
      }
    }

    // 5. Resumen y recomendaciones
    console.log('\n' + '='.repeat(60));
    console.log('📋 RESUMEN');
    console.log('='.repeat(60));
    
    if (topics && topics.length > 0 && (!events || events.length === 0)) {
      console.log('⚠️  PROBLEMA DETECTADO:');
      console.log('   - Hay talleres configurados (workshop_topics)');
      console.log('   - Pero NO hay eventos en calendar_events');
      console.log('');
      console.log('💡 SOLUCIÓN:');
      console.log('   Necesitas ejecutar la función de sincronización o');
      console.log('   crear los eventos manualmente desde workshop_topics');
      console.log('');
      console.log('   Ejecuta en Supabase SQL Editor:');
      console.log('   SELECT sync_all_calendar_events();');
      console.log('   O crea un script que convierta workshop_topics a calendar_events');
    } else if (topics && topics.length > 0 && events && events.length > 0) {
      console.log('✅ Todo está correcto:');
      console.log('   - Talleres configurados');
      console.log('   - Eventos en calendario');
    } else {
      console.log('⚠️  No hay talleres configurados para esos días');
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verificarTalleres();

