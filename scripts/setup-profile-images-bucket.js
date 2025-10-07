const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupProfileImagesBucket() {
  try {
    console.log('🔧 Configurando bucket para imágenes de perfil...')

    // Verificar si el bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error al listar buckets:', listError)
      return
    }

    const profileImagesBucket = buckets.find(bucket => bucket.name === 'profile-images')
    
    if (!profileImagesBucket) {
      console.log('📦 Creando bucket "profile-images"...')
      
      const { data, error } = await supabase.storage.createBucket('profile-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      })

      if (error) {
        console.error('❌ Error al crear bucket:', error)
        return
      }

      console.log('✅ Bucket "profile-images" creado exitosamente')
    } else {
      console.log('✅ Bucket "profile-images" ya existe')
    }

    console.log('🎉 Configuración completada!')
    console.log('📝 Notas:')
    console.log('   - Las imágenes se suben a: profile-images/{user_id}/')
    console.log('   - Tamaño máximo: 5MB')
    console.log('   - Formatos permitidos: JPEG, PNG, WebP')
    console.log('   - Acceso público para lectura')

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

setupProfileImagesBucket()











































