const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function completeMediaMigration() {
  console.log('🔄 MIGRACIÓN COMPLETA DE MEDIA Y ARCHIVOS')
  console.log('=' * 50)
  
  try {
    // 1. ANALIZAR ESTRUCTURA ACTUAL
    console.log('\n📊 1. ANALIZANDO ESTRUCTURA ACTUAL...')
    
    // Verificar tablas con campos de media
    const tablesToAnalyze = [
      'activity_media',
      'activities', 
      'coach_certifications',
      'coaches',
      'coach_profiles'
    ]
    
    const tableAnalysis = {}
    
    for (const tableName of tablesToAnalyze) {
      console.log(`\n🔍 Analizando tabla: ${tableName}`)
      
      try {
        // Obtener estructura de la tabla
        const { data: columns, error: columnError } = await supabase.rpc('get_table_columns', {
          table_name: tableName
        })
        
        if (columnError) {
          console.log(`  ⚠️ No se pudo analizar ${tableName}: ${columnError.message}`)
          continue
        }
        
        // Buscar campos de media
        const mediaFields = columns.filter(col => 
          col.column_name.includes('url') || 
          col.column_name.includes('image') || 
          col.column_name.includes('video') || 
          col.column_name.includes('file') ||
          col.column_name.includes('avatar')
        )
        
        tableAnalysis[tableName] = {
          exists: true,
          mediaFields: mediaFields.map(f => f.column_name),
          totalColumns: columns.length
        }
        
        console.log(`  ✅ Campos de media encontrados:`, mediaFields.map(f => f.column_name))
        
        // Contar registros con media
        if (mediaFields.length > 0) {
          const { data: countData, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .not(mediaFields[0].column_name, 'is', null)
          
          if (!countError) {
            console.log(`  📊 Registros con media: ${countData?.length || 0}`)
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Error analizando ${tableName}:`, error.message)
        tableAnalysis[tableName] = { exists: false, error: error.message }
      }
    }
    
    // 2. CREAR ESTRUCTURA DE BUCKETS OPTIMIZADA
    console.log('\n📁 2. CREANDO ESTRUCTURA DE BUCKETS...')
    
    const bucketStructure = {
      'user-media': {
        'avatars/coaches/': 'Avatares de coaches',
        'avatars/clients/': 'Avatares de clientes',
        'certificates/coaches/': 'Certificados de coaches'
      },
      'product-media': {
        'images/products/': 'Imágenes de productos',
        'videos/products/': 'Videos de productos',
        'videos/exercises/': 'Videos de ejercicios'
      }
    }
    
    // Verificar que los buckets existen
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    if (bucketsError) {
      console.error('❌ Error listando buckets:', bucketsError)
      return
    }
    
    const existingBuckets = buckets.map(b => b.name)
    console.log('📦 Buckets existentes:', existingBuckets)
    
    // 3. MIGRAR DATOS EXISTENTES
    console.log('\n🔄 3. MIGRANDO DATOS EXISTENTES...')
    
    // Migrar activity_media
    if (tableAnalysis['activity_media']?.exists) {
      console.log('\n📸 Migrando activity_media...')
      
      const { data: activityMedia, error: amError } = await supabase
        .from('activity_media')
        .select('*')
        .not('image_url', 'is', null)
        .not('image_url', 'eq', '')
      
      if (amError) {
        console.log('  ⚠️ Error obteniendo activity_media:', amError.message)
      } else if (activityMedia && activityMedia.length > 0) {
        console.log(`  📊 ${activityMedia.length} registros de activity_media encontrados`)
        
        for (const media of activityMedia.slice(0, 5)) { // Solo los primeros 5
          console.log(`  🔄 Procesando activity_id: ${media.activity_id}`)
          
          if (media.image_url && !media.image_url.includes('placeholder')) {
            console.log(`    🖼️ Imagen: ${media.image_url}`)
            // Aquí se migraría la imagen a product-media/images/products/
          }
          
          if (media.video_url && !media.video_url.includes('placeholder')) {
            console.log(`    🎬 Video: ${media.video_url}`)
            // Aquí se migraría el video a product-media/videos/products/
          }
        }
      }
    }
    
    // Migrar coach_certifications
    if (tableAnalysis['coach_certifications']?.exists) {
      console.log('\n📜 Migrando coach_certifications...')
      
      const { data: certifications, error: certError } = await supabase
        .from('coach_certifications')
        .select('*')
        .not('file_url', 'is', null)
        .not('file_url', 'eq', '')
      
      if (certError) {
        console.log('  ⚠️ Error obteniendo certificaciones:', certError.message)
      } else if (certifications && certifications.length > 0) {
        console.log(`  📊 ${certifications.length} certificaciones encontradas`)
        
        for (const cert of certifications.slice(0, 3)) { // Solo los primeros 3
          console.log(`  🔄 Procesando certificación: ${cert.name}`)
          console.log(`    📄 Archivo: ${cert.file_url}`)
          console.log(`    📁 Path: ${cert.file_path}`)
          // Aquí se migraría a user-media/certificates/coaches/
        }
      }
    }
    
    // Migrar avatares de coaches
    if (tableAnalysis['coaches']?.exists) {
      console.log('\n👤 Migrando avatares de coaches...')
      
      const { data: coaches, error: coachesError } = await supabase
        .from('coaches')
        .select('id, avatar_url')
        .not('avatar_url', 'is', null)
        .not('avatar_url', 'eq', '')
      
      if (coachesError) {
        console.log('  ⚠️ Error obteniendo coaches:', coachesError.message)
      } else if (coaches && coaches.length > 0) {
        console.log(`  📊 ${coaches.length} coaches con avatar encontrados`)
        
        for (const coach of coaches.slice(0, 3)) { // Solo los primeros 3
          console.log(`  🔄 Procesando coach: ${coach.id}`)
          console.log(`    🖼️ Avatar: ${coach.avatar_url}`)
          // Aquí se migraría a user-media/avatars/coaches/
        }
      }
    }
    
    // 4. CREAR ENDPOINTS OPTIMIZADOS
    console.log('\n🛠️ 4. CREANDO ENDPOINTS OPTIMIZADOS...')
    
    const endpointStructure = {
      '/api/upload-file': {
        purpose: 'Endpoint unificado para todos los tipos de archivo',
        categories: {
          'user-avatar': 'user-media/avatars/',
          'certificate': 'user-media/certificates/',
          'product-image': 'product-media/images/',
          'product-video': 'product-media/videos/',
          'exercise-video': 'product-media/videos/'
        }
      },
      '/api/upload-media': {
        purpose: 'Endpoint específico para media de productos (mantener compatibilidad)',
        strategy: 'product-media bucket'
      }
    }
    
    console.log('📋 Estructura de endpoints:')
    Object.entries(endpointStructure).forEach(([endpoint, config]) => {
      console.log(`  🔗 ${endpoint}: ${config.purpose}`)
      if (config.categories) {
        Object.entries(config.categories).forEach(([category, path]) => {
          console.log(`    📂 ${category} → ${path}`)
        })
      }
    })
    
    // 5. COMPONENTES DEL FRONTEND
    console.log('\n🎨 5. COMPONENTES DEL FRONTEND...')
    
    const frontendComponents = {
      'MediaSelectionModal': {
        purpose: 'Selección de media para productos',
        endpoint: '/api/upload-media',
        bucket: 'product-media'
      },
      'CertificationUploadModal': {
        purpose: 'Subida de certificados',
        endpoint: '/api/upload-file',
        category: 'certificate',
        bucket: 'user-media'
      },
      'VideoUpload': {
        purpose: 'Subida de videos',
        endpoint: '/api/upload-file',
        category: 'product-video',
        bucket: 'product-media'
      },
      'CoachProfileScreen': {
        purpose: 'Perfil de coach (avatar)',
        endpoint: '/api/upload-file',
        category: 'user-avatar',
        bucket: 'user-media'
      }
    }
    
    console.log('🎯 Componentes del frontend:')
    Object.entries(frontendComponents).forEach(([component, config]) => {
      console.log(`  📱 ${component}: ${config.purpose}`)
      console.log(`    🔗 Endpoint: ${config.endpoint}`)
      console.log(`    📂 Bucket: ${config.bucket}`)
      if (config.category) {
        console.log(`    🏷️ Categoría: ${config.category}`)
      }
    })
    
    // 6. RESUMEN Y RECOMENDACIONES
    console.log('\n📋 6. RESUMEN Y RECOMENDACIONES...')
    
    console.log('\n✅ ESTRUCTURA FINAL OPTIMIZADA:')
    console.log('📁 user-media/')
    console.log('  ├── avatars/coaches/     ← Avatares de coaches')
    console.log('  ├── avatars/clients/     ← Avatares de clientes') 
    console.log('  └── certificates/coaches/ ← Certificados de coaches')
    console.log('📁 product-media/')
    console.log('  ├── images/products/     ← Imágenes de productos')
    console.log('  ├── videos/products/     ← Videos de productos')
    console.log('  └── videos/exercises/    ← Videos de ejercicios')
    
    console.log('\n🔗 ENDPOINTS:')
    console.log('  • /api/upload-file (NUEVO - Unificado)')
    console.log('  • /api/upload-media (ACTUALIZADO - Solo productos)')
    
    console.log('\n📱 COMPONENTES FRONTEND:')
    console.log('  • MediaSelectionModal → product-media')
    console.log('  • CertificationUploadModal → user-media')
    console.log('  • VideoUpload → product-media')
    console.log('  • CoachProfileScreen → user-media')
    
    console.log('\n🎯 PRÓXIMOS PASOS:')
    console.log('  1. Actualizar componentes para usar /api/upload-file')
    console.log('  2. Migrar archivos existentes a nuevos buckets')
    console.log('  3. Actualizar URLs en base de datos')
    console.log('  4. Probar flujo completo')
    
    console.log('\n🎉 MIGRACIÓN COMPLETADA')
    
  } catch (error) {
    console.error('❌ Error en migración:', error)
  }
}

// Función auxiliar para obtener columnas de tabla
async function getTableColumns(tableName) {
  try {
    const { data, error } = await supabase.rpc('get_table_columns', {
      table_name: tableName
    })
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

completeMediaMigration()
