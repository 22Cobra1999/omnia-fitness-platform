#!/usr/bin/env tsx

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
  } catch (e) {}
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function verificar() {
  console.log('🔍 Verificando eventos creados...\n');

  // Eventos de taller
  const { data: workshops, error: wError } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('event_type', 'workshop')
    .order('start_time', { ascending: true });

  console.log('📅 Eventos de taller:');
  if (wError) {
    console.error('   ❌ Error:', wError.message);
  } else {
    console.log(`   Total: ${workshops?.length || 0}`);
    workshops?.forEach((w: any) => {
      console.log(`   - ${w.title}`);
      console.log(`     Fecha: ${w.start_time}`);
      console.log(`     Activity ID: ${w.activity_id}`);
    });
  }

  // Eventos para 30-31 de diciembre 2025
  const { data: eventos30_31, error: eError } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('event_type', 'workshop')
    .gte('start_time', '2025-12-30T00:00:00')
    .lte('start_time', '2025-12-31T23:59:59')
    .order('start_time', { ascending: true });

  console.log('\n📅 Eventos para 30-31 de diciembre 2025:');
  if (eError) {
    console.error('   ❌ Error:', eError.message);
  } else {
    console.log(`   Total: ${eventos30_31?.length || 0}`);
    eventos30_31?.forEach((e: any) => {
      console.log(`   - ${e.title}`);
      console.log(`     Fecha: ${e.start_time}`);
      console.log(`     Horario: ${e.start_time} - ${e.end_time}`);
    });
  }

  // Meet de prueba para hoy
  const today = new Date().toISOString().split('T')[0];
  const { data: meetToday, error: mError } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('start_time', `${today}T11:30:00`)
    .lte('start_time', `${today}T11:40:00`)
    .order('created_at', { ascending: false })
    .limit(5);

  console.log(`\n📹 Meet de prueba para hoy (${today}):`);
  if (mError) {
    console.error('   ❌ Error:', mError.message);
  } else {
    console.log(`   Total: ${meetToday?.length || 0}`);
    meetToday?.forEach((m: any) => {
      console.log(`   - ${m.title}`);
      console.log(`     Hora: ${m.start_time}`);
      console.log(`     Meet Link: ${m.meet_link || 'No tiene'}`);
      console.log(`     Status: ${m.coach_attendance_status || 'N/A'}`);
    });
  }
}

verificar();

