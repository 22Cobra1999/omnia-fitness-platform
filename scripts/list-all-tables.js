const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllTables() {
  try {
    console.log('🔍 Consultando todas las tablas y sus columnas...\n');

    // Consulta SQL para obtener todas las tablas del esquema public y sus columnas
    const query = `
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.character_maximum_length,
        c.is_nullable,
        c.column_default,
        CASE 
          WHEN pk.column_name IS NOT NULL THEN 'YES'
          ELSE 'NO'
        END as is_primary_key
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c 
        ON t.table_schema = c.table_schema 
        AND t.table_name = c.table_name
      LEFT JOIN (
        SELECT ku.table_name, ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name
          AND tc.table_schema = ku.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
      ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name, c.ordinal_position;
    `;

    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: query
    });

    if (error) {
      // Si no existe la función execute_sql, intentar con una consulta directa
      console.log('⚠️  Función execute_sql no disponible, intentando método alternativo...\n');
      
      // Obtener todas las tablas primero
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `;

      // Intentar obtener información de cada tabla
      const { data: tablesData, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE');

      if (tablesError) {
        console.error('❌ Error obteniendo tablas:', tablesError);
        return;
      }

      // Para cada tabla, obtener sus columnas usando una consulta directa
      const tables = {};
      
      // Obtener información de columnas usando una consulta SQL directa
      const columnsQuery = `
        SELECT 
          table_name,
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;
      `;

      // Usar una consulta directa a través de Supabase
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql_query: columnsQuery })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Resultado:', result);
      return;
    }

    // Organizar los datos por tabla
    const tables = {};
    if (data && Array.isArray(data)) {
      data.forEach(row => {
        if (!tables[row.table_name]) {
          tables[row.table_name] = [];
        }
        if (row.column_name) {
          tables[row.table_name].push({
            column_name: row.column_name,
            data_type: row.data_type,
            max_length: row.character_maximum_length,
            is_nullable: row.is_nullable,
            default: row.column_default,
            is_primary_key: row.is_primary_key === 'YES'
          });
        }
      });
    }

    // Mostrar resultados
    console.log(`📊 Total de tablas encontradas: ${Object.keys(tables).length}\n`);
    console.log('='.repeat(80));
    
    Object.keys(tables).sort().forEach(tableName => {
      console.log(`\n📋 Tabla: ${tableName}`);
      console.log('-'.repeat(80));
      
      if (tables[tableName].length === 0) {
        console.log('  (sin columnas)');
      } else {
        tables[tableName].forEach(col => {
          const pk = col.is_primary_key ? ' [PK]' : '';
          const nullable = col.is_nullable === 'YES' ? ' NULL' : ' NOT NULL';
          const defaultVal = col.default ? ` DEFAULT ${col.default}` : '';
          const length = col.max_length ? `(${col.max_length})` : '';
          
          console.log(`  - ${col.column_name}: ${col.data_type}${length}${nullable}${defaultVal}${pk}`);
        });
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Consulta completada. Total: ${Object.keys(tables).length} tablas\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

listAllTables();















