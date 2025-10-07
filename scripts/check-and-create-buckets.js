const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no encontradas')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAndCreateBuckets() {
  console.log('🔍 Verificando buckets existentes...')
  
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
    
    // Buckets que necesitamos
    const requiredBuckets = [
      { name: 'product-images', public: true },
      { name: 'avatars', public: true },
      { name: 'public', public: true }
    ]
    
    console.log('\n🔧 Verificando buckets requeridos...')
    
    for (const requiredBucket of requiredBuckets) {
      const exists = buckets.some(bucket => bucket.name === requiredBucket.name)
      
      if (exists) {
        console.log(`✅ Bucket '${requiredBucket.name}' ya existe`)
      } else {
        console.log(`➕ Creando bucket '${requiredBucket.name}'...`)
        
        const { data, error } = await supabase.storage.createBucket(requiredBucket.name, {
          public: requiredBucket.public,
          allowedMimeTypes: ['image/*', 'video/*', 'application/pdf'],
          fileSizeLimit: 50 * 1024 * 1024 // 50MB
        })
        
        if (error) {
          console.error(`❌ Error creando bucket '${requiredBucket.name}':`, error)
        } else {
          console.log(`✅ Bucket '${requiredBucket.name}' creado exitosamente`)
        }
      }
    }
    
    console.log('\n🎉 Verificación completada')
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

checkAndCreateBuckets()
