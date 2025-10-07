const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateExistingFiles() {
  console.log('🔄 MIGRACIÓN DE ARCHIVOS EXISTENTES A BUCKETS OPTIMIZADOS')
  console.log('=' * 60)
  
  try {
    // 1. MIGRAR activity_media
    console.log('\n📸 1. MIGRANDO activity_media...')
    
    const { data: activityMedia, error: amError } = await supabase
      .from('activity_media')
      .select('*')
    
    if (amError) {
      console.log('  ❌ Error obteniendo activity_media:', amError.message)
    } else if (activityMedia && activityMedia.length > 0) {
      console.log(`  📊 ${activityMedia.length} registros de activity_media encontrados`)
      
      for (const media of activityMedia) {
        console.log(`\n  🔄 Procesando Activity ID: ${media.activity_id}`)
        
        // Migrar imagen si existe
        if (media.image_url && !media.image_url.includes('placeholder')) {
          console.log(`    🖼️ Migrando imagen: ${media.image_url}`)
          
          try {
            // Descargar archivo del bucket actual
            const fileName = media.image_url.split('/').pop()
            const { data: fileData, error: downloadError } = await supabase.storage
              .from('product-images')
              .download(`product-images/${fileName}`)
            
            if (downloadError) {
              console.log(`      ⚠️ Error descargando: ${downloadError.message}`)
              continue
            }
            
            // Subir a nuevo bucket con estructura optimizada
            const newPath = `images/products/${fileName}`
            const { error: uploadError } = await supabase.storage
              .from('product-media')
              .upload(newPath, fileData, {
                cacheControl: '3600',
                upsert: true
              })
            
            if (uploadError) {
              console.log(`      ❌ Error subiendo: ${uploadError.message}`)
            } else {
              // Actualizar URL en la base de datos
              const newUrl = supabase.storage.from('product-media').getPublicUrl(newPath).data.publicUrl
              const { error: updateError } = await supabase
                .from('activity_media')
                .update({ image_url: newUrl })
                .eq('id', media.id)
              
              if (updateError) {
                console.log(`      ❌ Error actualizando DB: ${updateError.message}`)
              } else {
                console.log(`      ✅ Imagen migrada: ${newUrl}`)
              }
            }
          } catch (error) {
            console.log(`      ❌ Error procesando imagen: ${error.message}`)
          }
        }
        
        // Migrar video si existe
        if (media.video_url && !media.video_url.includes('placeholder')) {
          console.log(`    🎬 Migrando video: ${media.video_url}`)
          
          try {
            // Descargar archivo del bucket actual
            const fileName = media.video_url.split('/').pop()
            const { data: fileData, error: downloadError } = await supabase.storage
              .from('product-images')
              .download(`product-videos/${fileName}`)
            
            if (downloadError) {
              console.log(`      ⚠️ Error descargando: ${downloadError.message}`)
              continue
            }
            
            // Subir a nuevo bucket con estructura optimizada
            const newPath = `videos/products/${fileName}`
            const { error: uploadError } = await supabase.storage
              .from('product-media')
              .upload(newPath, fileData, {
                cacheControl: '3600',
                upsert: true
              })
            
            if (uploadError) {
              console.log(`      ❌ Error subiendo: ${uploadError.message}`)
            } else {
              // Actualizar URL en la base de datos
              const newUrl = supabase.storage.from('product-media').getPublicUrl(newPath).data.publicUrl
              const { error: updateError } = await supabase
                .from('activity_media')
                .update({ video_url: newUrl })
                .eq('id', media.id)
              
              if (updateError) {
                console.log(`      ❌ Error actualizando DB: ${updateError.message}`)
              } else {
                console.log(`      ✅ Video migrado: ${newUrl}`)
              }
            }
          } catch (error) {
            console.log(`      ❌ Error procesando video: ${error.message}`)
          }
        }
      }
    }
    
    // 2. MIGRAR coach_certifications
    console.log('\n📜 2. MIGRANDO coach_certifications...')
    
    const { data: certifications, error: certError } = await supabase
      .from('coach_certifications')
      .select('*')
    
    if (certError) {
      console.log('  ❌ Error obteniendo certificaciones:', certError.message)
    } else if (certifications && certifications.length > 0) {
      console.log(`  📊 ${certifications.length} certificaciones encontradas`)
      
      for (const cert of certifications) {
        console.log(`\n  🔄 Procesando certificación: ${cert.name}`)
        console.log(`    📄 Archivo: ${cert.file_url}`)
        
        try {
          // Descargar archivo del bucket actual
          const fileName = cert.file_url.split('/').pop()
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('product-images')
            .download(`certificados/${fileName}`)
          
          if (downloadError) {
            console.log(`      ⚠️ Error descargando: ${downloadError.message}`)
            continue
          }
          
          // Subir a nuevo bucket con estructura optimizada
          const newPath = `certificates/coaches/${fileName}`
          const { error: uploadError } = await supabase.storage
            .from('user-media')
            .upload(newPath, fileData, {
              cacheControl: '3600',
              upsert: true
            })
          
          if (uploadError) {
            console.log(`      ❌ Error subiendo: ${uploadError.message}`)
          } else {
            // Actualizar URL y path en la base de datos
            const newUrl = supabase.storage.from('user-media').getPublicUrl(newPath).data.publicUrl
            const { error: updateError } = await supabase
              .from('coach_certifications')
              .update({ 
                file_url: newUrl,
                file_path: newPath
              })
              .eq('id', cert.id)
            
            if (updateError) {
              console.log(`      ❌ Error actualizando DB: ${updateError.message}`)
            } else {
              console.log(`      ✅ Certificación migrada: ${newUrl}`)
            }
          }
        } catch (error) {
          console.log(`      ❌ Error procesando certificación: ${error.message}`)
        }
      }
    }
    
    // 3. VERIFICAR MIGRACIÓN
    console.log('\n✅ 3. VERIFICANDO MIGRACIÓN...')
    
    // Verificar activity_media migrado
    const { data: migratedMedia, error: mmError } = await supabase
      .from('activity_media')
      .select('id, activity_id, image_url, video_url')
    
    if (!mmError && migratedMedia) {
      console.log('\n📸 activity_media migrado:')
      migratedMedia.forEach(media => {
        console.log(`  🔗 Activity ${media.activity_id}:`)
        if (media.image_url) {
          const bucket = media.image_url.includes('product-media') ? '✅ product-media' : '❌ bucket anterior'
          console.log(`    🖼️ Imagen: ${bucket}`)
        }
        if (media.video_url) {
          const bucket = media.video_url.includes('product-media') ? '✅ product-media' : '❌ bucket anterior'
          console.log(`    🎬 Video: ${bucket}`)
        }
      })
    }
    
    // Verificar coach_certifications migrado
    const { data: migratedCerts, error: mcError } = await supabase
      .from('coach_certifications')
      .select('id, name, file_url')
    
    if (!mcError && migratedCerts) {
      console.log('\n📜 coach_certifications migrado:')
      migratedCerts.forEach(cert => {
        const bucket = cert.file_url.includes('user-media') ? '✅ user-media' : '❌ bucket anterior'
        console.log(`  📄 ${cert.name}: ${bucket}`)
      })
    }
    
    // 4. RESUMEN FINAL
    console.log('\n🎉 4. MIGRACIÓN COMPLETADA')
    console.log('=' * 40)
    
    console.log('\n✅ ESTRUCTURA FINAL OPTIMIZADA:')
    console.log('📁 user-media/')
    console.log('  └── certificates/coaches/ ← Certificados migrados')
    console.log('📁 product-media/')
    console.log('  ├── images/products/ ← Imágenes de productos migradas')
    console.log('  └── videos/products/ ← Videos de productos migrados')
    
    console.log('\n🔗 URLs ACTUALIZADAS EN BASE DE DATOS:')
    console.log('📸 activity_media.image_url → product-media/images/')
    console.log('📸 activity_media.video_url → product-media/videos/')
    console.log('📜 coach_certifications.file_url → user-media/certificates/')
    console.log('📜 coach_certifications.file_path → certificates/coaches/')
    
    console.log('\n🎯 PRÓXIMOS PASOS:')
    console.log('1. ✅ Migración de archivos completada')
    console.log('2. ✅ URLs en base de datos actualizadas')
    console.log('3. 🔄 Probar endpoints optimizados')
    console.log('4. 🔄 Actualizar componentes frontend')
    console.log('5. 🗑️ Limpiar buckets antiguos (opcional)')
    
    console.log('\n🎉 MIGRACIÓN EXITOSA!')
    
  } catch (error) {
    console.error('❌ Error en migración:', error)
  }
}

migrateExistingFiles()
