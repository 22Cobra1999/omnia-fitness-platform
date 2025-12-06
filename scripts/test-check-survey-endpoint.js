/**
 * Script para probar el endpoint check-coach-survey simulando la lógica del endpoint
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

// Cargar variables de entorno
const envPaths = ['.env.local', '.env']
for (const envFile of envPaths) {
  const envPath = path.join(__dirname, '..', envFile)
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/)
        if (match) {
          let [, key, value] = match
          key = key.trim()
          value = value.trim()
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
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables de entorno faltantes')
  process.exit(1)
}

// Simular la lógica del endpoint
async function testEndpoint() {
  const activityId = 48
  const clientId = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'

  console.log('🔍 Probando lógica del endpoint...')
  console.log('')

  // 1. Crear service role client (como en el endpoint)
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('✅ Service role client creado')
  console.log('')

  // 2. Obtener actividad
  const { data: activity, error: activityError } = await serviceClient
    .from('activities')
    .select('id, type, coach_id, workshop_versions')
    .eq('id', activityId)
    .single()

  if (activityError || !activity) {
    console.error('❌ Error al obtener actividad:', activityError)
    return
  }

  const versions = activity.workshop_versions?.versions || []
  const currentVersion = versions.length > 0 ? versions[versions.length - 1].version : null
  const currentVersionInt = typeof currentVersion === 'number' 
    ? Math.floor(currentVersion) 
    : parseInt(String(currentVersion), 10)

  console.log('📋 Actividad:', {
    id: activity.id,
    type: activity.type,
    coach_id: activity.coach_id,
    currentVersion,
    currentVersionInt
  })
  console.log('')

  // 3. Ejecutar la query exacta del endpoint
  console.log('🔍 Ejecutando query del endpoint:')
  console.log('   .from("activity_surveys")')
  console.log('   .select("id, coach_method_rating, comments, workshop_version")')
  console.log('   .eq("activity_id",', activityId, ')')
  console.log('   .eq("client_id",', clientId, ')')
  console.log('   .not("coach_method_rating", "is", null)')
  console.log('')

  const { data: surveys, error: surveyError } = await serviceClient
    .from('activity_surveys')
    .select('id, coach_method_rating, comments, workshop_version')
    .eq('activity_id', activityId)
    .eq('client_id', clientId)
    .not('coach_method_rating', 'is', null)

  console.log('📊 Resultado de la query:')
  console.log('   - Error:', surveyError ? JSON.stringify(surveyError, null, 2) : 'null')
  console.log('   - Surveys encontradas:', surveys?.length || 0)
  if (surveys && surveys.length > 0) {
    surveys.forEach((s, i) => {
      console.log(`   ${i + 1}. ID: ${s.id}`)
      console.log(`      - workshop_version: ${s.workshop_version} (tipo: ${typeof s.workshop_version})`)
      console.log(`      - coach_method_rating: ${s.coach_method_rating}`)
    })
  }
  console.log('')

  // 4. Filtrar por versión (como en el endpoint)
  if (surveys && surveys.length > 0) {
    console.log('🔍 Filtrando por versión:', currentVersionInt)
    const survey = surveys.find((s) => {
      let surveyVersion = null
      if (s.workshop_version !== null && s.workshop_version !== undefined) {
        if (typeof s.workshop_version === 'number') {
          surveyVersion = Math.floor(s.workshop_version)
        } else if (typeof s.workshop_version === 'string') {
          surveyVersion = parseInt(s.workshop_version, 10)
        } else {
          surveyVersion = Number(s.workshop_version)
          if (isNaN(surveyVersion)) {
            surveyVersion = null
          } else {
            surveyVersion = Math.floor(surveyVersion)
          }
        }
      }
      const matches = surveyVersion !== null && surveyVersion === currentVersionInt
      console.log(`   - Survey ${s.id}: version=${surveyVersion}, current=${currentVersionInt}, matches=${matches}`)
      return matches
    }) || null

    console.log('')
    console.log('📊 RESULTADO FINAL:')
    if (survey) {
      console.log('✅ ENCUESTA ENCONTRADA:', {
        id: survey.id,
        workshop_version: survey.workshop_version,
        coach_method_rating: survey.coach_method_rating,
        hasSurvey: true
      })
    } else {
      console.log('❌ NO SE ENCONTRÓ ENCUESTA que coincida con la versión')
      console.log('   - Versión actual del taller:', currentVersionInt)
      console.log('   - Versiones de las encuestas encontradas:', surveys.map(s => s.workshop_version))
    }
  } else {
    console.log('❌ NO SE ENCONTRARON ENCUESTAS')
    if (surveyError) {
      console.log('   Error:', surveyError)
    }
  }
}

testEndpoint().catch(console.error)

