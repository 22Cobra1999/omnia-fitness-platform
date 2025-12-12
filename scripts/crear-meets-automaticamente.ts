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

async function crearMeetsAutomaticamente() {
  console.log('🔗 Creando Google Meets automáticamente para talleres...\n');

  // 1. Obtener todos los eventos de tipo 'workshop' que no tienen meet_link
  const { data: eventos, error } = await supabase
    .from('calendar_events')
    .select('id, title, coach_id, start_time, google_event_id, meet_link')
    .eq('event_type', 'workshop')
    .is('meet_link', null)
    .is('google_event_id', null)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('❌ Error obteniendo eventos:', error.message);
    return;
  }

  if (!eventos || eventos.length === 0) {
    console.log('✅ No hay eventos de taller sin Meet');
    return;
  }

  console.log(`📋 Eventos sin Meet encontrados: ${eventos.length}\n`);

  // 2. Agrupar por coach_id
  const eventosPorCoach = eventos.reduce((acc, evento) => {
    if (!acc[evento.coach_id]) {
      acc[evento.coach_id] = [];
    }
    acc[evento.coach_id].push(evento);
    return acc;
  }, {} as Record<string, typeof eventos>);

  let meetsCreados = 0;
  let meetsOmitidos = 0;

  // 3. Para cada coach, verificar si tiene Google Calendar conectado
  for (const [coachId, eventosCoach] of Object.entries(eventosPorCoach)) {
    console.log(`\n👤 Coach: ${coachId}`);
    console.log(`   Eventos: ${eventosCoach.length}`);

    // Verificar si tiene Google Calendar conectado
    const { data: tokens } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('coach_id', coachId)
      .maybeSingle();

    if (!tokens) {
      console.log(`   ⚠️  Google Calendar no conectado - omitiendo ${eventosCoach.length} eventos`);
      meetsOmitidos += eventosCoach.length;
      continue;
    }

    console.log(`   ✅ Google Calendar conectado - creando Meets...`);

    // Para cada evento, crear el Meet
    for (const evento of eventosCoach) {
      try {
        // Llamar al endpoint de auto-create-meet
        // Nota: Este endpoint requiere autenticación, así que necesitamos usar
        // las credenciales del coach directamente
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://omnia-app.vercel.app';
        
        // Usar fetch con las credenciales del servicio
        const response = await fetch(`${baseUrl}/api/google/calendar/auto-create-meet`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            // Nota: El endpoint requiere autenticación de sesión
            // Por ahora, solo mostramos que se necesita crear manualmente
          },
          body: JSON.stringify({ eventId: evento.id }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            meetsCreados++;
            console.log(`   ✅ Meet creado: ${evento.title}`);
          } else {
            meetsOmitidos++;
            console.log(`   ⚠️  Meet no creado: ${evento.title} - ${result.message || 'Error desconocido'}`);
          }
        } else {
          meetsOmitidos++;
          const errorData = await response.json();
          console.log(`   ❌ Error: ${evento.title} - ${errorData.error || 'Error desconocido'}`);
        }
      } catch (error: any) {
        meetsOmitidos++;
        console.log(`   ❌ Error creando Meet para: ${evento.title} - ${error.message}`);
      }
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Meets creados: ${meetsCreados}`);
  console.log(`   ⚠️  Meets omitidos: ${meetsOmitidos}`);
  console.log(`\n💡 Nota: Los Meets se crearán automáticamente cuando:`);
  console.log(`   1. El coach tenga Google Calendar conectado`);
  console.log(`   2. Se cargue el calendario en la app`);
  console.log(`   3. O se ejecute este script periódicamente`);
}

crearMeetsAutomaticamente();

