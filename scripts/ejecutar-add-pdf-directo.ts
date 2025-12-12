#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join } from 'path';
import { getSupabaseAdmin } from '@/lib/config/db';

async function ejecutarSQL() {
  console.log('📝 Ejecutando SQL para agregar columnas PDF a calendar_events...\n');

  const supabase = await getSupabaseAdmin();

  // Verificar si las columnas ya existen
  console.log('🔍 Verificando si las columnas ya existen...');
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('id, pdf_url, pdf_file_name')
      .limit(1);

    if (!error) {
      console.log('   ✅ Las columnas pdf_url y pdf_file_name ya existen');
      console.log('   ✅ No es necesario ejecutar el SQL');
      return;
    } else {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('   ⚠️  Las columnas no existen, necesitamos agregarlas');
      } else {
        console.log('   ⚠️  Error verificando:', error.message);
      }
    }
  } catch (error: any) {
    console.log('   ⚠️  Error:', error.message);
  }

  // Intentar ejecutar el ALTER TABLE usando RPC
  console.log('\n📝 Intentando agregar columnas...');
  
  const alterTableSQL = `
    ALTER TABLE calendar_events
    ADD COLUMN IF NOT EXISTS pdf_url TEXT,
    ADD COLUMN IF NOT EXISTS pdf_file_name TEXT;
  `;

  try {
    // Intentar con RPC execute_sql
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: alterTableSQL
    });

    if (error) {
      if (error.message.includes('function') || error.message.includes('does not exist')) {
        console.log('   ⚠️  Función execute_sql no disponible');
        console.log('\n💡 Ejecuta manualmente en Supabase SQL Editor:');
        console.log('\n' + alterTableSQL + '\n');
        console.log('O ejecuta estos comandos:');
        console.log('\nALTER TABLE calendar_events');
        console.log('ADD COLUMN IF NOT EXISTS pdf_url TEXT,');
        console.log('ADD COLUMN IF NOT EXISTS pdf_file_name TEXT;');
        console.log('\nCOMMENT ON COLUMN calendar_events.pdf_url IS \'URL del PDF adjunto al evento\';');
        console.log('COMMENT ON COLUMN calendar_events.pdf_file_name IS \'Nombre del archivo PDF adjunto\';\n');
        return;
      } else {
        throw error;
      }
    }

    console.log('   ✅ Columnas agregadas correctamente');

    // Agregar comentarios
    const commentSQL1 = `COMMENT ON COLUMN calendar_events.pdf_url IS 'URL del PDF adjunto al evento';`;
    const commentSQL2 = `COMMENT ON COLUMN calendar_events.pdf_file_name IS 'Nombre del archivo PDF adjunto';`;

    await supabase.rpc('execute_sql', { sql_query: commentSQL1 });
    await supabase.rpc('execute_sql', { sql_query: commentSQL2 });

    console.log('   ✅ Comentarios agregados');

    // Verificar nuevamente
    console.log('\n🔍 Verificando columnas...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('calendar_events')
      .select('id, pdf_url, pdf_file_name')
      .limit(1);

    if (!verifyError) {
      console.log('   ✅ Columnas verificadas correctamente');
      console.log('   ✅ Puedes usar pdf_url y pdf_file_name en calendar_events');
    } else {
      console.log('   ⚠️  Error verificando:', verifyError.message);
    }

  } catch (error: any) {
    console.error('   ❌ Error:', error.message);
    console.log('\n💡 Ejecuta manualmente en Supabase SQL Editor:');
    console.log('\nALTER TABLE calendar_events');
    console.log('ADD COLUMN IF NOT EXISTS pdf_url TEXT,');
    console.log('ADD COLUMN IF NOT EXISTS pdf_file_name TEXT;');
    console.log('\nCOMMENT ON COLUMN calendar_events.pdf_url IS \'URL del PDF adjunto al evento\';');
    console.log('COMMENT ON COLUMN calendar_events.pdf_file_name IS \'Nombre del archivo PDF adjunto\';\n');
  }
}

ejecutarSQL()
  .then(() => {
    console.log('\n✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });

