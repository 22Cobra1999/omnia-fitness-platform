const { createClient } = require('@supabase/supabase-js')

async function checkStorageBuckets() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno de Supabase no configuradas')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    console.log('🔍 Verificando buckets de Storage...')
    
    // Listar buckets existentes
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listando buckets:', listError)
      return
    }
    
    console.log('📦 Buckets existentes:', buckets.map(b => b.name))
    
    // Verificar si existe el bucket product-images
    const productImagesBucket = buckets.find(b => b.name === 'product-images')
    
    if (!productImagesBucket) {
      console.log('⚠️ Bucket product-images no existe. Creando...')
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'],
        fileSizeLimit: 52428800 // 50MB
      })
      
      if (createError) {
        console.error('❌ Error creando bucket product-images:', createError)
      } else {
        console.log('✅ Bucket product-images creado exitosamente')
      }
    } else {
      console.log('✅ Bucket product-images ya existe')
    }
    
    // Verificar bucket avatars como alternativa
    const avatarsBucket = buckets.find(b => b.name === 'avatars')
    if (avatarsBucket) {
      console.log('✅ Bucket avatars disponible como alternativa')
    } else {
      console.log('⚠️ Bucket avatars no existe')
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

checkStorageBuckets()
