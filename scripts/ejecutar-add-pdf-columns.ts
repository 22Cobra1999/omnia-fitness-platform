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
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_KEY);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ejecutarSQL() {
  console.log('📝 Ejecutando SQL para agregar columnas PDF a calendar_events...\n');

  // Leer el archivo SQL
  const sqlPath = join(process.cwd(), 'db/migrations/add-pdf-to-calendar-events.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  console.log('📄 Contenido del SQL:');
  console.log(sql);
  console.log('');

  // Dividir en statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    if (statement.length < 10) continue;

    console.log(`\n[${i + 1}/${statements.length}] Ejecutando: ${statement.substring(0, 60)}...`);

    try {
      // Para ALTER TABLE, necesitamos usar RPC o ejecutar directamente
      // Intentar con RPC execute_sql primero
      const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        if (error.message.includes('function') || error.message.includes('does not exist')) {
          console.log('   ⚠️  Función execute_sql no disponible');
          console.log('   💡 Ejecutando directamente usando query...');
          
          // Intentar ejecutar directamente usando una query
          // Para ALTER TABLE, podemos verificar primero si las columnas existen
          if (statement.toUpperCase().includes('ALTER TABLE') && statement.toUpperCase().includes('ADD COLUMN')) {
            // Verificar si las columnas ya existen
            const { data: columns, error: checkError } = await supabase
              .from('calendar_events')
              .select('*')
              .limit(0);

            if (!checkError) {
              // Intentar verificar columnas usando información del schema
              console.log('   ✅ Tabla calendar_events existe');
              console.log('   ⚠️  Para agregar columnas, ejecuta manualmente en Supabase SQL Editor:');
              console.log(`\n${statement};\n`);
              console.log('   O usa el siguiente comando SQL directo:');
              console.log('\n   ALTER TABLE calendar_events');
              console.log('   ADD COLUMN IF NOT EXISTS pdf_url TEXT,');
              console.log('   ADD COLUMN IF NOT EXISTS pdf_file_name TEXT;\n');
              return;
            }
          }
        } else {
          // Si el error es que la columna ya existe, está bien
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log('   ✅ Columnas ya existen (esto es normal)');
          } else {
            throw error;
          }
        }
      } else {
        console.log('   ✅ Completado');
      }
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log('   ✅ Columnas ya existen (esto es normal)');
      } else {
        console.error(`   ❌ Error: ${error.message}`);
        console.log('\n💡 Ejecuta manualmente en Supabase SQL Editor:');
        console.log(`\n${statement};\n`);
      }
    }
  }

  // Verificar que las columnas se agregaron
  console.log('\n🔍 Verificando columnas...');
  try {
    const { data: testData, error: testError } = await supabase
      .from('calendar_events')
      .select('id, pdf_url, pdf_file_name')
      .limit(1);

    if (!testError) {
      console.log('   ✅ Columnas pdf_url y pdf_file_name agregadas correctamente');
      console.log('   ✅ Puedes usar estas columnas en calendar_events');
    } else {
      if (testError.message.includes('column') && testError.message.includes('does not exist')) {
        console.log('   ⚠️  Las columnas aún no existen');
        console.log('   💡 Ejecuta el SQL manualmente en Supabase SQL Editor');
      } else {
        console.log('   ⚠️  Error verificando:', testError.message);
      }
    }
  } catch (error: any) {
    console.log('   ⚠️  No se pudo verificar:', error.message);
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

