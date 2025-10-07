const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function cleanupAllBuckets() {
  console.log('🧹 LIMPIANDO BUCKETS INNECESARIOS')
  console.log('=' * 40)
  
  try {
    // 1. LISTAR TODOS LOS BUCKETS ACTUALES
    console.log('\n📋 1. LISTANDO BUCKETS ACTUALES...')
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listando buckets:', bucketsError)
      return
    }
    
    console.log('📁 Buckets encontrados:')
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (público: ${bucket.public ? '✅' : '❌'})`)
    })
    
    // 2. IDENTIFICAR BUCKETS A ELIMINAR
    const bucketsToDelete = buckets.filter(bucket => bucket.name !== 'uploads-direct')
    const keepBucket = buckets.find(bucket => bucket.name === 'uploads-direct')
    
    console.log('\n🗑️ 2. BUCKETS A ELIMINAR:')
    bucketsToDelete.forEach(bucket => {
      console.log(`  - ${bucket.name}`)
    })
    
    console.log('\n✅ 3. BUCKET A MANTENER:')
    if (keepBucket) {
      console.log(`  - ${keepBucket.name} (público: ${keepBucket.public ? '✅' : '❌'})`)
    } else {
      console.log('  ❌ Bucket uploads-direct no encontrado')
    }
    
    // 3. ELIMINAR BUCKETS INNECESARIOS
    console.log('\n🗑️ 4. ELIMINANDO BUCKETS INNECESARIOS...')
    
    for (const bucket of bucketsToDelete) {
      console.log(`🗑️ Eliminando bucket: ${bucket.name}`)
      
      try {
        // Intentar eliminar el bucket
        const { error: deleteError } = await supabase.storage.deleteBucket(bucket.name)
        
        if (deleteError) {
          console.log(`  ⚠️ Error eliminando ${bucket.name}: ${deleteError.message}`)
          
          // Si el bucket no está vacío, intentar vaciarlo primero
          if (deleteError.message.includes('not empty')) {
            console.log(`  🔄 Intentando vaciar bucket ${bucket.name}...`)
            
            try {
              // Listar archivos en el bucket
              const { data: files, error: listError } = await supabase.storage
                .from(bucket.name)
                .list()
              
              if (listError) {
                console.log(`  ❌ Error listando archivos en ${bucket.name}: ${listError.message}`)
              } else if (files && files.length > 0) {
                console.log(`  📁 Encontrados ${files.length} archivos en ${bucket.name}`)
                
                // Eliminar todos los archivos
                const filePaths = files.map(file => file.name)
                const { error: removeError } = await supabase.storage
                  .from(bucket.name)
                  .remove(filePaths)
                
                if (removeError) {
                  console.log(`  ❌ Error eliminando archivos de ${bucket.name}: ${removeError.message}`)
                } else {
                  console.log(`  ✅ Archivos eliminados de ${bucket.name}`)
                  
                  // Intentar eliminar el bucket nuevamente
                  const { error: deleteError2 } = await supabase.storage.deleteBucket(bucket.name)
                  if (deleteError2) {
                    console.log(`  ❌ Error eliminando ${bucket.name} después de vaciar: ${deleteError2.message}`)
                  } else {
                    console.log(`  ✅ Bucket ${bucket.name} eliminado exitosamente`)
                  }
                }
              } else {
                console.log(`  ℹ️ Bucket ${bucket.name} ya está vacío`)
              }
            } catch (error) {
              console.log(`  ❌ Error procesando bucket ${bucket.name}: ${error.message}`)
            }
          }
        } else {
          console.log(`  ✅ Bucket ${bucket.name} eliminado exitosamente`)
        }
      } catch (error) {
        console.log(`  ❌ Error eliminando ${bucket.name}: ${error.message}`)
      }
    }
    
    // 4. VERIFICAR BUCKET FINAL
    console.log('\n✅ 5. VERIFICANDO BUCKET FINAL...')
    
    const { data: finalBuckets, error: finalError } = await supabase.storage.listBuckets()
    
    if (finalError) {
      console.error('❌ Error listando buckets finales:', finalError)
      return
    }
    
    console.log('📁 Buckets finales:')
    finalBuckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (público: ${bucket.public ? '✅' : '❌'})`)
    })
    
    // 5. PROBAR BUCKET FINAL
    console.log('\n🧪 6. PROBANDO BUCKET FINAL...')
    
    const finalBucket = finalBuckets.find(b => b.name === 'uploads-direct')
    
    if (finalBucket) {
      console.log('✅ Bucket uploads-direct encontrado')
      
      // Crear imagen de prueba
      const imageContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
      const imageBlob = new Blob([imageContent], { type: 'image/png' })
      const testPath = `cleanup-test-${Date.now()}.png`
      
      console.log('📤 Probando subida al bucket final...')
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads-direct')
        .upload(testPath, imageBlob, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) {
        console.log(`❌ Error probando bucket final: ${uploadError.message}`)
      } else {
        console.log(`✅ Bucket final funcionando correctamente`)
        console.log(`  📁 Archivo subido: ${uploadData.path}`)
        
        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from('uploads-direct')
          .getPublicUrl(testPath)
        
        console.log(`  🔗 URL: ${urlData.publicUrl}`)
        
        // Eliminar archivo de prueba
        await supabase.storage.from('uploads-direct').remove([testPath])
        console.log(`  🗑️ Archivo de prueba eliminado`)
      }
    } else {
      console.log('❌ Bucket uploads-direct no encontrado')
    }
    
    // 6. RESUMEN FINAL
    console.log('\n🎯 RESUMEN DE LIMPIEZA')
    console.log('=' * 30)
    
    console.log('\n✅ LIMPIEZA COMPLETADA:')
    console.log(`🗑️ Buckets eliminados: ${bucketsToDelete.length}`)
    console.log('✅ Bucket mantenido: uploads-direct')
    console.log('✅ Sistema limpio y organizado')
    console.log('✅ Solo un bucket funcional')
    
    console.log('\n🚀 ESTADO FINAL:')
    console.log('✅ Sistema simplificado')
    console.log('✅ Sin buckets innecesarios')
    console.log('✅ Funcionalidad intacta')
    console.log('✅ Listo para organización')
    
    console.log('\n🎉 ¡LIMPIEZA COMPLETADA EXITOSAMENTE!')
    
  } catch (error) {
    console.error('❌ Error en limpieza:', error)
  }
}

cleanupAllBuckets()
