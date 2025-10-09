const { createClient } = require('@supabase/supabase-js')

// Variables de entorno
const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc'

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

    console.log('📦 Buckets existentes:', buckets.map(b => b.name))

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
    console.log('   - Las imágenes se suben a: profile-images/')
    console.log('   - Tamaño máximo: 5MB')
    console.log('   - Formatos permitidos: JPEG, PNG, WebP')
    console.log('   - Acceso público para lectura')

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

setupProfileImagesBucket()
















































