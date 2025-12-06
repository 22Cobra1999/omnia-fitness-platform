/**
 * Script para verificar directamente en la BD si existe la encuesta del coach
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

// Cargar variables de entorno manualmente
const envPaths = ['.env.local', '.env']
for (const envFile of envPaths) {
  const envPath = path.join(__dirname, '..', envFile)
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        // Manejar casos con y sin comillas
        const match = trimmed.match(/^([^=]+)=(.*)$/)
        if (match) {
          let [, key, value] = match
          key = key.trim()
          value = value.trim()
          // Remover comillas al inicio y final
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
          }
          process.env[key] = value
        }
      }
    })
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Variables de entorno:')
console.log('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅ Configurada' : '❌ Faltante')
console.log('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✅ Configurada' : '❌ Faltante')
console.log('')

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables de entorno faltantes')
  console.error('   Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkSurvey() {
  const activityId = 48
  const clientId = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
  const workshopVersion = 1

  console.log('🔍 Verificando encuesta en BD...')
  console.log('   Activity ID:', activityId)
  console.log('   Client ID:', clientId)
  console.log('   Workshop Version:', workshopVersion)
  console.log('')

  // 1. Verificar la actividad
  console.log('📋 1. Verificando actividad...')
  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .select('id, type, coach_id, workshop_versions, is_finished')
    .eq('id', activityId)
    .single()

  if (activityError || !activity) {
    console.error('❌ Error al obtener actividad:', activityError)
    return
  }

  console.log('✅ Actividad encontrada:')
  console.log('   - Tipo:', activity.type)
  console.log('   - Coach ID:', activity.coach_id)
  console.log('   - Is Finished:', activity.is_finished)
  console.log('   - Workshop Versions:', JSON.stringify(activity.workshop_versions, null, 2))
  
  const versions = activity.workshop_versions?.versions || []
  const currentVersion = versions.length > 0 ? versions[versions.length - 1].version : null
  console.log('   - Current Version:', currentVersion)
  console.log('')

  // 2. Buscar TODAS las encuestas (sin filtros)
  console.log('📋 2. Buscando TODAS las encuestas para esta actividad y cliente...')
  const { data: allSurveys, error: allSurveysError } = await supabase
    .from('activity_surveys')
    .select('*')
    .eq('activity_id', activityId)
    .eq('client_id', clientId)

  if (allSurveysError) {
    console.error('❌ Error al buscar encuestas:', allSurveysError)
    return
  }

  console.log(`✅ Encontradas ${allSurveys?.length || 0} encuestas (sin filtros):`)
  allSurveys?.forEach((s, i) => {
    console.log(`   ${i + 1}. ID: ${s.id}`)
    console.log(`      - workshop_version: ${s.workshop_version} (tipo: ${typeof s.workshop_version})`)
    console.log(`      - coach_method_rating: ${s.coach_method_rating}`)
    console.log(`      - comments: ${s.comments}`)
    console.log(`      - enrollment_id: ${s.enrollment_id}`)
  })
  console.log('')

  // 3. Buscar solo las que tienen rating
  console.log('📋 3. Buscando encuestas CON rating...')
  const { data: surveysWithRating, error: surveysError } = await supabase
    .from('activity_surveys')
    .select('*')
    .eq('activity_id', activityId)
    .eq('client_id', clientId)
    .not('coach_method_rating', 'is', null)

  if (surveysError) {
    console.error('❌ Error al buscar encuestas con rating:', surveysError)
    return
  }

  console.log(`✅ Encontradas ${surveysWithRating?.length || 0} encuestas CON rating:`)
  surveysWithRating?.forEach((s, i) => {
    console.log(`   ${i + 1}. ID: ${s.id}`)
    console.log(`      - workshop_version: ${s.workshop_version} (tipo: ${typeof s.workshop_version})`)
    console.log(`      - coach_method_rating: ${s.coach_method_rating}`)
  })
  console.log('')

  // 4. Filtrar por versión
  console.log('📋 4. Filtrando por versión actual...')
  const matchingSurveys = surveysWithRating?.filter((s) => {
    const surveyVersion = s.workshop_version !== null && s.workshop_version !== undefined
      ? Number(s.workshop_version)
      : null
    const matches = surveyVersion !== null && surveyVersion === Number(currentVersion)
    console.log(`   - Survey ${s.id}: version=${surveyVersion}, current=${currentVersion}, matches=${matches}`)
    return matches
  }) || []

  console.log(`✅ Encontradas ${matchingSurveys.length} encuestas que coinciden con la versión actual`)
  console.log('')

  // 5. Resultado final
  console.log('📊 RESULTADO FINAL:')
  if (matchingSurveys.length > 0) {
    console.log('✅ SÍ existe encuesta completada para esta versión')
    matchingSurveys.forEach((s) => {
      console.log(`   - ID: ${s.id}`)
      console.log(`   - Rating: ${s.coach_method_rating}`)
      console.log(`   - Version: ${s.workshop_version}`)
    })
  } else {
    console.log('❌ NO existe encuesta completada para esta versión')
    console.log('')
    console.log('🔍 Posibles causas:')
    if (allSurveys?.length === 0) {
      console.log('   - No hay ninguna encuesta para esta actividad y cliente')
    } else if (surveysWithRating?.length === 0) {
      console.log('   - Hay encuestas pero ninguna tiene coach_method_rating')
    } else {
      console.log('   - Hay encuestas con rating pero ninguna coincide con la versión actual')
      console.log(`   - Versión actual del taller: ${currentVersion}`)
      console.log(`   - Versiones de las encuestas: ${surveysWithRating?.map(s => s.workshop_version).join(', ')}`)
    }
  }
}

checkSurvey().catch(console.error)

