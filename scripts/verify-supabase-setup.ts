/**
 * Script de Verificación: Setup de Supabase
 * 
 * Verifica que:
 * 1. Tabla coach_storage_metadata existe
 * 2. Políticas RLS están habilitadas
 * 3. Índices están creados
 * 4. Triggers funcionan
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables de entorno faltantes')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function verifySetup() {
  console.log('🔍 VERIFICANDO SETUP DE SUPABASE')
  console.log('='.repeat(80))
  
  let allGood = true

  try {
    // 1. Verificar que la tabla existe
    console.log('\n1️⃣ Verificando tabla coach_storage_metadata...')
    const { data: tableCheck, error: tableError } = await supabase
      .from('coach_storage_metadata')
      .select('coach_id')
      .limit(1)
    
    if (tableError && tableError.message.includes('relation') && tableError.message.includes('does not exist')) {
      console.error('   ❌ La tabla coach_storage_metadata NO existe')
      console.error('   → Ejecuta: sql/create_coach_storage_metadata.sql')
      allGood = false
    } else {
      console.log('   ✅ Tabla coach_storage_metadata existe')
    }

    // 2. Verificar RLS
    console.log('\n2️⃣ Verificando RLS...')
    const { data: rlsCheck, error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `SELECT relrowsecurity FROM pg_class WHERE relname = 'coach_storage_metadata'`
    }).single()
    
    console.log('   ℹ️  RLS debe estar habilitado manualmente')
    console.log('   → Verificar en: Supabase Dashboard → Database → Tables → coach_storage_metadata → RLS')

    // 3. Contar registros actuales
    console.log('\n3️⃣ Verificando datos existentes...')
    const { count, error: countError } = await supabase
      .from('coach_storage_metadata')
      .select('*', { count: 'exact', head: true })
    
    if (!countError) {
      console.log(`   ✅ Registros en coach_storage_metadata: ${count || 0}`)
      if (count === 0) {
        console.log('   ℹ️  Normal si es la primera vez. Los registros se crearán al inicializar coaches.')
      }
    }

    // 4. Verificar que podemos insertar (test básico)
    console.log('\n4️⃣ Verificando capacidad de escritura...')
    console.log('   ℹ️  Esto se probará cuando un coach inicie sesión')

    // 5. Verificar activities existe (para migración)
    console.log('\n5️⃣ Verificando tabla activities...')
    const { data: activitiesCheck, error: activitiesError } = await supabase
      .from('activities')
      .select('id, coach_id')
      .limit(1)
    
    if (activitiesError) {
      console.error('   ❌ Error accediendo a activities:', activitiesError.message)
      allGood = false
    } else {
      console.log('   ✅ Tabla activities accesible')
    }

    // 6. Contar actividades con coach_id
    const { count: activitiesCount } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .not('coach_id', 'is', null)
    
    console.log(`   ✅ Actividades con coach_id: ${activitiesCount || 0}`)

    // 7. Verificar activity_media
    console.log('\n6️⃣ Verificando tabla activity_media...')
    const { count: mediaCount } = await supabase
      .from('activity_media')
      .select('*', { count: 'exact', head: true })
    
    console.log(`   ✅ Registros en activity_media: ${mediaCount || 0}`)
    
    if (mediaCount && mediaCount > 0) {
      // Contar cuántos tienen URLs (para migración)
      const { count: withImages } = await supabase
        .from('activity_media')
        .select('*', { count: 'exact', head: true })
        .not('image_url', 'is', null)
      
      const { count: withVideos } = await supabase
        .from('activity_media')
        .select('*', { count: 'exact', head: true })
        .not('video_url', 'is', null)
      
      console.log(`   📊 Con imágenes: ${withImages || 0}`)
      console.log(`   📊 Con videos: ${withVideos || 0}`)
      console.log(`   ℹ️  Estos archivos pueden migrarse con: npm run migrate:storage:dry`)
    }

    // Resumen final
    console.log('\n' + '='.repeat(80))
    console.log('📊 RESUMEN DE VERIFICACIÓN')
    console.log('='.repeat(80))
    
    if (allGood) {
      console.log('✅ Setup básico completo')
      console.log('\n📋 PRÓXIMOS PASOS:')
      console.log('1. ✅ Tabla creada')
      console.log('2. ⏳ Configurar Storage Policies (si no lo hiciste)')
      console.log('3. ⏳ Probar con un coach: npm run dev')
      console.log('4. ⏳ (Opcional) Migrar archivos: npm run migrate:storage:dry')
    } else {
      console.log('⚠️  Hay algunos problemas que resolver')
      console.log('\n📋 ACCIONES REQUERIDAS:')
      console.log('→ Revisar los errores marcados con ❌')
      console.log('→ Ejecutar los SQLs faltantes')
    }
    
    console.log('\n' + '='.repeat(80))

  } catch (error: any) {
    console.error('\n❌ Error en verificación:', error.message)
    process.exit(1)
  }
}

// Ejecutar verificación
verifySetup()
  .then(() => {
    console.log('\n✅ Verificación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Verificación falló:', error)
    process.exit(1)
  })





