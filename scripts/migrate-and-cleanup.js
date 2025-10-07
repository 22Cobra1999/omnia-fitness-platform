const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateAndCleanup() {
  console.log('🔄 Migrando archivos importantes y limpiando buckets...')
  
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
    
    // Buckets a mantener
    const keepBuckets = ['user-media', 'product-media']
    const bucketsToCleanup = buckets.filter(bucket => !keepBuckets.includes(bucket.name))
    
    console.log('\n🎯 Estrategia:')
    console.log('✅ Mantener: user-media, product-media')
    console.log('🗑️ Limpiar:', bucketsToCleanup.map(b => b.name).join(', '))
    
    // Migrar archivos importantes de product-images a product-media
    const productImagesBucket = buckets.find(b => b.name === 'product-images')
    if (productImagesBucket) {
      console.log('\n📦 Migrando archivos de product-images a product-media...')
      
      try {
        // Listar archivos en product-images
        const { data: files, error: listFilesError } = await supabase.storage
          .from('product-images')
          .list('', { limit: 100 })
        
        if (listFilesError) {
          console.log(`  ⚠️ Error listando archivos: ${listFilesError.message}`)
        } else if (files && files.length > 0) {
          console.log(`  📁 Archivos encontrados: ${files.length}`)
          
          // Migrar archivos importantes
          for (const file of files.slice(0, 5)) { // Solo los primeros 5 para no sobrecargar
            if (file.name && !file.name.includes('/')) { // Solo archivos en la raíz
              console.log(`  📤 Migrando: ${file.name}`)
              
              try {
                // Descargar archivo
                const { data: downloadData, error: downloadError } = await supabase.storage
                  .from('product-images')
                  .download(file.name)
                
                if (downloadError) {
                  console.log(`    ⚠️ Error descargando: ${downloadError.message}`)
                  continue
                }
                
                // Determinar nuevo path
                let newPath
                if (file.name.includes('video') || file.name.includes('.mov') || file.name.includes('.mp4')) {
                  newPath = `videos/products/${file.name}`
                } else if (file.name.includes('image') || file.name.includes('.jpg') || file.name.includes('.png')) {
                  newPath = `images/products/${file.name}`
                } else {
                  newPath = `misc/${file.name}`
                }
                
                // Subir a product-media
                const { error: uploadError } = await supabase.storage
                  .from('product-media')
                  .upload(newPath, downloadData, {
                    cacheControl: '3600',
                    upsert: true
                  })
                
                if (uploadError) {
                  console.log(`    ⚠️ Error subiendo: ${uploadError.message}`)
                } else {
                  console.log(`    ✅ Migrado: ${file.name} → ${newPath}`)
                }
                
              } catch (error) {
                console.log(`    ⚠️ Error procesando ${file.name}:`, error.message)
              }
            }
          }
        }
      } catch (error) {
        console.log(`  ⚠️ Error accediendo a product-images:`, error.message)
      }
    }
    
    // Limpiar buckets vacíos
    console.log('\n🧹 Limpiando buckets vacíos...')
    
    for (const bucket of bucketsToCleanup) {
      console.log(`\n🔍 Verificando bucket '${bucket.name}'...`)
      
      try {
        // Listar archivos
        const { data: files, error: listFilesError } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 1 })
        
        if (listFilesError) {
          console.log(`  ⚠️ Error listando archivos: ${listFilesError.message}`)
        } else if (files && files.length === 0) {
          console.log(`  📁 Bucket vacío, eliminando...`)
          
          const { error: deleteError } = await supabase.storage.deleteBucket(bucket.name)
          
          if (deleteError) {
            console.log(`  ❌ Error eliminando: ${deleteError.message}`)
          } else {
            console.log(`  ✅ Bucket '${bucket.name}' eliminado`)
          }
        } else {
          console.log(`  📁 Bucket contiene archivos (${files?.length || 0}), saltando...`)
          console.log(`  ℹ️ Nota: Los archivos en ${bucket.name} no se migrarán automáticamente`)
          console.log(`  ℹ️ Puedes migrarlos manualmente si son importantes`)
        }
        
      } catch (error) {
        console.log(`  ⚠️ Error procesando bucket '${bucket.name}':`, error.message)
      }
    }
    
    console.log('\n🎉 Limpieza completada')
    console.log('\n📊 Buckets finales:')
    console.log('✅ user-media - Avatares, certificados y documentos de usuarios')
    console.log('✅ product-media - Imágenes y videos de productos y ejercicios')
    console.log('\n⚠️ Nota: Algunos buckets con archivos no se pudieron eliminar')
    console.log('⚠️ Puedes eliminarlos manualmente desde el dashboard de Supabase si no contienen archivos importantes')
    
  } catch (error) {
    console.error('❌ Error en migración:', error)
  }
}

migrateAndCleanup()
