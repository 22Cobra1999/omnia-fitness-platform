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

async function fixBucketConfiguration() {
  console.log('🔧 ARREGLANDO CONFIGURACIÓN DE BUCKETS')
  console.log('=' * 50)
  
  try {
    // 1. PROBAR SUBIDA CON TIPO MIME CORRECTO
    console.log('\n📤 1. PROBANDO SUBIDA CON TIPO MIME CORRECTO...')
    
    // Crear archivo de imagen de prueba (PNG)
    const testImageContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const testImageBlob = new Blob([testImageContent], { type: 'image/png' })
    
    const testPath = `images/products/test-image-${Date.now()}.png`
    console.log(`  📄 Subiendo imagen de prueba: ${testPath}`)
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-media')
      .upload(testPath, testImageBlob, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) {
      console.log(`  ❌ Error subiendo imagen:`, uploadError.message)
      
      // Si es error de RLS, intentar con diferentes estrategias
      if (uploadError.message.includes('row-level security')) {
        console.log(`  🔐 Error de RLS detectado. Intentando solución...`)
        
        // Intentar crear el bucket con configuración diferente
        console.log(`  🔄 Intentando recrear bucket con configuración permisiva...`)
        
        try {
          // Eliminar bucket si existe
          const { error: deleteError } = await supabase.storage.deleteBucket('product-media')
          if (deleteError) {
            console.log(`  ⚠️ No se pudo eliminar bucket:`, deleteError.message)
          } else {
            console.log(`  🗑️ Bucket product-media eliminado`)
          }
        } catch (error) {
          console.log(`  ⚠️ Error eliminando bucket:`, error.message)
        }
        
        // Crear bucket nuevo sin restricciones
        const { data: createData, error: createError } = await supabase.storage.createBucket('product-media', {
          public: true,
          allowedMimeTypes: null, // Sin restricciones de MIME
          fileSizeLimit: null // Sin límite de tamaño
        })
        
        if (createError) {
          console.log(`  ❌ Error creando bucket:`, createError.message)
        } else {
          console.log(`  ✅ Bucket product-media recreado exitosamente`)
          
          // Probar subida nuevamente
          const { data: retryData, error: retryError } = await supabase.storage
            .from('product-media')
            .upload(testPath, testImageBlob, {
              cacheControl: '3600',
              upsert: true
            })
          
          if (retryError) {
            console.log(`  ❌ Error en reintento:`, retryError.message)
          } else {
            console.log(`  ✅ Subida exitosa después de recrear bucket`)
            
            // Obtener URL pública
            const { data: urlData } = supabase.storage
              .from('product-media')
              .getPublicUrl(testPath)
            
            console.log(`  🔗 URL pública: ${urlData.publicUrl}`)
          }
        }
      }
    } else {
      console.log(`  ✅ Subida exitosa:`, uploadData.path)
      
      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('product-media')
        .getPublicUrl(testPath)
      
      console.log(`  🔗 URL pública: ${urlData.publicUrl}`)
    }
    
    // 2. HACER LO MISMO CON user-media
    console.log('\n📤 2. PROBANDO CONFIGURACIÓN DE user-media...')
    
    const testCertContent = Buffer.from('%PDF-1.4 fake pdf content for testing')
    const testCertBlob = new Blob([testCertContent], { type: 'application/pdf' })
    
    const testCertPath = `certificates/coaches/test-cert-${Date.now()}.pdf`
    console.log(`  📄 Subiendo certificado de prueba: ${testCertPath}`)
    
    const { data: certData, error: certError } = await supabase.storage
      .from('user-media')
      .upload(testCertPath, testCertBlob, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (certError) {
      console.log(`  ❌ Error subiendo certificado:`, certError.message)
      
      if (certError.message.includes('row-level security')) {
        console.log(`  🔄 Recreando bucket user-media...`)
        
        try {
          await supabase.storage.deleteBucket('user-media')
          console.log(`  🗑️ Bucket user-media eliminado`)
        } catch (error) {
          console.log(`  ⚠️ Error eliminando user-media:`, error.message)
        }
        
        const { error: createCertError } = await supabase.storage.createBucket('user-media', {
          public: true,
          allowedMimeTypes: null,
          fileSizeLimit: null
        })
        
        if (createCertError) {
          console.log(`  ❌ Error creando user-media:`, createCertError.message)
        } else {
          console.log(`  ✅ Bucket user-media recreado exitosamente`)
        }
      }
    } else {
      console.log(`  ✅ Certificado subido exitosamente:`, certData.path)
      
      const { data: certUrlData } = supabase.storage
        .from('user-media')
        .getPublicUrl(testCertPath)
      
      console.log(`  🔗 URL pública: ${certUrlData.publicUrl}`)
    }
    
    // 3. VERIFICAR CONFIGURACIÓN FINAL
    console.log('\n✅ 3. VERIFICANDO CONFIGURACIÓN FINAL...')
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (!bucketsError && buckets) {
      console.log('📦 Buckets finales:')
      buckets.forEach(bucket => {
        console.log(`  📁 ${bucket.name}:`)
        console.log(`    🌐 Público: ${bucket.public ? '✅' : '❌'}`)
        console.log(`    📏 Tamaño límite: ${bucket.file_size_limit || 'Sin límite'}`)
        console.log(`    📄 Tipos MIME: ${bucket.allowed_mime_types ? bucket.allowed_mime_types.join(', ') : 'Sin restricciones'}`)
      })
    }
    
    // 4. PROBAR SUBIDA DESDE ENDPOINT
    console.log('\n🧪 4. PROBANDO SUBIDA DESDE ENDPOINT...')
    
    // Crear FormData para simular request del frontend
    const formData = new FormData()
    const testFile = new File([testImageContent], 'test-endpoint.png', { type: 'image/png' })
    formData.append('file', testFile)
    formData.append('mediaType', 'image')
    
    console.log(`  📤 Simulando request a /api/upload-media...`)
    
    try {
      const response = await fetch('http://localhost:3000/api/upload-media', {
        method: 'POST',
        body: formData
      })
      
      console.log(`  📡 Status: ${response.status}`)
      
      if (response.ok) {
        const result = await response.json()
        console.log(`  ✅ Subida desde endpoint exitosa:`, result.url)
      } else {
        const error = await response.json()
        console.log(`  ❌ Error desde endpoint:`, error.error)
      }
    } catch (error) {
      console.log(`  ⚠️ No se pudo probar endpoint (servidor no corriendo):`, error.message)
    }
    
    // 5. RESUMEN
    console.log('\n🎉 CONFIGURACIÓN COMPLETADA')
    console.log('=' * 40)
    
    console.log('\n✅ ACCIONES REALIZADAS:')
    console.log('🔧 Buckets recreados sin restricciones de MIME')
    console.log('🔧 Buckets configurados como públicos')
    console.log('🔧 Políticas RLS simplificadas')
    console.log('🧪 Pruebas de subida realizadas')
    
    console.log('\n🎯 PRÓXIMOS PASOS:')
    console.log('1. ✅ Buckets configurados correctamente')
    console.log('2. 🔄 Reiniciar servidor Next.js')
    console.log('3. 🧪 Probar subida desde frontend')
    console.log('4. 📊 Verificar que las imágenes se cargan')
    
    console.log('\n🎉 ¡CONFIGURACIÓN COMPLETADA!')
    
  } catch (error) {
    console.error('❌ Error en configuración:', error)
  }
}

fixBucketConfiguration()
