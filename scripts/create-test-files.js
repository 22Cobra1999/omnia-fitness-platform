const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestFiles() {
  console.log('🔄 CREANDO ARCHIVOS DE PRUEBA EN BUCKETS OPTIMIZADOS')
  console.log('=' * 60)
  
  try {
    // 1. CREAR ARCHIVOS DE PRUEBA PARA PRODUCTOS
    console.log('\n📸 1. CREANDO ARCHIVOS DE PRUEBA PARA PRODUCTOS...')
    
    // Crear archivo de prueba para imagen
    const testImageContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const testImageBlob = new Blob([testImageContent], { type: 'image/png' })
    
    // Crear archivo de prueba para video
    const testVideoContent = Buffer.from('fake video content for testing')
    const testVideoBlob = new Blob([testVideoContent], { type: 'video/mp4' })
    
    // Crear archivo de prueba para certificado
    const testCertContent = Buffer.from('%PDF-1.4 fake pdf content for testing')
    const testCertBlob = new Blob([testCertContent], { type: 'application/pdf' })
    
    let createdCount = 0
    
    // Subir archivos de prueba a product-media
    console.log('  📤 Subiendo imagen de prueba...')
    const { error: imageError } = await supabase.storage
      .from('product-media')
      .upload('images/products/test-image.png', testImageBlob, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (imageError) {
      console.log(`    ❌ Error subiendo imagen: ${imageError.message}`)
    } else {
      console.log('    ✅ Imagen de prueba creada')
      createdCount++
    }
    
    console.log('  📤 Subiendo video de prueba...')
    const { error: videoError } = await supabase.storage
      .from('product-media')
      .upload('videos/products/test-video.mp4', testVideoBlob, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (videoError) {
      console.log(`    ❌ Error subiendo video: ${videoError.message}`)
    } else {
      console.log('    ✅ Video de prueba creado')
      createdCount++
    }
    
    // Subir archivo de prueba a user-media
    console.log('  📤 Subiendo certificado de prueba...')
    const { error: certError } = await supabase.storage
      .from('user-media')
      .upload('certificates/coaches/test-certificate.pdf', testCertBlob, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (certError) {
      console.log(`    ❌ Error subiendo certificado: ${certError.message}`)
    } else {
      console.log('    ✅ Certificado de prueba creado')
      createdCount++
    }
    
    // 2. ACTUALIZAR URLs EN BASE DE DATOS
    console.log('\n📊 2. ACTUALIZANDO URLs EN BASE DE DATOS...')
    
    // Obtener URLs públicas de los archivos creados
    const imageUrl = supabase.storage.from('product-media').getPublicUrl('images/products/test-image.png').data.publicUrl
    const videoUrl = supabase.storage.from('product-media').getPublicUrl('videos/products/test-video.mp4').data.publicUrl
    const certUrl = supabase.storage.from('user-media').getPublicUrl('certificates/coaches/test-certificate.pdf').data.publicUrl
    
    console.log(`    🖼️ URL de imagen: ${imageUrl}`)
    console.log(`    🎬 URL de video: ${videoUrl}`)
    console.log(`    📜 URL de certificado: ${certUrl}`)
    
    // Actualizar activity_media con archivos de prueba
    const { data: activityMedia, error: amError } = await supabase
      .from('activity_media')
      .select('id, activity_id')
    
    if (!amError && activityMedia && activityMedia.length > 0) {
      console.log(`    📸 Actualizando ${activityMedia.length} registros de activity_media...`)
      
      for (let i = 0; i < activityMedia.length; i++) {
        const media = activityMedia[i]
        const { error: updateError } = await supabase
          .from('activity_media')
          .update({
            image_url: imageUrl,
            video_url: i === 0 ? videoUrl : null // Solo el primero tendrá video
          })
          .eq('id', media.id)
        
        if (updateError) {
          console.log(`    ❌ Error actualizando media ${media.id}: ${updateError.message}`)
        } else {
          console.log(`    ✅ Media ${media.id} actualizado`)
        }
      }
    }
    
    // Actualizar coach_certifications con archivo de prueba
    const { data: certifications, error: certError2 } = await supabase
      .from('coach_certifications')
      .select('id, name')
    
    if (!certError2 && certifications && certifications.length > 0) {
      console.log(`    📜 Actualizando ${certifications.length} certificaciones...`)
      
      for (const cert of certifications) {
        const { error: updateError } = await supabase
          .from('coach_certifications')
          .update({
            file_url: certUrl,
            file_path: 'certificates/coaches/test-certificate.pdf'
          })
          .eq('id', cert.id)
        
        if (updateError) {
          console.log(`    ❌ Error actualizando certificación ${cert.id}: ${updateError.message}`)
        } else {
          console.log(`    ✅ Certificación ${cert.id} actualizada`)
        }
      }
    }
    
    // 3. VERIFICAR ARCHIVOS CREADOS
    console.log('\n✅ 3. VERIFICANDO ARCHIVOS CREADOS...')
    
    // Verificar product-media
    console.log('\n📁 Verificando product-media:')
    const { data: productMediaFiles, error: pmError } = await supabase.storage
      .from('product-media')
      .list('', { limit: 50 })
    
    if (!pmError && productMediaFiles) {
      console.log(`  📊 ${productMediaFiles.length} elementos en product-media`)
      for (const item of productMediaFiles) {
        if (item.name !== '.emptyFolderPlaceholder') {
          console.log(`    📁 ${item.name}/`)
          
          // Listar contenido de la carpeta
          const { data: folderFiles, error: folderError } = await supabase.storage
            .from('product-media')
            .list(item.name, { limit: 10 })
          
          if (!folderError && folderFiles) {
            folderFiles.forEach(file => {
              if (file.name !== '.emptyFolderPlaceholder') {
                console.log(`      📄 ${file.name}`)
              }
            })
          }
        }
      }
    }
    
    // Verificar user-media
    console.log('\n📁 Verificando user-media:')
    const { data: userMediaFiles, error: umError } = await supabase.storage
      .from('user-media')
      .list('', { limit: 50 })
    
    if (!umError && userMediaFiles) {
      console.log(`  📊 ${userMediaFiles.length} elementos en user-media`)
      for (const item of userMediaFiles) {
        if (item.name !== '.emptyFolderPlaceholder') {
          console.log(`    📁 ${item.name}/`)
          
          // Listar contenido de la carpeta
          const { data: folderFiles, error: folderError } = await supabase.storage
            .from('user-media')
            .list(item.name, { limit: 10 })
          
          if (!folderError && folderFiles) {
            folderFiles.forEach(file => {
              if (file.name !== '.emptyFolderPlaceholder') {
                console.log(`      📄 ${file.name}`)
              }
            })
          }
        }
      }
    }
    
    // 4. RESUMEN
    console.log('\n🎉 4. ARCHIVOS DE PRUEBA CREADOS')
    console.log('=' * 40)
    
    console.log(`✅ Archivos creados: ${createdCount}`)
    
    console.log('\n📁 ESTRUCTURA FINAL:')
    console.log('📁 product-media/')
    console.log('  ├── images/products/test-image.png     ← Imagen de prueba')
    console.log('  └── videos/products/test-video.mp4     ← Video de prueba')
    console.log('📁 user-media/')
    console.log('  └── certificates/coaches/test-certificate.pdf ← Certificado de prueba')
    
    console.log('\n🔗 URLs ACTUALIZADAS EN BASE DE DATOS:')
    console.log('📸 activity_media.image_url → Archivos de prueba')
    console.log('📸 activity_media.video_url → Archivos de prueba')
    console.log('📜 coach_certifications.file_url → Archivo de prueba')
    
    console.log('\n🎯 PRÓXIMOS PASOS:')
    console.log('1. ✅ Archivos de prueba creados')
    console.log('2. ✅ URLs en base de datos actualizadas')
    console.log('3. 🔄 Probar carga de imágenes/videos en frontend')
    console.log('4. 🔄 Probar subida de nuevos archivos')
    
    console.log('\n🎉 ¡SISTEMA LISTO PARA PRUEBAS!')
    
  } catch (error) {
    console.error('❌ Error creando archivos de prueba:', error)
  }
}

createTestFiles()
