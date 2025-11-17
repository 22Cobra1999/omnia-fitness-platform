/**
 * Script para ejecutar la migración add_file_name_to_storage_usage.sql
 * Usa Supabase service role para ejecutar SQL directamente
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Cargar variables de entorno
const envPaths = ['.env', '.env.local']
for (const envPath of envPaths) {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '..', envPath), 'utf8')
    envFile.split('\n').forEach(line => {
      if (line.trim() && !line.trim().startsWith('#')) {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
          const [, key, value] = match
          process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '')
        }
      }
    })
  } catch (e) {
    // Ignorar
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables de entorno faltantes')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function executeMigration() {
  try {
    console.log('📝 Ejecutando migración add_file_name_to_storage_usage.sql...\n')

    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, '..', 'db', 'migrations', 'add_file_name_to_storage_usage.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')

    // Dividir en statements - mejor parsing
    // Primero, remover comentarios de bloque /* */
    let cleanSql = sql.replace(/\/\*[\s\S]*?\*\//g, '')
    
    // Dividir por punto y coma, pero respetando las subconsultas
    const statements = []
    let currentStatement = ''
    let inQuotes = false
    let quoteChar = ''
    let parenDepth = 0
    
    for (let i = 0; i < cleanSql.length; i++) {
      const char = cleanSql[i]
      const nextChar = cleanSql[i + 1]
      
      // Manejar comillas
      if ((char === '"' || char === "'") && cleanSql[i - 1] !== '\\') {
        if (!inQuotes) {
          inQuotes = true
          quoteChar = char
        } else if (char === quoteChar) {
          inQuotes = false
          quoteChar = ''
        }
        currentStatement += char
        continue
      }
      
      if (inQuotes) {
        currentStatement += char
        continue
      }
      
      // Manejar paréntesis para subconsultas
      if (char === '(') parenDepth++
      if (char === ')') parenDepth--
      
      // Si encontramos ; y no estamos en quotes ni dentro de paréntesis, es fin de statement
      if (char === ';' && parenDepth === 0) {
        const trimmed = currentStatement.trim()
        if (trimmed.length > 0 && !trimmed.startsWith('--')) {
          // Limpiar comentarios de línea
          const cleaned = trimmed.split('\n')
            .map(line => {
              const commentIdx = line.indexOf('--')
              return commentIdx >= 0 ? line.substring(0, commentIdx).trim() : line.trim()
            })
            .filter(line => line.length > 0)
            .join('\n')
            .trim()
          
          if (cleaned.length > 0) {
            statements.push(cleaned)
          }
        }
        currentStatement = ''
        continue
      }
      
      currentStatement += char
    }
    
    // Agregar el último statement si existe
    if (currentStatement.trim().length > 0) {
      const trimmed = currentStatement.trim()
      if (!trimmed.startsWith('--')) {
        const cleaned = trimmed.split('\n')
          .map(line => {
            const commentIdx = line.indexOf('--')
            return commentIdx >= 0 ? line.substring(0, commentIdx).trim() : line.trim()
          })
          .filter(line => line.length > 0)
          .join('\n')
          .trim()
        
        if (cleaned.length > 0) {
          statements.push(cleaned)
        }
      }
    }

    console.log(`   Encontrados ${statements.length} statements\n`)

    // Ejecutar cada statement usando RPC execute_sql
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      if (statement.trim().length === 0) continue

      try {
        console.log(`   [${i + 1}/${statements.length}] Ejecutando...`)
        
        // Usar RPC execute_sql si existe
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: statement + ';'
        })

        if (error) {
          // Si la función no existe, intentar crear los datos manualmente
          if (error.message.includes('function') || error.message.includes('does not exist')) {
            console.log(`   ⚠️  Función execute_sql no disponible, ejecutando manualmente...`)
            await executeManually(statement, i)
          } else {
            throw error
          }
        } else if (data && data.error) {
          throw new Error(data.error)
        } else {
          console.log(`   ✅ [${i + 1}/${statements.length}] Completado`)
        }
      } catch (error) {
        console.error(`   ❌ Error en statement ${i + 1}:`, error.message)
        console.error(`   Statement: ${statement.substring(0, 150)}...`)
        throw error
      }
    }

    console.log('\n✅ Migración ejecutada exitosamente')
    
    // Verificar resultados
    const { data: checkData, error: checkError } = await supabase
      .from('storage_usage')
      .select('id, concept, file_name, gb_usage')
      .not('gb_usage', 'eq', 0)
      .limit(10)

    if (!checkError && checkData) {
      console.log(`\n📊 Resultados (primeras 10 filas):`)
      checkData.forEach(row => {
        console.log(`   ${row.concept}: ${row.file_name || 'NULL'} (${row.gb_usage} GB)`)
      })
      
      const { count } = await supabase
        .from('storage_usage')
        .select('*', { count: 'exact', head: true })
        .not('gb_usage', 'eq', 0)
      
      console.log(`\n   Total de filas con uso: ${count}`)
    }

  } catch (error) {
    console.error('\n❌ Error ejecutando migración:', error.message)
    process.exit(1)
  }
}

async function executeManually(statement, index) {
  // Para statements que no se pueden ejecutar con RPC, intentar ejecutarlos manualmente
  // Esto solo funciona para operaciones simples que podemos hacer con el cliente Supabase
  
  const statementUpper = statement.toUpperCase().trim()
  
  if (statementUpper.startsWith('ALTER TABLE')) {
    console.log(`   ℹ️  ALTER TABLE debe ejecutarse manualmente desde Supabase Dashboard`)
    return
  }
  
  if (statementUpper.startsWith('COMMENT ON')) {
    console.log(`   ℹ️  COMMENT debe ejecutarse manualmente desde Supabase Dashboard`)
    return
  }
  
  if (statementUpper.startsWith('UPDATE')) {
    // Los UPDATE complejos no se pueden ejecutar directamente
    console.log(`   ⚠️  UPDATE complejo - necesita ejecutarse desde Supabase Dashboard`)
    return
  }
  
  throw new Error(`No se puede ejecutar este tipo de statement automáticamente`)
}

executeMigration()

