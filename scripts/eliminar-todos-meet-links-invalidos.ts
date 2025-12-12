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

async function eliminarTodosInvalidos() {
  console.log('🧹 Eliminando TODOS los meet_links inválidos...\n');

  // Obtener todos los eventos con meet_link
  const { data: eventos, error } = await supabase
    .from('calendar_events')
    .select('id, title, meet_link, google_event_id')
    .not('meet_link', 'is', null);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`📋 Eventos con meet_link: ${eventos?.length || 0}\n`);

  // Un meet_link es válido SOLO si:
  // 1. Tiene google_event_id (fue creado por Google Calendar API)
  // 2. No contiene 'test-' o 'xxx-'
  // 3. Tiene el formato correcto de Google Meet
  const eventosInvalidos = eventos?.filter(e => {
    if (!e.meet_link) return false;
    
    // Si no tiene google_event_id, es inválido (no fue creado por la API)
    if (!e.google_event_id) return true;
    
    // Si contiene test- o xxx-, es inválido
    if (e.meet_link.includes('test-') || e.meet_link.includes('xxx-')) return true;
    
    // Si no tiene el formato correcto, es inválido
    if (!e.meet_link.includes('meet.google.com/')) return true;
    
    return false;
  }) || [];

  console.log(`⚠️  Eventos con meet_links inválidos: ${eventosInvalidos.length}\n`);

  if (eventosInvalidos.length === 0) {
    console.log('✅ No hay meet_links inválidos');
    return;
  }

  // Eliminar meet_links inválidos
  for (const evento of eventosInvalidos) {
    console.log(`   ❌ ${evento.title}`);
    console.log(`      Link inválido: ${evento.meet_link}`);
    console.log(`      Sin google_event_id: ${!evento.google_event_id}`);
    
    const { error: updateError } = await supabase
      .from('calendar_events')
      .update({
        meet_link: null,
        meet_code: null,
      })
      .eq('id', evento.id);

    if (updateError) {
      console.error(`   ❌ Error: ${updateError.message}`);
    } else {
      console.log(`   ✅ Limpiado\n`);
    }
  }

  console.log(`\n✅ ${eventosInvalidos.length} eventos limpiados`);
  console.log('\n💡 Los meet_links se crearán automáticamente desde el modal cuando el usuario lo solicite');
  console.log('   usando Google Calendar API (requiere Google Calendar conectado)');
}

eliminarTodosInvalidos();

