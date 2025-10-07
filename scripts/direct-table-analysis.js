const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyzeTablesDirectly() {
  console.log('🔍 ANÁLISIS DIRECTO DE TABLAS CON MEDIA')
  console.log('=' * 50)
  
  try {
    // 1. ANALIZAR activity_media
    console.log('\n📸 1. TABLA activity_media')
    try {
      const { data: activityMedia, error } = await supabase
        .from('activity_media')
        .select('*')
        .limit(5)
      
      if (error) {
        console.log('  ❌ Error:', error.message)
      } else {
        console.log(`  ✅ ${activityMedia?.length || 0} registros encontrados`)
        if (activityMedia && activityMedia.length > 0) {
          console.log('  📊 Campos disponibles:', Object.keys(activityMedia[0]))
          console.log('  🔍 Ejemplos:')
          activityMedia.forEach((media, i) => {
            console.log(`    ${i + 1}. Activity ID: ${media.activity_id}`)
            console.log(`       🖼️ Image: ${media.image_url || 'N/A'}`)
            console.log(`       🎬 Video: ${media.video_url || 'N/A'}`)
            console.log(`       📄 PDF: ${media.pdf_url || 'N/A'}`)
            console.log(`       🎥 Vimeo: ${media.vimeo_id || 'N/A'}`)
          })
        }
      }
    } catch (error) {
      console.log('  ❌ Error accediendo a activity_media:', error.message)
    }
    
    // 2. ANALIZAR coach_certifications
    console.log('\n📜 2. TABLA coach_certifications')
    try {
      const { data: certifications, error } = await supabase
        .from('coach_certifications')
        .select('*')
        .limit(3)
      
      if (error) {
        console.log('  ❌ Error:', error.message)
      } else {
        console.log(`  ✅ ${certifications?.length || 0} registros encontrados`)
        if (certifications && certifications.length > 0) {
          console.log('  📊 Campos disponibles:', Object.keys(certifications[0]))
          console.log('  🔍 Ejemplos:')
          certifications.forEach((cert, i) => {
            console.log(`    ${i + 1}. Coach ID: ${cert.coach_id}`)
            console.log(`       📜 Name: ${cert.name}`)
            console.log(`       🏢 Issuer: ${cert.issuer}`)
            console.log(`       📅 Year: ${cert.year}`)
            console.log(`       🔗 File URL: ${cert.file_url || 'N/A'}`)
            console.log(`       📁 File Path: ${cert.file_path || 'N/A'}`)
            console.log(`       📏 File Size: ${cert.file_size || 'N/A'} bytes`)
            console.log(`       ✅ Verified: ${cert.verified}`)
          })
        }
      }
    } catch (error) {
      console.log('  ❌ Error accediendo a coach_certifications:', error.message)
    }
    
    // 3. ANALIZAR coaches (avatares)
    console.log('\n👤 3. TABLA coaches (avatares)')
    try {
      const { data: coaches, error } = await supabase
        .from('coaches')
        .select('id, avatar_url, name, email')
        .not('avatar_url', 'is', null)
        .not('avatar_url', 'eq', '')
        .limit(3)
      
      if (error) {
        console.log('  ❌ Error:', error.message)
      } else {
        console.log(`  ✅ ${coaches?.length || 0} coaches con avatar encontrados`)
        if (coaches && coaches.length > 0) {
          console.log('  🔍 Ejemplos:')
          coaches.forEach((coach, i) => {
            console.log(`    ${i + 1}. Coach ID: ${coach.id}`)
            console.log(`       👤 Name: ${coach.name || 'N/A'}`)
            console.log(`       📧 Email: ${coach.email || 'N/A'}`)
            console.log(`       🖼️ Avatar: ${coach.avatar_url || 'N/A'}`)
          })
        }
      }
    } catch (error) {
      console.log('  ❌ Error accediendo a coaches:', error.message)
    }
    
    // 4. ANALIZAR activities (media directa)
    console.log('\n📦 4. TABLA activities (media directa)')
    try {
      const { data: activities, error } = await supabase
        .from('activities')
        .select('id, title, image_url, video_url, vimeo_id, preview_video_url')
        .or('image_url.not.is.null,video_url.not.is.null,vimeo_id.not.is.null,preview_video_url.not.is.null')
        .limit(3)
      
      if (error) {
        console.log('  ❌ Error:', error.message)
      } else {
        console.log(`  ✅ ${activities?.length || 0} actividades con media directa encontradas`)
        if (activities && activities.length > 0) {
          console.log('  🔍 Ejemplos:')
          activities.forEach((activity, i) => {
            console.log(`    ${i + 1}. Activity ID: ${activity.id}`)
            console.log(`       📝 Title: ${activity.title || 'N/A'}`)
            console.log(`       🖼️ Image URL: ${activity.image_url || 'N/A'}`)
            console.log(`       🎬 Video URL: ${activity.video_url || 'N/A'}`)
            console.log(`       🎥 Vimeo ID: ${activity.vimeo_id || 'N/A'}`)
            console.log(`       👁️ Preview Video: ${activity.preview_video_url || 'N/A'}`)
          })
        }
      }
    } catch (error) {
      console.log('  ❌ Error accediendo a activities:', error.message)
    }
    
    // 5. RESUMEN DE MIGRACIÓN NECESARIA
    console.log('\n📋 5. RESUMEN DE MIGRACIÓN NECESARIA')
    console.log('=' * 40)
    
    console.log('\n🎯 DATOS A MIGRAR:')
    console.log('📸 activity_media → product-media/')
    console.log('  ├── image_url → images/products/')
    console.log('  ├── video_url → videos/products/')
    console.log('  └── pdf_url → documents/products/')
    
    console.log('\n📜 coach_certifications → user-media/')
    console.log('  └── file_url → certificates/coaches/')
    
    console.log('\n👤 coaches → user-media/')
    console.log('  └── avatar_url → avatars/coaches/')
    
    console.log('\n📦 activities → product-media/')
    console.log('  ├── image_url → images/products/')
    console.log('  ├── video_url → videos/products/')
    console.log('  ├── vimeo_id → (mantener como está)')
    console.log('  └── preview_video_url → videos/products/')
    
    console.log('\n🛠️ ENDPOINTS A USAR:')
    console.log('🔗 /api/upload-file (NUEVO - Unificado)')
    console.log('  ├── category: "product-image" → product-media/images/')
    console.log('  ├── category: "product-video" → product-media/videos/')
    console.log('  ├── category: "certificate" → user-media/certificates/')
    console.log('  └── category: "user-avatar" → user-media/avatars/')
    
    console.log('\n🔗 /api/upload-media (ACTUALIZADO)')
    console.log('  └── Solo para productos → product-media/')
    
    console.log('\n📱 COMPONENTES FRONTEND:')
    console.log('🎨 MediaSelectionModal → /api/upload-media → product-media')
    console.log('📜 CertificationUploadModal → /api/upload-file → user-media')
    console.log('🎬 VideoUpload → /api/upload-file → product-media')
    console.log('👤 CoachProfileScreen → /api/upload-file → user-media')
    
    console.log('\n✅ ESTRUCTURA FINAL:')
    console.log('📁 user-media/')
    console.log('  ├── avatars/coaches/     ← coaches.avatar_url')
    console.log('  ├── avatars/clients/     ← clientes.avatar_url (futuro)')
    console.log('  └── certificates/coaches/ ← coach_certifications.file_url')
    console.log('📁 product-media/')
    console.log('  ├── images/products/     ← activity_media.image_url + activities.image_url')
    console.log('  ├── videos/products/     ← activity_media.video_url + activities.video_url')
    console.log('  └── videos/exercises/    ← videos de ejercicios (futuro)')
    
    console.log('\n🎉 ANÁLISIS COMPLETADO')
    
  } catch (error) {
    console.error('❌ Error en análisis:', error)
  }
}

analyzeTablesDirectly()
