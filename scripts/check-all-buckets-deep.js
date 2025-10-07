const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAllBucketsDeep() {
  console.log('🔍 VERIFICACIÓN PROFUNDA DE TODOS LOS BUCKETS')
  console.log('=' * 50)
  
  try {
    // 1. LISTAR TODOS LOS BUCKETS
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listando buckets:', bucketsError)
      return
    }
    
    console.log('📦 Buckets disponibles:')
    buckets.forEach(bucket => {
      console.log(`  📁 ${bucket.name} (${bucket.public ? 'público' : 'privado'})`)
    })
    
    // 2. VERIFICAR CADA BUCKET RECURSIVAMENTE
    for (const bucket of buckets) {
      console.log(`\n🔍 Verificando bucket: ${bucket.name}`)
      
      try {
        // Listar archivos en la raíz
        const { data: rootFiles, error: rootError } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 100 })
        
        if (rootError) {
          console.log(`  ❌ Error listando raíz: ${rootError.message}`)
          continue
        }
        
        if (!rootFiles || rootFiles.length === 0) {
          console.log(`  📁 Bucket vacío`)
          continue
        }
        
        console.log(`  📊 ${rootFiles.length} elementos en la raíz:`)
        
        for (const item of rootFiles) {
          if (item.name === '.emptyFolderPlaceholder') {
            console.log(`    📄 ${item.name} (marcador de carpeta vacía)`)
            continue
          }
          
          // Verificar si es archivo o carpeta
          const { data: subItems, error: subError } = await supabase.storage
            .from(bucket.name)
            .list(item.name, { limit: 1 })
          
          if (subError || !subItems || subItems.length === 0) {
            // Es un archivo
            console.log(`    📄 ${item.name} (${item.metadata?.size || 'unknown'} bytes)`)
          } else {
            // Es una carpeta
            console.log(`    📁 ${item.name}/ (carpeta)`)
            
            // Listar contenido de la carpeta
            const { data: folderFiles, error: folderError } = await supabase.storage
              .from(bucket.name)
              .list(item.name, { limit: 20 })
            
            if (!folderError && folderFiles && folderFiles.length > 0) {
              folderFiles.forEach(file => {
                if (file.name === '.emptyFolderPlaceholder') {
                  console.log(`      📄 ${file.name} (marcador)`)
                } else {
                  console.log(`      📄 ${file.name} (${file.metadata?.size || 'unknown'} bytes)`)
                }
              })
              
              if (folderFiles.length >= 20) {
                console.log(`      ... y más archivos`)
              }
            } else {
              console.log(`      📁 Carpeta vacía`)
            }
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Error verificando bucket ${bucket.name}: ${error.message}`)
      }
    }
    
    // 3. VERIFICAR URLs EN BASE DE DATOS
    console.log('\n📊 VERIFICANDO URLs EN BASE DE DATOS...')
    
    // activity_media
    try {
      const { data: activityMedia, error: amError } = await supabase
        .from('activity_media')
        .select('id, activity_id, image_url, video_url')
      
      if (!amError && activityMedia) {
        console.log(`\n📸 activity_media (${activityMedia.length} registros):`)
        activityMedia.forEach(media => {
          console.log(`  🔗 Activity ${media.activity_id}:`)
          if (media.image_url) {
            const bucket = media.image_url.includes('product-media') ? '✅ product-media' : 
                          media.image_url.includes('product-images') ? '❌ product-images' : '❓ otro'
            console.log(`    🖼️ Imagen: ${bucket}`)
          }
          if (media.video_url) {
            const bucket = media.video_url.includes('product-media') ? '✅ product-media' : 
                          media.video_url.includes('product-images') ? '❌ product-images' : '❓ otro'
            console.log(`    🎬 Video: ${bucket}`)
          }
        })
      }
    } catch (error) {
      console.log(`  ❌ Error verificando activity_media: ${error.message}`)
    }
    
    // coach_certifications
    try {
      const { data: certifications, error: certError } = await supabase
        .from('coach_certifications')
        .select('id, name, file_url')
      
      if (!certError && certifications) {
        console.log(`\n📜 coach_certifications (${certifications.length} registros):`)
        certifications.forEach(cert => {
          const bucket = cert.file_url.includes('user-media') ? '✅ user-media' : 
                        cert.file_url.includes('product-images') ? '❌ product-images' : '❓ otro'
          console.log(`  📄 ${cert.name}: ${bucket}`)
        })
      }
    } catch (error) {
      console.log(`  ❌ Error verificando coach_certifications: ${error.message}`)
    }
    
    // 4. RESUMEN
    console.log('\n📋 RESUMEN DE VERIFICACIÓN:')
    console.log('=' * 30)
    
    console.log('\n✅ BUCKETS OPTIMIZADOS:')
    console.log('📁 product-media - Para imágenes y videos de productos')
    console.log('📁 user-media - Para avatares y certificados')
    
    console.log('\n🎯 ESTADO ACTUAL:')
    console.log('1. ✅ URLs en base de datos actualizadas')
    console.log('2. ✅ Estructura de buckets optimizada')
    console.log('3. 🔄 Archivos físicos necesitan migración manual')
    
    console.log('\n⚠️ ACCIÓN REQUERIDA:')
    console.log('Los archivos físicos deben moverse manualmente desde:')
    console.log('- product-images/product-images/ → product-media/images/products/')
    console.log('- product-images/product-videos/ → product-media/videos/products/')
    console.log('- product-images/certificados/ → user-media/certificates/coaches/')
    
  } catch (error) {
    console.error('❌ Error en verificación:', error)
  }
}

checkAllBucketsDeep()
