#!/usr/bin/env tsx

/**
 * Script para ejecutar la verificación y eliminación de tablas redundantes
 * Ejecuta los scripts SQL directamente en Supabase
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { getSupabaseAdmin } from '@/lib/config/db';

async function executeSQL(sql: string, description: string) {
  const supabase = await getSupabaseAdmin();
  
  // Dividir SQL en statements individuales
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  console.log(`\n📝 ${description}`);
  console.log(`   Ejecutando ${statements.length} statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Saltar comentarios y bloques DO
    if (statement.startsWith('--') || statement.length < 10) {
      continue;
    }

    try {
      // Intentar usar RPC execute_sql si está disponible
      const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        // Si la función no existe, intentar ejecutar directamente
        if (error.message.includes('function') || error.message.includes('does not exist')) {
          console.log(`   ⚠️  Función execute_sql no disponible, usando método alternativo...`);
          // Para statements que no son SELECT, usar el cliente directamente
          // Esto es limitado, pero funciona para DROP, ALTER, etc.
          if (statement.toUpperCase().startsWith('DROP')) {
            // Para DROP, necesitamos usar el método directo
            console.log(`   ⚠️  DROP statements requieren ejecución manual en Supabase Dashboard`);
            continue;
          }
        } else {
          throw error;
        }
      } else if (data && (data as any).error) {
        throw new Error((data as any).error);
      } else {
        console.log(`   ✅ [${i + 1}/${statements.length}] Completado`);
      }
    } catch (error: any) {
      // Algunos errores son esperados (como tablas que no existen)
      if (error.message?.includes('does not exist') || 
          error.message?.includes('already exists')) {
        console.log(`   ⚠️  [${i + 1}/${statements.length}] ${error.message.substring(0, 60)}...`);
      } else {
        console.error(`   ❌ [${i + 1}/${statements.length}] Error:`, error.message);
        // No lanzar error, continuar con los siguientes statements
      }
    }
  }
}

async function main() {
  console.log('🚀 Ejecutando consolidación completa de calendar_events\n');
  console.log('='.repeat(60));

  try {
    // 1. Verificar consolidación
    const verificarPath = join(process.cwd(), 'db/migrations/verificar-consolidacion.sql');
    const verificarSQL = readFileSync(verificarPath, 'utf-8');
    
    await executeSQL(verificarSQL, 'Paso 1: Verificando consolidación');

    // 2. Eliminar tablas redundantes
    const eliminarPath = join(process.cwd(), 'db/migrations/eliminar-tablas-redundantes.sql');
    const eliminarSQL = readFileSync(eliminarPath, 'utf-8');
    
    await executeSQL(eliminarSQL, 'Paso 2: Eliminando tablas redundantes');

    console.log('\n' + '='.repeat(60));
    console.log('✅ Proceso completado');
    console.log('\n💡 Nota: Algunos statements pueden requerir ejecución manual');
    console.log('   en Supabase Dashboard si la función execute_sql no está disponible.');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

