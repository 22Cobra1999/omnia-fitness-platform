const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanupBuckets() {
  console.log('🧹 Limpiando buckets innecesarios...')
  
  try {
    // Listar buckets existentes
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listando buckets:', listError)
      return
    }
    
    console.log('📦 Buckets existentes:')
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`)
    })
    
    // Buckets a mantener (estrategia optimizada)
    const keepBuckets = ['user-media', 'product-media']
    
    // Buckets a eliminar (innecesarios)
    const bucketsToDelete = buckets.filter(bucket => !keepBuckets.includes(bucket.name))
    
    console.log('\n🎯 Estrategia optimizada:')
    console.log('✅ Mantener:')
    keepBuckets.forEach(bucketName => {
      const exists = buckets.some(b => b.name === bucketName)
      console.log(`  - ${bucketName} ${exists ? '✅' : '❌ (no existe)'}`)
    })
    
    console.log('\n🗑️ Eliminar:')
    bucketsToDelete.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`)
    })
    
    if (bucketsToDelete.length === 0) {
      console.log('\n✅ No hay buckets innecesarios para eliminar')
      return
    }
    
    console.log('\n⚠️ ADVERTENCIA: Esta acción eliminará los buckets y TODO su contenido')
    console.log('¿Estás seguro de que quieres continuar? (Ctrl+C para cancelar)')
    
    // Esperar 3 segundos para que el usuario pueda cancelar
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    console.log('\n🗑️ Eliminando buckets innecesarios...')
    
    for (const bucket of bucketsToDelete) {
      console.log(`\n🔍 Verificando contenido del bucket '${bucket.name}'...`)
      
      try {
        // Listar archivos en el bucket
        const { data: files, error: listFilesError } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 10 })
        
        if (listFilesError) {
          console.log(`  ⚠️ Error listando archivos: ${listFilesError.message}`)
        } else {
          console.log(`  📁 Archivos encontrados: ${files?.length || 0}`)
          if (files && files.length > 0) {
            console.log(`  📋 Primeros archivos:`)
            files.slice(0, 3).forEach(file => {
              console.log(`    - ${file.name}`)
            })
            if (files.length > 3) {
              console.log(`    ... y ${files.length - 3} más`)
            }
          }
        }
        
        // Eliminar bucket
        console.log(`🗑️ Eliminando bucket '${bucket.name}'...`)
        const { error: deleteError } = await supabase.storage.deleteBucket(bucket.name)
        
        if (deleteError) {
          console.error(`❌ Error eliminando bucket '${bucket.name}':`, deleteError)
        } else {
          console.log(`✅ Bucket '${bucket.name}' eliminado exitosamente`)
        }
        
      } catch (error) {
        console.error(`❌ Error procesando bucket '${bucket.name}':`, error)
      }
    }
    
    console.log('\n🎉 Limpieza completada')
    console.log('\n📊 Buckets finales:')
    console.log('✅ user-media - Avatares, certificados y documentos de usuarios')
    console.log('✅ product-media - Imágenes y videos de productos y ejercicios')
    
  } catch (error) {
    console.error('❌ Error en limpieza:', error)
  }
}

cleanupBuckets()
