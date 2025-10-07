const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateFromExistingUrls() {
  console.log('🔄 MIGRACIÓN DESDE URLs EXISTENTES EN BASE DE DATOS')
  console.log('=' * 60)
  
  try {
    // 1. OBTENER URLs DE activity_media
    console.log('\n📸 1. OBTENIENDO URLs DE activity_media...')
    
    const { data: activityMedia, error: amError } = await supabase
      .from('activity_media')
      .select('id, activity_id, image_url, video_url')
    
    if (amError) {
      console.error('❌ Error obteniendo activity_media:', amError)
      return
    }
    
    console.log(`📊 ${activityMedia?.length || 0} registros de activity_media encontrados`)
    
    let migratedCount = 0
    let errorCount = 0
    
    for (const media of activityMedia || []) {
      console.log(`\n  🔄 Procesando Activity ID: ${media.activity_id}`)
      
      // Procesar imagen
      if (media.image_url && !media.image_url.includes('placeholder')) {
        console.log(`    🖼️ Procesando imagen: ${media.image_url}`)
        
        try {
          // Extraer nombre del archivo de la URL
          const fileName = media.image_url.split('/').pop()
          console.log(`    📄 Nombre del archivo: ${fileName}`)
          
          // Intentar descargar desde diferentes buckets posibles
          const possibleBuckets = ['product-images', 'product-media', 'public']
          let fileData = null
          let sourceBucket = null
          
          for (const bucket of possibleBuckets) {
            try {
              console.log(`    🔍 Intentando descargar desde ${bucket}/${fileName}...`)
              const { data, error } = await supabase.storage
                .from(bucket)
                .download(fileName)
              
              if (!error && data) {
                fileData = data
                sourceBucket = bucket
                console.log(`    ✅ Encontrado en ${bucket}`)
                break
              }
            } catch (error) {
              console.log(`    ⚠️ No encontrado en ${bucket}`)
            }
          }
          
          if (!fileData) {
            console.log(`    ❌ Archivo no encontrado en ningún bucket`)
            errorCount++
            continue
          }
          
          // Subir a bucket optimizado
          const targetPath = `images/products/${fileName}`
          console.log(`    📤 Subiendo a product-media/${targetPath}...`)
          
          const { error: uploadError } = await supabase.storage
            .from('product-media')
            .upload(targetPath, fileData, {
              cacheControl: '3600',
              upsert: true
            })
          
          if (uploadError) {
            console.log(`    ❌ Error subiendo: ${uploadError.message}`)
            errorCount++
            continue
          }
          
          console.log(`    ✅ Imagen migrada exitosamente`)
          migratedCount++
          
        } catch (error) {
          console.log(`    ❌ Error procesando imagen: ${error.message}`)
          errorCount++
        }
      }
      
      // Procesar video
      if (media.video_url && !media.video_url.includes('placeholder')) {
        console.log(`    🎬 Procesando video: ${media.video_url}`)
        
        try {
          // Extraer nombre del archivo de la URL
          const fileName = media.video_url.split('/').pop()
          console.log(`    📄 Nombre del archivo: ${fileName}`)
          
          // Intentar descargar desde diferentes buckets posibles
          const possibleBuckets = ['product-images', 'product-media', 'public']
          let fileData = null
          let sourceBucket = null
          
          for (const bucket of possibleBuckets) {
            try {
              console.log(`    🔍 Intentando descargar desde ${bucket}/${fileName}...`)
              const { data, error } = await supabase.storage
                .from(bucket)
                .download(fileName)
              
              if (!error && data) {
                fileData = data
                sourceBucket = bucket
                console.log(`    ✅ Encontrado en ${bucket}`)
                break
              }
            } catch (error) {
              console.log(`    ⚠️ No encontrado en ${bucket}`)
            }
          }
          
          if (!fileData) {
            console.log(`    ❌ Archivo no encontrado en ningún bucket`)
            errorCount++
            continue
          }
          
          // Subir a bucket optimizado
          const targetPath = `videos/products/${fileName}`
          console.log(`    📤 Subiendo a product-media/${targetPath}...`)
          
          const { error: uploadError } = await supabase.storage
            .from('product-media')
            .upload(targetPath, fileData, {
              cacheControl: '3600',
              upsert: true
            })
          
          if (uploadError) {
            console.log(`    ❌ Error subiendo: ${uploadError.message}`)
            errorCount++
            continue
          }
          
          console.log(`    ✅ Video migrado exitosamente`)
          migratedCount++
          
        } catch (error) {
          console.log(`    ❌ Error procesando video: ${error.message}`)
          errorCount++
        }
      }
    }
    
    // 2. OBTENER URLs DE coach_certifications
    console.log('\n📜 2. OBTENIENDO URLs DE coach_certifications...')
    
    const { data: certifications, error: certError } = await supabase
      .from('coach_certifications')
      .select('id, name, file_url')
    
    if (certError) {
      console.error('❌ Error obteniendo coach_certifications:', certError)
    } else if (certifications && certifications.length > 0) {
      console.log(`📊 ${certifications.length} certificaciones encontradas`)
      
      for (const cert of certifications) {
        console.log(`\n  🔄 Procesando certificación: ${cert.name}`)
        console.log(`    📄 URL: ${cert.file_url}`)
        
        try {
          // Extraer nombre del archivo de la URL
          const fileName = cert.file_url.split('/').pop()
          console.log(`    📄 Nombre del archivo: ${fileName}`)
          
          // Intentar descargar desde diferentes buckets posibles
          const possibleBuckets = ['product-images', 'user-media', 'public']
          let fileData = null
          let sourceBucket = null
          
          for (const bucket of possibleBuckets) {
            try {
              console.log(`    🔍 Intentando descargar desde ${bucket}/${fileName}...`)
              const { data, error } = await supabase.storage
                .from(bucket)
                .download(fileName)
              
              if (!error && data) {
                fileData = data
                sourceBucket = bucket
                console.log(`    ✅ Encontrado en ${bucket}`)
                break
              }
            } catch (error) {
              console.log(`    ⚠️ No encontrado en ${bucket}`)
            }
          }
          
          if (!fileData) {
            console.log(`    ❌ Archivo no encontrado en ningún bucket`)
            errorCount++
            continue
          }
          
          // Subir a bucket optimizado
          const targetPath = `certificates/coaches/${fileName}`
          console.log(`    📤 Subiendo a user-media/${targetPath}...`)
          
          const { error: uploadError } = await supabase.storage
            .from('user-media')
            .upload(targetPath, fileData, {
              cacheControl: '3600',
              upsert: true
            })
          
          if (uploadError) {
            console.log(`    ❌ Error subiendo: ${uploadError.message}`)
            errorCount++
            continue
          }
          
          console.log(`    ✅ Certificado migrado exitosamente`)
          migratedCount++
          
        } catch (error) {
          console.log(`    ❌ Error procesando certificado: ${error.message}`)
          errorCount++
        }
      }
    }
    
    // 3. VERIFICAR MIGRACIÓN
    console.log('\n✅ 3. VERIFICANDO MIGRACIÓN...')
    
    // Verificar product-media
    console.log('\n📁 Verificando product-media:')
    const { data: productMediaFiles, error: pmError } = await supabase.storage
      .from('product-media')
      .list('', { limit: 50 })
    
    if (!pmError && productMediaFiles) {
      console.log(`  📊 ${productMediaFiles.length} elementos en product-media`)
      productMediaFiles.forEach(item => {
        console.log(`    📁 ${item.name}/`)
      })
    }
    
    // Verificar user-media
    console.log('\n📁 Verificando user-media:')
    const { data: userMediaFiles, error: umError } = await supabase.storage
      .from('user-media')
      .list('', { limit: 50 })
    
    if (!umError && userMediaFiles) {
      console.log(`  📊 ${userMediaFiles.length} elementos en user-media`)
      userMediaFiles.forEach(item => {
        console.log(`    📁 ${item.name}/`)
      })
    }
    
    // 4. RESUMEN
    console.log('\n🎉 4. MIGRACIÓN COMPLETADA')
    console.log('=' * 40)
    
    console.log(`✅ Archivos migrados exitosamente: ${migratedCount}`)
    console.log(`❌ Errores durante migración: ${errorCount}`)
    
    if (migratedCount > 0) {
      console.log('\n🎉 ¡MIGRACIÓN EXITOSA!')
      console.log('Los archivos ahora están en los buckets optimizados.')
      console.log('\n📁 ESTRUCTURA FINAL:')
      console.log('📁 product-media/')
      console.log('  ├── images/products/     ← Imágenes migradas')
      console.log('  └── videos/products/     ← Videos migrados')
      console.log('📁 user-media/')
      console.log('  └── certificates/coaches/ ← Certificados migrados')
    } else {
      console.log('\n⚠️ No se pudieron migrar archivos.')
      console.log('Los archivos originales no se encontraron en los buckets disponibles.')
    }
    
  } catch (error) {
    console.error('❌ Error en migración:', error)
  }
}

migrateFromExistingUrls()
