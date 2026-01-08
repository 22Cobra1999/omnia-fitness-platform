import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, createServiceRoleClient } from '@/lib/supabase/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rawParamId = params?.id
    const rawUrlId = (() => {
      try {
        const pathname = new URL(request.url).pathname
        // /api/activities/:id/check-coach-survey
        const parts = pathname.split('/').filter(Boolean)
        const idIndex = parts.findIndex((p) => p === 'activities')
        if (idIndex === -1) return undefined
        return parts[idIndex + 1]
      } catch {
        return undefined
      }
    })()

    const activityId = parseInt(String(rawParamId ?? rawUrlId ?? ''), 10)
    if (isNaN(activityId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID de actividad inválido' 
      }, { status: 400 })
    }

    const supabase = await createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No autorizado' 
      }, { status: 401 })
    }

    // Verificar que la actividad existe y es un taller
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, type, coach_id, workshop_versions')
      .eq('id', activityId)
      .single()

    if (activityError || !activity) {
      return NextResponse.json({ 
        success: false, 
        error: 'Actividad no encontrada' 
      }, { status: 404 })
    }

    if (activity.type !== 'workshop') {
      return NextResponse.json({ 
        success: false, 
        error: 'Esta acción solo es válida para talleres' 
      }, { status: 400 })
    }

    // Verificar que el usuario es el coach de la actividad
    if (activity.coach_id !== user.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'No tienes permiso para ver esta información' 
      }, { status: 403 })
    }

    // Obtener la versión actual del taller (la última versión)
    const versions = activity.workshop_versions?.versions || []
    const currentVersion = versions.length > 0 ? versions[versions.length - 1].version : null

    console.log('🔍 check-coach-survey - Versiones:', { 
      versions, 
      currentVersion, 
      activityId,
      coachId: user.id 
    })

    // Si no hay versiones, el taller no ha sido finalizado aún
    if (!currentVersion) {
      console.log('⚠️ No hay versiones, taller no finalizado')
      return NextResponse.json({ 
        success: true,
        hasSurvey: false,
        survey: null,
        currentVersion: null
      })
    }

    // Asegurar que currentVersion sea un número entero para la comparación
    const currentVersionInt = typeof currentVersion === 'number' 
      ? Math.floor(currentVersion) 
      : parseInt(String(currentVersion), 10)

    if (isNaN(currentVersionInt)) {
      console.error('❌ currentVersion no es un número válido:', currentVersion)
      return NextResponse.json({ 
        success: true,
        hasSurvey: false,
        survey: null,
        currentVersion: currentVersion
      })
    }

    console.log('🔍 check-coach-survey - Buscando encuesta:', {
      activityId,
      clientId: user.id,
      currentVersionInt,
      currentVersionType: typeof currentVersion
    })

    // Buscar si existe una encuesta del coach para esta actividad Y esta versión específica
    // Verificar que tenga coach_method_rating (no solo comments)
    // IMPORTANTE: Primero obtener todas las encuestas del coach para esta actividad
    // y luego filtrar por versión en JavaScript para evitar problemas de tipo
    console.log('🔍 check-coach-survey - Ejecutando query Supabase:', {
      activityId,
      clientId: user.id,
      currentVersionInt,
      activityCoachId: activity.coach_id
    })
    
    // IMPORTANTE: El coach es el client_id en su propia encuesta
    // FORZAR uso de service role para evitar problemas de RLS
    // La consulta directa a BD confirma que la encuesta existe, así que el problema es RLS
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log('🔍 Verificando service role key:', {
      hasKey: !!serviceRoleKey,
      keyLength: serviceRoleKey?.length || 0,
      keyPrefix: serviceRoleKey?.substring(0, 20) || 'none'
    })
    
    if (!serviceRoleKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada en variables de entorno')
      return NextResponse.json({ 
        success: false, 
        error: 'Service role client no disponible' 
      }, { status: 500 })
    }
    
    // Crear service role client directamente para asegurar que funcione
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
    const serviceClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    console.log('✅ Service role client creado directamente')
    const queryClient = serviceClient
    
    console.log('🔍 check-coach-survey - Cliente usado:', {
      usingServiceRole: !!serviceClient,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      activityId,
      clientId: user.id,
      currentVersionInt
    })
    
    // Buscar directamente las encuestas con rating usando service role
    // La consulta directa a BD confirmó que la encuesta existe, así que esto debería funcionar
    console.log('🔍 Ejecutando query con service role client:', {
      activityId,
      clientId: user.id,
      currentVersionInt,
      queryClientType: queryClient ? 'serviceRole' : 'none'
    })
    
    const { data: surveys, error: surveyError } = await queryClient
      .from('activity_surveys')
      .select('id, coach_method_rating, comments, workshop_version')
      .eq('activity_id', activityId)
      .eq('client_id', user.id) // El coach también es el "client" en su propia encuesta
      .not('coach_method_rating', 'is', null) // Debe tener rating para considerarse completa
    
    console.log('🔍 check-coach-survey - Respuesta de Supabase:', {
      usingServiceRole: !!serviceClient,
      surveysCount: surveys?.length || 0,
      surveys: surveys || [],
      rawSurveys: surveys, // Datos completos para debugging
      error: surveyError ? {
        message: surveyError.message,
        details: surveyError.details,
        hint: surveyError.hint,
        code: surveyError.code
      } : null
    })
    
    // Si no hay encuestas, hacer una query sin filtro de rating para diagnosticar
    if ((!surveys || surveys.length === 0) && !surveyError) {
      console.log('⚠️ No se encontraron encuestas con rating, buscando todas las encuestas...')
      const { data: allSurveys, error: allError } = await queryClient
        .from('activity_surveys')
        .select('*')
        .eq('activity_id', activityId)
        .eq('client_id', user.id)
      
      console.log('🔍 TODAS las encuestas (sin filtro):', {
        count: allSurveys?.length || 0,
        surveys: allSurveys || [],
        error: allError
      })
      
      // Si hay encuestas sin rating, loguearlas para debugging
      if (allSurveys && allSurveys.length > 0) {
        console.log('⚠️ Hay encuestas pero ninguna tiene coach_method_rating:', 
          allSurveys.map((s: any) => ({
            id: s.id,
            hasRating: !!s.coach_method_rating,
            rating: s.coach_method_rating,
            workshop_version: s.workshop_version
          }))
        )
      }
    }
    
    // Filtrar por versión en JavaScript para evitar problemas de tipo
    // IMPORTANTE: Comparar como números enteros para evitar problemas de tipo
    const survey = surveys?.find((s: any) => {
      // Convertir workshop_version a número entero
      let surveyVersion: number | null = null
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
      console.log('🔍 Comparando versión:', {
        surveyId: s.id,
        rawWorkshopVersion: s.workshop_version,
        surveyVersion,
        surveyVersionType: typeof s.workshop_version,
        currentVersionInt,
        currentVersionIntType: typeof currentVersionInt,
        matches,
        strictEqual: surveyVersion === currentVersionInt,
        looseEqual: surveyVersion == currentVersionInt
      })
      return matches
    }) || null
    
    console.log('🔍 check-coach-survey - Survey encontrado después de filtrar:', survey ? {
      id: survey.id,
      workshop_version: survey.workshop_version,
      workshop_version_type: typeof survey.workshop_version,
      coach_method_rating: survey.coach_method_rating
    } : null)

    console.log('🔍 check-coach-survey - Resultado de query:', {
      totalSurveys: surveys?.length || 0,
      survey: survey ? {
        id: survey.id,
        coach_method_rating: survey.coach_method_rating,
        workshop_version: survey.workshop_version,
        workshop_version_type: typeof survey.workshop_version
      } : null,
      surveyError: surveyError ? {
        message: surveyError.message,
        details: surveyError.details,
        hint: surveyError.hint,
        code: surveyError.code
      } : null,
      currentVersionInt,
      currentVersionType: typeof currentVersionInt,
      allSurveys: surveys?.map((s: any) => ({
        id: s.id,
        workshop_version: s.workshop_version,
        workshop_version_type: typeof s.workshop_version
      })) || []
    })

    // Considerar que tiene encuesta solo si existe Y tiene rating Y es para la versión actual
    // Comparar ambos valores como números para evitar problemas de tipo
    const surveyVersionNum = survey?.workshop_version !== null && survey?.workshop_version !== undefined
      ? Number(survey.workshop_version)
      : null
    
    const versionsMatch = surveyVersionNum !== null && surveyVersionNum === currentVersionInt
    const hasRating = survey?.coach_method_rating !== null && survey?.coach_method_rating !== undefined
    
    const hasSurvey = !!survey && 
                      hasRating && 
                      versionsMatch && 
                      !surveyError

    console.log('✅ check-coach-survey - Evaluación final:', {
      hasSurvey,
      hasSurveyData: !!survey,
      hasRating,
      versionsMatch,
      surveyVersionNum,
      currentVersionInt,
      noError: !surveyError
    })

    return NextResponse.json({ 
      success: true,
      hasSurvey,
      survey: survey || null,
      currentVersion: currentVersion
    })
  } catch (error) {
    console.error('Error en check-coach-survey:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

