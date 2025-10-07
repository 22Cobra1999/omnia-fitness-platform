const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 DIAGNÓSTICO DE SUPABASE STORAGE')
console.log('=====================================')

// Verificar variables de entorno
console.log('\n📋 Variables de entorno:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Presente' : '❌ Faltante')
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Presente' : '❌ Faltante')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Presente' : '❌ Faltante')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes')
  process.exit(1)
}

// Crear cliente con service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function diagnoseStorage() {
  try {
    console.log('\n🔍 Verificando conectividad con Supabase...')
    
    // Test 1: Verificar autenticación
    console.log('\n1️⃣ Verificando autenticación...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.log('⚠️ Error de autenticación (normal con service key):', authError.message)
    } else {
      console.log('✅ Autenticación OK')
    }
    
    // Test 2: Listar buckets
    console.log('\n2️⃣ Listando buckets existentes...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listando buckets:', listError)
      return
    }
    
    console.log('📦 Buckets encontrados:')
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`)
    })
    
    // Test 3: Verificar permisos en cada bucket
    console.log('\n3️⃣ Verificando permisos de buckets...')
    
    for (const bucket of buckets) {
      console.log(`\n🔍 Probando bucket: ${bucket.name}`)
      
      try {
        // Intentar listar archivos en el bucket
        const { data: files, error: listFilesError } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 1 })
        
        if (listFilesError) {
          console.log(`  ❌ Error listando archivos: ${listFilesError.message}`)
        } else {
          console.log(`  ✅ Permisos OK - ${files?.length || 0} archivos encontrados`)
        }
        
        // Intentar subir un archivo de prueba
        console.log(`  🧪 Probando subida de archivo de prueba...`)
        const testContent = new Blob(['test content'], { type: 'text/plain' })
        const testFileName = `test-${Date.now()}.txt`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket.name)
          .upload(testFileName, testContent, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (uploadError) {
          console.log(`  ❌ Error subiendo archivo: ${uploadError.message}`)
        } else {
          console.log(`  ✅ Subida exitosa: ${uploadData.path}`)
          
          // Limpiar archivo de prueba
          const { error: deleteError } = await supabase.storage
            .from(bucket.name)
            .remove([testFileName])
          
          if (deleteError) {
            console.log(`  ⚠️ Error eliminando archivo de prueba: ${deleteError.message}`)
          } else {
            console.log(`  🧹 Archivo de prueba eliminado`)
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Error general con bucket ${bucket.name}:`, error.message)
      }
    }
    
    // Test 4: Verificar configuración de red
    console.log('\n4️⃣ Verificando configuración de red...')
    console.log('URL de Supabase:', supabaseUrl)
    console.log('Región detectada:', supabaseUrl.includes('supabase.co') ? 'Supabase Cloud' : 'Self-hosted')
    
    // Test 5: Verificar políticas RLS
    console.log('\n5️⃣ Verificando políticas RLS...')
    console.log('ℹ️ Las políticas RLS pueden afectar el acceso a Storage')
    console.log('ℹ️ Verifica en el dashboard de Supabase que las políticas permitan acceso')
    
    console.log('\n🎉 Diagnóstico completado')
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error)
  }
}

diagnoseStorage()
