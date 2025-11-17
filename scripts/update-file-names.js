/**
 * Script para actualizar file_name en storage_usage usando Supabase client
 * Ejecuta solo los UPDATEs (la columna ya debe existir)
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

async function updateFileNames() {
  try {
    console.log('📝 Actualizando file_name en storage_usage...\n')

    // Obtener todas las filas que necesitan actualización
    const { data: rowsToUpdate, error: fetchError } = await supabase
      .from('storage_usage')
      .select('id, coach_id, concept, gb_usage, file_name')
      .not('gb_usage', 'eq', 0)
      .or('file_name.is.null,file_name.eq.')

    if (fetchError) {
      console.error('❌ Error obteniendo filas:', fetchError.message)
      return
    }

    if (!rowsToUpdate || rowsToUpdate.length === 0) {
      console.log('✅ No hay filas que necesiten actualización')
      return
    }

    console.log(`📊 Filas a actualizar: ${rowsToUpdate.length}\n`)

    // Para cada fila, necesitamos ejecutar el UPDATE correspondiente
    // Como no podemos ejecutar SQL complejo directamente, usaremos RPC si está disponible
    // O mejor, ejecutaremos el SQL usando una función RPC que ejecute el UPDATE completo

    // Intentar usar RPC execute_sql para cada UPDATE
    let updated = 0
    let errors = 0

    for (const row of rowsToUpdate) {
      try {
        // Construir el UPDATE específico para este coach y concepto
        let updateSql = ''
        
        if (row.concept === 'video') {
          updateSql = `
            UPDATE storage_usage su
            SET file_name = COALESCE(
              (
                SELECT file_name
                FROM (
                  SELECT 
                    CASE 
                      WHEN ed.nombre_ejercicio IS NOT NULL AND ed.nombre_ejercicio != '' THEN
                        ed.nombre_ejercicio || '.mp4'
                      WHEN ed.bunny_video_id IS NOT NULL THEN
                        'video_' || substring(ed.bunny_video_id from 1 for 12) || '.mp4'
                      WHEN ed.video_url IS NOT NULL AND ed.video_url != '' THEN
                        COALESCE(
                          substring(ed.video_url from '/([^/?#]+\.(mp4|mov|avi|webm))$'),
                          substring(ed.video_url from '/([^/?#]+)$'),
                          'video_' || ed.id::text || '.mp4'
                        )
                      ELSE NULL
                    END as file_name
                  FROM ejercicios_detalles ed
                  INNER JOIN activities a ON a.id = ed.activity_id
                  WHERE a.coach_id = '${row.coach_id}'
                    AND ed.video_url IS NOT NULL 
                    AND ed.video_url != ''
                  ORDER BY ed.id
                  LIMIT 1
                ) sub
                WHERE file_name IS NOT NULL
              ),
              (
                SELECT file_name
                FROM (
                  SELECT 
                    CASE 
                      WHEN am.bunny_video_id IS NOT NULL THEN
                        'video_' || substring(am.bunny_video_id from 1 for 12) || '.mp4'
                      WHEN am.video_url IS NOT NULL AND am.video_url != '' THEN
                        COALESCE(
                          substring(am.video_url from '/([^/?#]+\.(mp4|mov|avi|webm))$'),
                          substring(am.video_url from '/([^/?#]+)$'),
                          'video_' || am.id::text || '.mp4'
                        )
                      ELSE NULL
                    END as file_name
                  FROM activity_media am
                  INNER JOIN activities a ON a.id = am.activity_id
                  WHERE a.coach_id = '${row.coach_id}'
                    AND am.video_url IS NOT NULL 
                    AND am.video_url != ''
                  ORDER BY am.id
                  LIMIT 1
                ) sub
                WHERE file_name IS NOT NULL
              ),
              'video.mp4'
            )
            WHERE su.id = ${row.id}
              AND su.concept = 'video'
              AND (su.file_name IS NULL OR su.file_name = '')
          `
        } else if (row.concept === 'image') {
          updateSql = `
            UPDATE storage_usage su
            SET file_name = (
              SELECT file_name
              FROM (
                SELECT 
                  COALESCE(
                    substring(am.image_url from '/([^/?#]+)$'),
                    substring(am.image_url from '/([^/?#]+)\\?'),
                    'imagen_' || am.id::text || '.jpg'
                  ) as file_name
                FROM activity_media am
                INNER JOIN activities a ON a.id = am.activity_id
                WHERE a.coach_id = '${row.coach_id}'
                  AND am.image_url IS NOT NULL 
                  AND am.image_url != ''
                ORDER BY am.id
                LIMIT 1
              ) sub
              WHERE file_name IS NOT NULL
            )
            WHERE su.id = ${row.id}
              AND su.concept = 'image'
              AND (su.file_name IS NULL OR su.file_name = '')
          `
        } else if (row.concept === 'pdf') {
          updateSql = `
            UPDATE storage_usage su
            SET file_name = (
              SELECT file_name
              FROM (
                SELECT 
                  COALESCE(
                    substring(am.pdf_url from '/([^/?#]+)$'),
                    substring(am.pdf_url from '/([^/?#]+)\\?'),
                    'pdf_' || am.id::text || '.pdf'
                  ) as file_name
                FROM activity_media am
                INNER JOIN activities a ON a.id = am.activity_id
                WHERE a.coach_id = '${row.coach_id}'
                  AND am.pdf_url IS NOT NULL 
                  AND am.pdf_url != ''
                ORDER BY am.id
                LIMIT 1
              ) sub
              WHERE file_name IS NOT NULL
            )
            WHERE su.id = ${row.id}
              AND su.concept = 'pdf'
              AND (su.file_name IS NULL OR su.file_name = '')
          `
        }

        if (updateSql) {
          const { data, error } = await supabase.rpc('execute_sql', {
            sql_query: updateSql
          })

          if (error) {
            console.error(`   ❌ Error actualizando fila ${row.id} (${row.concept}):`, error.message)
            errors++
          } else if (data && data.error) {
            console.error(`   ❌ Error SQL en fila ${row.id}:`, data.error)
            errors++
          } else {
            console.log(`   ✅ Actualizado: ${row.concept} (id: ${row.id})`)
            updated++
          }
        }
      } catch (error) {
        console.error(`   ❌ Error procesando fila ${row.id}:`, error.message)
        errors++
      }
    }

    console.log(`\n📊 Resultados:`)
    console.log(`   ✅ Actualizadas: ${updated}`)
    console.log(`   ❌ Errores: ${errors}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

updateFileNames()


























