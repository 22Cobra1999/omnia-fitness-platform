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

async function limpiar() {
  console.log('🧹 Limpiando meet_links inválidos...\n');

  // Obtener todos los eventos con meet_link
  const { data: eventos, error } = await supabase
    .from('calendar_events')
    .select('*')
    .not('meet_link', 'is', null);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`📋 Eventos con meet_link: ${eventos?.length || 0}\n`);

  const eventosInvalidos = eventos?.filter(e => 
    e.meet_link && (
      e.meet_link.includes('test-') || 
      e.meet_link.includes('xxx-') ||
      !e.meet_link.includes('meet.google.com/') ||
      e.meet_link.split('/').length < 4 // Formato inválido
    )
  ) || [];

  console.log(`⚠️  Eventos con meet_links inválidos: ${eventosInvalidos.length}\n`);

  if (eventosInvalidos.length === 0) {
    console.log('✅ No hay meet_links inválidos');
    return;
  }

  // Eliminar meet_links inválidos
  for (const evento of eventosInvalidos) {
    console.log(`   Limpiando: ${evento.title} - ${evento.meet_link}`);
    
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
      console.log(`   ✅ Limpiado`);
    }
  }

  console.log(`\n✅ ${eventosInvalidos.length} eventos limpiados`);
}

limpiar();

