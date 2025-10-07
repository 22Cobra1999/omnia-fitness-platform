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

async function testStorageConnectivity() {
  console.log('🧪 PROBANDO CONECTIVIDAD DE SUPABASE STORAGE')
  console.log('=' * 50)
  
  try {
    // 1. VERIFICAR CONFIGURACIÓN
    console.log('\n📋 1. VERIFICANDO CONFIGURACIÓN...')
    console.log(`🔗 Supabase URL: ${supabaseUrl}`)
    console.log(`🔑 Service Key: ${supabaseServiceKey ? '✅ Configurado' : '❌ No configurado'}`)
    
    // 2. LISTAR BUCKETS
    console.log('\n📦 2. LISTANDO BUCKETS...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listando buckets:', bucketsError)
      return
    }
    
    console.log('✅ Buckets encontrados:')
    buckets.forEach(bucket => {
      console.log(`  📁 ${bucket.name} (${bucket.public ? 'público' : 'privado'})`)
    })
    
    // 3. PROBAR SUBIDA SIMPLE
    console.log('\n📤 3. PROBANDO SUBIDA SIMPLE...')
    
    const testContent = Buffer.from('Test content for connectivity verification')
    const testBlob = new Blob([testContent], { type: 'text/plain' })
    const testPath = `connectivity-test-${Date.now()}.txt`
    
    console.log(`📄 Subiendo archivo de prueba: ${testPath}`)
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-media')
      .upload(testPath, testBlob, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.log(`❌ Error en subida simple:`, uploadError.message)
      console.log(`🔍 Tipo de error:`, uploadError.name)
      console.log(`📊 Detalles:`, uploadError)
      
      // Intentar con diferentes configuraciones
      console.log('\n🔄 4. PROBANDO CONFIGURACIONES ALTERNATIVAS...')
      
      // Configuración 1: Con upsert
      console.log('📤 Probando con upsert: true...')
      const { error: upsertError } = await supabase.storage
        .from('product-media')
        .upload(testPath, testBlob, {
          cacheControl: '3600',
          upsert: true
        })
      
      if (upsertError) {
        console.log(`❌ Error con upsert:`, upsertError.message)
      } else {
        console.log(`✅ Subida exitosa con upsert: true`)
      }
      
      // Configuración 2: Sin cacheControl
      console.log('📤 Probando sin cacheControl...')
      const { error: noCacheError } = await supabase.storage
        .from('product-media')
        .upload(`${testPath}-nocache`, testBlob, {
          upsert: false
        })
      
      if (noCacheError) {
        console.log(`❌ Error sin cacheControl:`, noCacheError.message)
      } else {
        console.log(`✅ Subida exitosa sin cacheControl`)
      }
      
      // Configuración 3: Con bucket alternativo
      console.log('📤 Probando con bucket user-media...')
      const { error: altBucketError } = await supabase.storage
        .from('user-media')
        .upload(testPath, testBlob, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (altBucketError) {
        console.log(`❌ Error con bucket alternativo:`, altBucketError.message)
      } else {
        console.log(`✅ Subida exitosa con bucket alternativo`)
      }
      
    } else {
      console.log(`✅ Subida simple exitosa:`, uploadData.path)
      
      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('product-media')
        .getPublicUrl(testPath)
      
      console.log(`🔗 URL pública: ${urlData.publicUrl}`)
      
      // Eliminar archivo de prueba
      const { error: deleteError } = await supabase.storage
        .from('product-media')
        .remove([testPath])
      
      if (deleteError) {
        console.log(`⚠️ Error eliminando archivo de prueba:`, deleteError.message)
      } else {
        console.log(`🗑️ Archivo de prueba eliminado`)
      }
    }
    
    // 4. PROBAR CON ARCHIVO DE IMAGEN
    console.log('\n🖼️ 5. PROBANDO CON ARCHIVO DE IMAGEN...')
    
    // Crear imagen de prueba (1x1 pixel PNG)
    const imageContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    const imageBlob = new Blob([imageContent], { type: 'image/png' })
    const imagePath = `test-image-${Date.now()}.png`
    
    console.log(`📄 Subiendo imagen de prueba: ${imagePath}`)
    
    const { data: imageData, error: imageError } = await supabase.storage
      .from('product-media')
      .upload(imagePath, imageBlob, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (imageError) {
      console.log(`❌ Error subiendo imagen:`, imageError.message)
    } else {
      console.log(`✅ Imagen subida exitosamente:`, imageData.path)
      
      const { data: imageUrlData } = supabase.storage
        .from('product-media')
        .getPublicUrl(imagePath)
      
      console.log(`🔗 URL de imagen: ${imageUrlData.publicUrl}`)
      
      // Eliminar imagen de prueba
      await supabase.storage.from('product-media').remove([imagePath])
    }
    
    // 5. RESUMEN DE CONECTIVIDAD
    console.log('\n📊 RESUMEN DE CONECTIVIDAD:')
    console.log('=' * 30)
    
    if (uploadError) {
      console.log('❌ CONECTIVIDAD: Problemas detectados')
      console.log('🔧 SOLUCIONES RECOMENDADAS:')
      console.log('1. Verificar configuración de red')
      console.log('2. Revisar políticas RLS en Supabase Dashboard')
      console.log('3. Probar con archivos más pequeños')
      console.log('4. Usar endpoint robusto con reintentos')
    } else {
      console.log('✅ CONECTIVIDAD: Funcionando correctamente')
      console.log('🎉 Supabase Storage está accesible y funcional')
    }
    
  } catch (error) {
    console.error('❌ Error en prueba de conectividad:', error)
  }
}

testStorageConnectivity()
