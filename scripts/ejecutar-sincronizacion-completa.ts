#!/usr/bin/env tsx

/**
 * Script para ejecutar la sincronización completa:
 * 1. Sincronizar taller_detalles a calendar_events
 * 2. Crear meet de prueba para hoy
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

async function ejecutarSQL(sql: string, descripcion: string) {
  console.log(`\n📝 ${descripcion}...`);
  
  // Dividir en statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    if (statement.length < 10 || statement.startsWith('--')) {
      continue;
    }

    try {
      const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        if (error.message.includes('function') || error.message.includes('does not exist')) {
          console.log(`   ⚠️  Función execute_sql no disponible`);
          console.log(`   💡 Ejecuta el SQL manualmente en Supabase Dashboard`);
          return false;
        } else {
          // Algunos errores son esperados (como duplicados)
          if (error.message.includes('duplicate') || error.message.includes('already exists')) {
            console.log(`   ⚠️  [${i + 1}] ${error.message.substring(0, 60)}...`);
          } else {
            console.log(`   ⚠️  [${i + 1}] ${error.message}`);
          }
        }
      } else {
        if (statement.toUpperCase().startsWith('SELECT')) {
          console.log(`   ✅ [${i + 1}] Resultado:`, data);
        } else {
          console.log(`   ✅ [${i + 1}] Completado`);
        }
      }
    } catch (e: any) {
      console.log(`   ⚠️  [${i + 1}] ${e.message}`);
    }
  }
  
  return true;
}

async function main() {
  console.log('🚀 Ejecutando sincronización completa...\n');
  console.log('='.repeat(60));

  try {
    // 1. Sincronizar taller_detalles
    const syncSQL = readFileSync(
      join(process.cwd(), 'db/migrations/sincronizar-taller-detalles-calendar.sql'),
      'utf-8'
    );
    
    await ejecutarSQL(syncSQL, 'Paso 1: Sincronizando taller_detalles a calendar_events');

    // 2. Crear meet de prueba
    const meetSQL = readFileSync(
      join(process.cwd(), 'db/migrations/crear-meet-prueba-hoy.sql'),
      'utf-8'
    );
    
    await ejecutarSQL(meetSQL, 'Paso 2: Creando meet de prueba para hoy a las 11:35');

    // 3. Verificar resultados
    console.log('\n📊 Verificando resultados...');
    
    const { count: totalWorkshops } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'workshop');

    const { count: workshops30_31 } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'workshop')
      .gte('start_time', '2025-12-30')
      .lte('start_time', '2025-12-31 23:59:59');

    const { data: meetToday } = await supabase
      .from('calendar_events')
      .select('id, title, start_time, meet_link')
      .eq('start_time::DATE', new Date().toISOString().split('T')[0])
      .eq('start_time::TIME', '11:35:00')
      .limit(1);

    console.log(`   ✅ Total eventos de taller: ${totalWorkshops || 0}`);
    console.log(`   ✅ Eventos para 30-31 de diciembre: ${workshops30_31 || 0}`);
    
    if (meetToday && meetToday.length > 0) {
      console.log(`   ✅ Meet de prueba creado: ${meetToday[0].title}`);
      console.log(`      Link: ${meetToday[0].meet_link}`);
    } else {
      console.log(`   ⚠️  Meet de prueba no encontrado (puede requerir ejecución manual)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Proceso completado');
    console.log('='.repeat(60));
    console.log('\n💡 Si algunos scripts no se ejecutaron, ejecútalos manualmente en Supabase Dashboard');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

