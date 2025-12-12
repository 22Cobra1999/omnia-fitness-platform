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

async function ejecutarSQL(sql: string) {
  // Dividir en statements individuales
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  for (const statement of statements) {
    if (statement.length < 10) continue;
    
    try {
      const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        if (error.message.includes('function') || error.message.includes('does not exist')) {
          throw new Error('Función execute_sql no disponible. Ejecuta manualmente en Supabase.');
        }
        // Ignorar errores de duplicados
        if (!error.message.includes('duplicate') && !error.message.includes('already exists')) {
          console.log(`   ⚠️  ${error.message.substring(0, 80)}`);
        }
      } else if (data && (data as any).error) {
        console.log(`   ⚠️  ${(data as any).error}`);
      }
    } catch (e: any) {
      if (e.message.includes('execute_sql')) {
        throw e;
      }
    }
  }
}

async function main() {
  console.log('🚀 Ejecutando scripts directamente...\n');

  try {
    // 1. Sincronizar talleres
    console.log('📅 1. Sincronizando talleres...');
    const syncSQL = readFileSync(
      join(process.cwd(), 'db/migrations/sincronizar-talleres-corregido.sql'),
      'utf-8'
    );
    await ejecutarSQL(syncSQL);
    console.log('   ✅ Completado\n');

    // 2. Crear meet de prueba
    console.log('📹 2. Creando meet de prueba...');
    const meetSQL = readFileSync(
      join(process.cwd(), 'db/migrations/crear-meet-prueba-hoy.sql'),
      'utf-8'
    );
    await ejecutarSQL(meetSQL);
    console.log('   ✅ Completado\n');

    // 3. Verificar
    console.log('🔍 3. Verificando resultados...');
    const { data: eventos } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('event_type', 'workshop')
      .gte('start_time', '2025-12-30T00:00:00')
      .lte('start_time', '2025-12-31T23:59:59')
      .order('start_time');

    console.log(`   ✅ Eventos para 30-31 de diciembre: ${eventos?.length || 0}`);
    eventos?.forEach((e: any) => {
      console.log(`      - ${e.title} (${e.start_time})`);
    });

    const today = new Date().toISOString().split('T')[0];
    const { data: meet } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('start_time', `${today}T11:30:00`)
      .lte('start_time', `${today}T11:40:00`)
      .limit(1);

    if (meet && meet.length > 0) {
      console.log(`   ✅ Meet de prueba creado: ${meet[0].title}`);
      console.log(`      Link: ${meet[0].meet_link}`);
    }

    console.log('\n✅ Todo completado!');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('execute_sql')) {
      console.log('\n💡 Ejecuta los scripts manualmente en Supabase SQL Editor:');
      console.log('   1. db/migrations/sincronizar-talleres-corregido.sql');
      console.log('   2. db/migrations/crear-meet-prueba-hoy.sql');
    }
    process.exit(1);
  }
}

main();

