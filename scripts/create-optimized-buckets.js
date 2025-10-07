const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createOptimizedBuckets() {
  console.log('🎯 Creando buckets optimizados...')
  
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
    
    // Buckets optimizados recomendados
    const optimizedBuckets = [
      { 
        name: 'user-media', 
        public: true,
        description: 'Avatares, certificados y documentos de usuarios'
      },
      { 
        name: 'product-media', 
        public: true,
        description: 'Imágenes y videos de productos y ejercicios'
      }
    ]
    
    console.log('\n🔧 Verificando buckets optimizados...')
    
    for (const bucketConfig of optimizedBuckets) {
      const exists = buckets.some(bucket => bucket.name === bucketConfig.name)
      
      if (exists) {
        console.log(`✅ Bucket '${bucketConfig.name}' ya existe`)
      } else {
        console.log(`➕ Creando bucket optimizado '${bucketConfig.name}'...`)
        console.log(`   📝 Descripción: ${bucketConfig.description}`)
        
        const { data, error } = await supabase.storage.createBucket(bucketConfig.name, {
          public: bucketConfig.public,
          allowedMimeTypes: ['image/*', 'video/*', 'application/pdf'],
          fileSizeLimit: 50 * 1024 * 1024 // 50MB
        })
        
        if (error) {
          console.error(`❌ Error creando bucket '${bucketConfig.name}':`, error)
        } else {
          console.log(`✅ Bucket '${bucketConfig.name}' creado exitosamente`)
        }
      }
    }
    
    console.log('\n📊 Estructura de paths recomendada:')
    console.log('user-media/')
    console.log('├── avatars/')
    console.log('│   ├── coaches/')
    console.log('│   └── clients/')
    console.log('└── certificates/')
    console.log('    └── coaches/')
    console.log('')
    console.log('product-media/')
    console.log('├── images/')
    console.log('│   └── products/')
    console.log('└── videos/')
    console.log('    ├── products/')
    console.log('    └── exercises/')
    
    console.log('\n🎉 Buckets optimizados listos')
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

createOptimizedBuckets()
