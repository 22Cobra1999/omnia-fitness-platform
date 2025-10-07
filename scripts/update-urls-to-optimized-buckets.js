const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateUrlsToOptimizedBuckets() {
  console.log('🔄 ACTUALIZANDO URLs A BUCKETS OPTIMIZADOS')
  console.log('=' * 50)
  
  try {
    // 1. ACTUALIZAR activity_media URLs
    console.log('\n📸 1. ACTUALIZANDO activity_media URLs...')
    
    const { data: activityMedia, error: amError } = await supabase
      .from('activity_media')
      .select('*')
    
    if (amError) {
      console.log('  ❌ Error obteniendo activity_media:', amError.message)
    } else if (activityMedia && activityMedia.length > 0) {
      console.log(`  📊 ${activityMedia.length} registros de activity_media encontrados`)
      
      for (const media of activityMedia) {
        console.log(`\n  🔄 Procesando Activity ID: ${media.activity_id}`)
        
        let needsUpdate = false
        const updateData = {}
        
        // Actualizar imagen URL si existe
        if (media.image_url && !media.image_url.includes('product-media')) {
          console.log(`    🖼️ Actualizando imagen URL`)
          const fileName = media.image_url.split('/').pop()
          const newImageUrl = `${supabaseUrl}/storage/v1/object/public/product-media/images/products/${fileName}`
          updateData.image_url = newImageUrl
          needsUpdate = true
          console.log(`      🔗 Nueva URL: ${newImageUrl}`)
        }
        
        // Actualizar video URL si existe
        if (media.video_url && !media.video_url.includes('product-media')) {
          console.log(`    🎬 Actualizando video URL`)
          const fileName = media.video_url.split('/').pop()
          const newVideoUrl = `${supabaseUrl}/storage/v1/object/public/product-media/videos/products/${fileName}`
          updateData.video_url = newVideoUrl
          needsUpdate = true
          console.log(`      🔗 Nueva URL: ${newVideoUrl}`)
        }
        
        // Actualizar en base de datos si hay cambios
        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from('activity_media')
            .update(updateData)
            .eq('id', media.id)
          
          if (updateError) {
            console.log(`      ❌ Error actualizando DB: ${updateError.message}`)
          } else {
            console.log(`      ✅ URLs actualizadas en DB`)
          }
        } else {
          console.log(`      ✅ URLs ya están actualizadas`)
        }
      }
    }
    
    // 2. ACTUALIZAR coach_certifications URLs
    console.log('\n📜 2. ACTUALIZANDO coach_certifications URLs...')
    
    const { data: certifications, error: certError } = await supabase
      .from('coach_certifications')
      .select('*')
    
    if (certError) {
      console.log('  ❌ Error obteniendo certificaciones:', certError.message)
    } else if (certifications && certifications.length > 0) {
      console.log(`  📊 ${certifications.length} certificaciones encontradas`)
      
      for (const cert of certifications) {
        console.log(`\n  🔄 Procesando certificación: ${cert.name}`)
        
        if (cert.file_url && !cert.file_url.includes('user-media')) {
          console.log(`    📄 Actualizando certificado URL`)
          const fileName = cert.file_url.split('/').pop()
          const newFileUrl = `${supabaseUrl}/storage/v1/object/public/user-media/certificates/coaches/${fileName}`
          const newFilePath = `certificates/coaches/${fileName}`
          
          const { error: updateError } = await supabase
            .from('coach_certifications')
            .update({ 
              file_url: newFileUrl,
              file_path: newFilePath
            })
            .eq('id', cert.id)
          
          if (updateError) {
            console.log(`      ❌ Error actualizando DB: ${updateError.message}`)
          } else {
            console.log(`      ✅ URLs actualizadas en DB`)
            console.log(`      🔗 Nueva URL: ${newFileUrl}`)
            console.log(`      📁 Nuevo Path: ${newFilePath}`)
          }
        } else {
          console.log(`      ✅ URLs ya están actualizadas`)
        }
      }
    }
    
    // 3. VERIFICAR ACTUALIZACIONES
    console.log('\n✅ 3. VERIFICANDO ACTUALIZACIONES...')
    
    // Verificar activity_media actualizado
    const { data: updatedMedia, error: umError } = await supabase
      .from('activity_media')
      .select('id, activity_id, image_url, video_url')
    
    if (!umError && updatedMedia) {
      console.log('\n📸 activity_media actualizado:')
      updatedMedia.forEach(media => {
        console.log(`  🔗 Activity ${media.activity_id}:`)
        if (media.image_url) {
          const bucket = media.image_url.includes('product-media') ? '✅ product-media' : '❌ bucket anterior'
          console.log(`    🖼️ Imagen: ${bucket}`)
        }
        if (media.video_url) {
          const bucket = media.video_url.includes('product-media') ? '✅ product-media' : '❌ bucket anterior'
          console.log(`    🎬 Video: ${bucket}`)
        }
      })
    }
    
    // Verificar coach_certifications actualizado
    const { data: updatedCerts, error: ucError } = await supabase
      .from('coach_certifications')
      .select('id, name, file_url, file_path')
    
    if (!ucError && updatedCerts) {
      console.log('\n📜 coach_certifications actualizado:')
      updatedCerts.forEach(cert => {
        const bucket = cert.file_url.includes('user-media') ? '✅ user-media' : '❌ bucket anterior'
        console.log(`  📄 ${cert.name}: ${bucket}`)
        console.log(`    🔗 URL: ${cert.file_url}`)
        console.log(`    📁 Path: ${cert.file_path}`)
      })
    }
    
    // 4. RESUMEN FINAL
    console.log('\n🎉 4. ACTUALIZACIÓN COMPLETADA')
    console.log('=' * 40)
    
    console.log('\n✅ ESTRUCTURA FINAL OPTIMIZADA:')
    console.log('📁 user-media/')
    console.log('  └── certificates/coaches/ ← URLs de certificados actualizadas')
    console.log('📁 product-media/')
    console.log('  ├── images/products/ ← URLs de imágenes actualizadas')
    console.log('  └── videos/products/ ← URLs de videos actualizadas')
    
    console.log('\n🔗 URLs ACTUALIZADAS EN BASE DE DATOS:')
    console.log('📸 activity_media.image_url → product-media/images/products/')
    console.log('📸 activity_media.video_url → product-media/videos/products/')
    console.log('📜 coach_certifications.file_url → user-media/certificates/coaches/')
    console.log('📜 coach_certifications.file_path → certificates/coaches/')
    
    console.log('\n🎯 PRÓXIMOS PASOS:')
    console.log('1. ✅ URLs en base de datos actualizadas')
    console.log('2. 🔄 Mover archivos físicos a nuevos buckets (manual)')
    console.log('3. 🔄 Probar endpoints optimizados')
    console.log('4. 🔄 Actualizar componentes frontend')
    console.log('5. 🗑️ Limpiar buckets antiguos (después de migrar archivos)')
    
    console.log('\n⚠️ IMPORTANTE:')
    console.log('Las URLs están actualizadas pero los archivos físicos siguen en los buckets antiguos.')
    console.log('Debes mover manualmente los archivos desde product-images a los nuevos buckets:')
    console.log('- product-images/product-images/ → product-media/images/products/')
    console.log('- product-images/product-videos/ → product-media/videos/products/')
    console.log('- product-images/certificados/ → user-media/certificates/coaches/')
    
    console.log('\n🎉 ACTUALIZACIÓN DE URLs EXITOSA!')
    
  } catch (error) {
    console.error('❌ Error en actualización:', error)
  }
}

updateUrlsToOptimizedBuckets()
