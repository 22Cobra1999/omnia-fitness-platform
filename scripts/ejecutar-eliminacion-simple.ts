#!/usr/bin/env tsx

/**
 * Script para ejecutar la eliminación simple de tablas
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

async function ejecutarEliminacion() {
  console.log('🗑️  Ejecutando eliminación de tablas redundantes...\n');

  const sqlFile = join(process.cwd(), 'db/migrations/eliminar-tablas-simple.sql');
  const sql = readFileSync(sqlFile, 'utf-8');

  // Dividir en statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  console.log(`📝 Ejecutando ${statements.length} statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    if (statement.startsWith('SELECT')) {
      // Para SELECT, ejecutar y mostrar resultados
      try {
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: statement + ';'
        });
        
        if (error) {
          console.log(`   ⚠️  [${i + 1}] ${error.message}`);
        } else {
          console.log(`   ✅ [${i + 1}] ${JSON.stringify(data)}`);
        }
      } catch (e: any) {
        console.log(`   ⚠️  [${i + 1}] ${e.message}`);
      }
    } else {
      // Para DROP, intentar ejecutar
      try {
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: statement + ';'
        });

        if (error) {
          if (error.message.includes('function') || error.message.includes('does not exist')) {
            console.log(`   ⚠️  [${i + 1}] Función execute_sql no disponible`);
            console.log(`   💡 Ejecuta manualmente: ${statement};`);
          } else {
            console.log(`   ⚠️  [${i + 1}] ${error.message}`);
          }
        } else {
          console.log(`   ✅ [${i + 1}] ${statement.split(' ').slice(0, 3).join(' ')}...`);
        }
      } catch (e: any) {
        console.log(`   ⚠️  [${i + 1}] ${e.message}`);
        console.log(`   💡 Ejecuta manualmente: ${statement};`);
      }
    }
  }

  console.log('\n✅ Proceso completado');
  console.log('\n💡 Si algunas tablas no se eliminaron, ejecuta el SQL manualmente en Supabase Dashboard');
}

ejecutarEliminacion();

