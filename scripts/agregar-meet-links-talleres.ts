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

// NOTA: Este script ya no genera meet_links falsos
// Los meet_links se deben crear usando Google Calendar API desde el modal
// Este script solo elimina meet_links inválidos existentes

async function limpiarMeetLinksInvalidos() {
  console.log('🧹 Limpiando meet_links inválidos de eventos de taller...\n');

  // Obtener eventos de taller con meet_links inválidos (test- o xxx-)
  const { data: eventos, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('event_type', 'workshop')
    .not('meet_link', 'is', null);

  if (error) {
    console.error('❌ Error obteniendo eventos:', error.message);
    return;
  }

  const eventosInvalidos = eventos?.filter(e => 
    e.meet_link && (
      e.meet_link.includes('test-') || 
      e.meet_link.includes('xxx-') ||
      !e.meet_link.includes('meet.google.com/')
    )
  ) || [];

  console.log(`📋 Eventos con meet_links inválidos: ${eventosInvalidos.length}\n`);

  if (eventosInvalidos.length === 0) {
    console.log('✅ No hay meet_links inválidos');
    return;
  }

  // Eliminar meet_links inválidos
  for (const evento of eventosInvalidos) {
    const { error: updateError } = await supabase
      .from('calendar_events')
      .update({
        meet_link: null,
        meet_code: null,
      })
      .eq('id', evento.id);

    if (updateError) {
      console.error(`❌ Error actualizando evento ${evento.id}:`, updateError.message);
    } else {
      console.log(`✅ ${evento.title} - meet_link inválido eliminado`);
    }
  }

  console.log(`\n✅ ${eventosInvalidos.length} eventos limpiados`);
  console.log('\n💡 Los meet_links se crearán automáticamente desde el modal cuando el usuario lo solicite');
}

async function main() {
  await limpiarMeetLinksInvalidos();
  console.log('\n✅ Proceso completado!');
}

main();

