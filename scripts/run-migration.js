/**
 * Script para ejecutar migraciones SQL directamente en la base de datos
 */

const fs = require('fs')
const path = require('path')

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
    // Ignorar si no existe
  }
}

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables de entorno faltantes: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Extraer información de conexión de la URL de Supabase
// La URL de Supabase es: https://[project-ref].supabase.co
// Necesitamos construir la connection string de PostgreSQL
const supabaseUrlMatch = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)
if (!supabaseUrlMatch) {
  console.error('❌ No se pudo extraer el project ref de la URL de Supabase')
  process.exit(1)
}

const projectRef = supabaseUrlMatch[1]
// Intentar obtener la contraseña de diferentes fuentes
let dbPassword = process.env.SUPABASE_DB_PASSWORD || 
                 process.env.DATABASE_PASSWORD ||
                 process.env.POSTGRES_PASSWORD

// Si no está en las variables de entorno, intentar leerla de un archivo .env.local
if (!dbPassword) {
  try {
    const envLocal = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
    const passwordMatch = envLocal.match(/SUPABASE_DB_PASSWORD\s*=\s*["']?([^"'\n]+)["']?/)
    if (passwordMatch) {
      dbPassword = passwordMatch[1].trim()
    }
  } catch (e) {
    // Ignorar
  }
}

if (!dbPassword) {
  console.error('❌ Necesitas la contraseña de la base de datos')
  console.error('')
  console.error('   Opciones:')
  console.error('   1. Agregar SUPABASE_DB_PASSWORD a tu archivo .env.local')
  console.error('   2. Ejecutar: SUPABASE_DB_PASSWORD=tu_password node scripts/run-migration.js')
  console.error('')
  console.error('   Puedes encontrar la contraseña en:')
  console.error('   Supabase Dashboard > Settings > Database > Database Password')
  console.error('   O en: Supabase Dashboard > Project Settings > Database')
  console.error('')
  process.exit(1)
}

// Usar pg para conexión directa
const { Client } = require('pg')

const connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('🔌 Conectando a la base de datos...')
    await client.connect()
    console.log('✅ Conectado')

    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, '..', 'db', 'migrations', 'add_file_name_to_storage_usage.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')

    console.log('📝 Ejecutando migración...')
    
    // Dividir el SQL en statements individuales (separados por punto y coma)
    // Filtrar comentarios y líneas vacías
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
      .map(s => {
        // Remover comentarios de línea
        return s.split('\n')
          .map(line => {
            const commentIndex = line.indexOf('--')
            if (commentIndex >= 0) {
              return line.substring(0, commentIndex).trim()
            }
            return line.trim()
          })
          .filter(line => line.length > 0)
          .join('\n')
      })
      .filter(s => s.length > 0)
    
    console.log(`   Encontrados ${statements.length} statements para ejecutar`)
    
    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim().length === 0) continue
      
      try {
        console.log(`   [${i + 1}/${statements.length}] Ejecutando...`)
        await client.query(statement)
        console.log(`   ✅ [${i + 1}/${statements.length}] Completado`)
      } catch (error) {
        console.error(`   ❌ Error en statement ${i + 1}:`, error.message)
        console.error(`   Statement:`, statement.substring(0, 100) + '...')
        throw error
      }
    }
    
    console.log('✅ Migración ejecutada exitosamente')
    
    // Verificar que se insertaron datos
    const result = await client.query('SELECT COUNT(*) as count, COUNT(file_name) as with_file_name FROM storage_usage WHERE gb_usage > 0')
    console.log(`\n📊 Resultados:`)
    console.log(`   Total de filas con uso: ${result.rows[0].count}`)
    console.log(`   Filas con file_name: ${result.rows[0].with_file_name}`)
    
  } catch (error) {
    console.error('❌ Error ejecutando la migración:', error.message)
    if (error.code) {
      console.error(`   Código: ${error.code}`)
    }
    if (error.position) {
      console.error(`   Posición: ${error.position}`)
    }
    process.exit(1)
  } finally {
    await client.end()
    console.log('🔌 Desconectado')
  }
}

runMigration()

