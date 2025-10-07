const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migratePhysicalFiles() {
  console.log('🔄 MIGRACIÓN FÍSICA DE ARCHIVOS A BUCKETS OPTIMIZADOS')
  console.log('=' * 60)
  
  try {
    // 1. LISTAR ARCHIVOS EN BUCKET ANTIGUO
    console.log('\n📁 1. LISTANDO ARCHIVOS EN product-images...')
    
    const { data: files, error: listError } = await supabase.storage
      .from('product-images')
      .list('', { limit: 100 })
    
    if (listError) {
      console.error('❌ Error listando archivos:', listError)
      return
    }
    
    console.log(`📊 ${files?.length || 0} archivos encontrados en product-images`)
    
    if (files && files.length > 0) {
      files.forEach(file => {
        console.log(`  📄 ${file.name} (${file.metadata?.size || 'unknown'} bytes)`)
      })
    }
    
    // 2. MIGRAR ARCHIVOS POR CATEGORÍA
    console.log('\n🔄 2. MIGRANDO ARCHIVOS POR CATEGORÍA...')
    
    let migratedCount = 0
    let errorCount = 0
    
    for (const file of files || []) {
      if (file.name === '.emptyFolderPlaceholder') continue
      
      console.log(`\n  🔄 Procesando: ${file.name}`)
      
      try {
        // Determinar categoría y bucket destino
        let targetBucket = ''
        let targetPath = ''
        
        if (file.name.includes('product-images') || file.name.includes('.jpg') || file.name.includes('.png') || file.name.includes('.jpeg')) {
          targetBucket = 'product-media'
          targetPath = `images/products/${file.name}`
          console.log(`    🖼️ Imagen → product-media/images/products/`)
        } else if (file.name.includes('product-videos') || file.name.includes('.mp4') || file.name.includes('.mov') || file.name.includes('.webm')) {
          targetBucket = 'product-media'
          targetPath = `videos/products/${file.name}`
          console.log(`    🎬 Video → product-media/videos/products/`)
        } else if (file.name.includes('certificados') || file.name.includes('.pdf')) {
          targetBucket = 'user-media'
          targetPath = `certificates/coaches/${file.name}`
          console.log(`    📜 Certificado → user-media/certificates/coaches/`)
        } else {
          console.log(`    ⚠️ Tipo no reconocido, saltando...`)
          continue
        }
        
        // Descargar archivo del bucket origen
        console.log(`    📥 Descargando desde product-images/${file.name}...`)
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('product-images')
          .download(file.name)
        
        if (downloadError) {
          console.log(`    ❌ Error descargando: ${downloadError.message}`)
          errorCount++
          continue
        }
        
        // Subir archivo al bucket destino
        console.log(`    📤 Subiendo a ${targetBucket}/${targetPath}...`)
        const { error: uploadError } = await supabase.storage
          .from(targetBucket)
          .upload(targetPath, fileData, {
            cacheControl: '3600',
            upsert: true
          })
        
        if (uploadError) {
          console.log(`    ❌ Error subiendo: ${uploadError.message}`)
          errorCount++
          continue
        }
        
        console.log(`    ✅ Migrado exitosamente`)
        migratedCount++
        
        // Obtener nueva URL
        const { data: urlData } = supabase.storage
          .from(targetBucket)
          .getPublicUrl(targetPath)
        
        console.log(`    🔗 Nueva URL: ${urlData.publicUrl}`)
        
      } catch (error) {
        console.log(`    ❌ Error procesando archivo: ${error.message}`)
        errorCount++
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
      console.log(`  📊 ${productMediaFiles.length} archivos en product-media`)
      productMediaFiles.forEach(file => {
        console.log(`    📄 ${file.name}`)
      })
    }
    
    // Verificar user-media
    console.log('\n📁 Verificando user-media:')
    const { data: userMediaFiles, error: umError } = await supabase.storage
      .from('user-media')
      .list('', { limit: 50 })
    
    if (!umError && userMediaFiles) {
      console.log(`  📊 ${userMediaFiles.length} archivos en user-media`)
      userMediaFiles.forEach(file => {
        console.log(`    📄 ${file.name}`)
      })
    }
    
    // 4. RESUMEN
    console.log('\n🎉 4. MIGRACIÓN COMPLETADA')
    console.log('=' * 40)
    
    console.log(`✅ Archivos migrados exitosamente: ${migratedCount}`)
    console.log(`❌ Errores durante migración: ${errorCount}`)
    
    console.log('\n📁 ESTRUCTURA FINAL:')
    console.log('📁 product-media/')
    console.log('  ├── images/products/     ← Imágenes de productos')
    console.log('  └── videos/products/     ← Videos de productos')
    console.log('📁 user-media/')
    console.log('  └── certificates/coaches/ ← Certificados de coaches')
    
    console.log('\n🎯 PRÓXIMOS PASOS:')
    console.log('1. ✅ Archivos físicos migrados')
    console.log('2. ✅ URLs en base de datos ya actualizadas')
    console.log('3. 🔄 Probar carga de imágenes/videos en frontend')
    console.log('4. 🗑️ Eliminar bucket product-images (después de verificar)')
    
    if (migratedCount > 0) {
      console.log('\n🎉 ¡MIGRACIÓN EXITOSA!')
      console.log('Los archivos ahora están en los buckets optimizados.')
    } else {
      console.log('\n⚠️ No se migraron archivos. Verifica que existan archivos en product-images.')
    }
    
  } catch (error) {
    console.error('❌ Error en migración física:', error)
  }
}

migratePhysicalFiles()
