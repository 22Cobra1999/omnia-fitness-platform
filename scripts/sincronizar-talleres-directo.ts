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

async function sincronizarTalleres() {
  console.log('🔄 Sincronizando talleres...\n');

  // 1. Obtener taller_detalles
  const { data: talleres, error: tError } = await supabase
    .from('taller_detalles')
    .select('*, activities!inner(coach_id)')
    .eq('activo', true);

  if (tError) {
    console.error('❌ Error obteniendo talleres:', tError.message);
    return;
  }

  console.log(`📋 Talleres encontrados: ${talleres?.length || 0}\n`);

  // 2. Eliminar eventos existentes de estos talleres
  if (talleres && talleres.length > 0) {
    const activityIds = talleres.map((t: any) => t.actividad_id);
    const { error: delError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('event_type', 'workshop')
      .in('activity_id', activityIds);

    if (delError) {
      console.log('⚠️  Error eliminando eventos existentes:', delError.message);
    } else {
      console.log('✅ Eventos antiguos eliminados\n');
    }
  }

  // 3. Crear nuevos eventos
  const eventos: any[] = [];

  for (const taller of talleres || []) {
    const coachId = (taller as any).activities?.coach_id;
    if (!coachId) continue;

    const originales = (taller as any).originales;
    if (!originales?.fechas_horarios) continue;

    for (const fechaHorario of originales.fechas_horarios) {
      const fecha = fechaHorario.fecha;
      const horaInicio = fechaHorario.hora_inicio;
      const horaFin = fechaHorario.hora_fin;
      const cupo = fechaHorario.cupo;

      // Crear timestamps en zona horaria de Argentina
      const startTime = new Date(`${fecha}T${horaInicio}:00-03:00`).toISOString();
      const endTime = new Date(`${fecha}T${horaFin}:00-03:00`).toISOString();

      // NO generar meet_link aquí - se creará cuando el usuario lo solicite desde el modal
      // Esto evita crear links inválidos

      eventos.push({
        coach_id: coachId,
        activity_id: taller.actividad_id,
        title: `Taller: ${taller.nombre}`,
        description: taller.descripcion || '',
        start_time: startTime,
        end_time: endTime,
        event_type: 'workshop',
        status: 'scheduled',
        notes: `Cupo: ${cupo} personas`,
        // meet_link se creará cuando el usuario lo solicite desde el modal
        timezone_offset: -180,
        timezone_name: 'America/Argentina/Buenos_Aires',
      });
    }
  }

  console.log(`📅 Eventos a crear: ${eventos.length}\n`);

  // 4. Insertar eventos
  if (eventos.length > 0) {
    const { data: insertedEvents, error } = await supabase
      .from('calendar_events')
      .insert(eventos)
      .select();

    if (error) {
      console.error('❌ Error insertando eventos:', error.message);
    } else {
      console.log(`✅ ${insertedEvents?.length || 0} eventos creados\n`);

      // 5. Crear Google Meet automáticamente para cada evento de taller
      // Solo si el coach tiene Google Calendar conectado
      if (insertedEvents && insertedEvents.length > 0) {
        console.log('🔗 Creando Google Meet automáticamente...\n');
        
        let meetsCreated = 0;
        let meetsSkipped = 0;
        
        for (const event of insertedEvents) {
          try {
            // Verificar si el coach tiene Google Calendar conectado
            const { data: tokens } = await supabase
              .from('google_oauth_tokens')
              .select('coach_id')
              .eq('coach_id', event.coach_id)
              .maybeSingle();
            
            if (tokens) {
              // Llamar al endpoint para crear el Meet automáticamente
              // Nota: Este endpoint requiere autenticación, así que lo llamamos directamente
              // usando las credenciales del coach desde el script
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
              
              // Para scripts, necesitamos usar un método alternativo
              // Por ahora, solo marcamos que el Meet se creará automáticamente
              // cuando el usuario cargue el calendario
              console.log(`   ℹ️  Meet se creará automáticamente para: ${event.title} (al cargar el calendario)`);
              
              // TODO: Implementar creación directa de Meet desde el script
              // usando las credenciales de Google OAuth del coach
              
              const result = await response.json();
              
              if (result.success) {
                meetsCreated++;
                console.log(`   ✅ Meet creado para: ${event.title}`);
              } else {
                meetsSkipped++;
                console.log(`   ⚠️  Meet no creado para: ${event.title} - ${result.message || 'Google Calendar no conectado'}`);
              }
            } else {
              meetsSkipped++;
              console.log(`   ⚠️  Meet no creado para: ${event.title} - Google Calendar no conectado`);
            }
          } catch (error: any) {
            meetsSkipped++;
            console.log(`   ❌ Error creando Meet para: ${event.title} - ${error.message}`);
          }
        }
        
        console.log(`\n📊 Resumen de Meets:`);
        console.log(`   ✅ Creados: ${meetsCreated}`);
        console.log(`   ⚠️  Omitidos: ${meetsSkipped}\n`);
      }

      // Verificar eventos para 30-31 de diciembre
      const eventos30_31 = eventos.filter((e: any) => {
        const fecha = new Date(e.start_time).toISOString().split('T')[0];
        return fecha === '2025-12-30' || fecha === '2025-12-31';
      });

      console.log(`📅 Eventos para 30-31 de diciembre: ${eventos30_31.length}`);
      eventos30_31.forEach((e: any) => {
        console.log(`   - ${e.title} (${new Date(e.start_time).toISOString()})`);
      });
    }
  }
}

async function crearMeetPrueba() {
  console.log('\n📹 Creando meet de prueba...\n');

  // Obtener coach y client
  const { data: coaches } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('role', 'coach')
    .limit(1);

  const { data: clients } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('role', 'client')
    .limit(1);

  if (!coaches || coaches.length === 0 || !clients || clients.length === 0) {
    console.log('⚠️  No se encontraron usuarios para crear el meet');
    return;
  }

  const coachId = coaches[0].id;
  const clientId = clients[0].id;

  // Crear fecha/hora para hoy a las 11:35
  const today = new Date();
  today.setHours(11, 35, 0, 0);
  const endTime = new Date(today);
  endTime.setHours(12, 35, 0, 0);

  const meetLink = `https://meet.google.com/test-attendance-${Date.now()}`;

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      coach_id: coachId,
      client_id: clientId,
      title: 'Sesión de Prueba - Attendance Tracking',
      description: 'Sesión de prueba para verificar el tracking de asistencia desde Google Meet',
      start_time: today.toISOString(),
      end_time: endTime.toISOString(),
      event_type: 'consultation',
      status: 'scheduled',
      consultation_type: 'videocall',
      meet_link: meetLink,
      meet_code: `test-${Date.now()}`,
      google_event_id: `test_google_event_${Date.now()}`,
      coach_attendance_status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creando meet:', error.message);
  } else {
    console.log('✅ Meet de prueba creado:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Hora: ${today.toISOString()}`);
    console.log(`   Link: ${meetLink}`);
  }
}

async function main() {
  await sincronizarTalleres();
  await crearMeetPrueba();
  console.log('\n✅ Proceso completado!');
}

main();

