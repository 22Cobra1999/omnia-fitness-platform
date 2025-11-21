const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL o SUPABASE_DB_URL no configurada en .env.local');
  console.log('\n💡 Necesitas agregar una de estas variables:');
  console.log('   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres');
  console.log('   o');
  console.log('   SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres\n');
  process.exit(1);
}

async function listAllTables() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado\n');

    // Consulta para obtener todas las tablas y sus columnas
    const query = `
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        c.is_nullable,
        c.column_default,
        CASE 
          WHEN pk.column_name IS NOT NULL THEN true
          ELSE false
        END as is_primary_key,
        CASE 
          WHEN fk.column_name IS NOT NULL THEN fk.foreign_table_name || '.' || fk.foreign_column_name
          ELSE NULL
        END as foreign_key
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
      LEFT JOIN (
        SELECT 
          ku.table_name,
          ku.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS ku
          ON tc.constraint_name = ku.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
      ) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name, c.ordinal_position;
    `;

    console.log('📊 Consultando tablas y columnas...\n');
    const result = await client.query(query);

    // Organizar los datos por tabla
    const tables = {};
    result.rows.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      if (row.column_name) {
        let dataType = row.data_type;
        if (row.character_maximum_length) {
          dataType += `(${row.character_maximum_length})`;
        } else if (row.numeric_precision) {
          dataType += `(${row.numeric_precision}`;
          if (row.numeric_scale) {
            dataType += `,${row.numeric_scale}`;
          }
          dataType += ')';
        }

        tables[row.table_name].push({
          column_name: row.column_name,
          data_type: dataType,
          is_nullable: row.is_nullable === 'YES',
          default: row.column_default,
          is_primary_key: row.is_primary_key,
          foreign_key: row.foreign_key
        });
      }
    });

    // Mostrar resultados
    console.log('='.repeat(100));
    console.log(`📋 TOTAL DE TABLAS: ${Object.keys(tables).length}`);
    console.log('='.repeat(100));
    
    Object.keys(tables).sort().forEach(tableName => {
      console.log(`\n📋 Tabla: ${tableName}`);
      console.log('-'.repeat(100));
      
      if (tables[tableName].length === 0) {
        console.log('  (sin columnas)');
      } else {
        tables[tableName].forEach(col => {
          const pk = col.is_primary_key ? ' [PK]' : '';
          const nullable = col.is_nullable ? ' NULL' : ' NOT NULL';
          const defaultVal = col.default ? ` DEFAULT ${col.default}` : '';
          const fk = col.foreign_key ? ` → ${col.foreign_key}` : '';
          
          console.log(`  • ${col.column_name.padEnd(30)} ${col.data_type.padEnd(25)}${nullable}${defaultVal}${pk}${fk}`);
        });
      }
    });

    console.log('\n' + '='.repeat(100));
    console.log(`\n✅ Consulta completada. Total: ${Object.keys(tables).length} tablas\n`);

    // Guardar en archivo JSON
    const fs = require('fs');
    const outputPath = './db-schema.json';
    fs.writeFileSync(outputPath, JSON.stringify(tables, null, 2));
    console.log(`💾 Esquema guardado en: ${outputPath}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Verifica que la contraseña en DATABASE_URL sea correcta');
    } else if (error.message.includes('connect ECONNREFUSED')) {
      console.log('\n💡 Verifica que la URL de conexión sea correcta y que la base de datos esté accesible');
    }
  } finally {
    await client.end();
  }
}

listAllTables();









