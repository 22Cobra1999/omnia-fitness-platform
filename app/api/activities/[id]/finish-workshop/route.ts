import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, createServiceRoleClient } from '@/lib/supabase/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const rawParamId = resolvedParams?.id
    const rawUrlId = (() => {
      try {
        const pathname = new URL(request.url).pathname
        // /api/activities/:id/finish-workshop
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

    const { is_finished, coach_rating, coach_feedback } = await request.json()
    console.log('📬 [API:finish-workshop] Received data:', { is_finished, coach_rating, coach_feedback })

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
      .select('id, type, coach_id, created_at')
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
        error: 'No tienes permiso para finalizar este taller'
      }, { status: 403 })
    }

    // Función helper para formatear fecha a dd/mm/aa
    const formatDateSpanish = (date: Date | string): string => {
      const d = typeof date === 'string' ? new Date(date) : date
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = String(d.getFullYear()).slice(-2)
      return `${day}/${month}/${year}`
    }

    // Obtener versiones actuales y estado de finalización
    const { data: currentActivity } = await supabase
      .from('activities')
      .select('workshop_versions, created_at, is_finished')
      .eq('id', activityId)
      .single()

    const finishedAt = is_finished === true ? new Date().toISOString() : null
    const startedAt = activity.created_at || new Date().toISOString()

    // Determinar la versión actual del taller
    const currentVersions = currentActivity?.workshop_versions?.versions || []
    const wasAlreadyFinished = currentActivity?.is_finished === true
    let currentVersion = 0

    console.log('📊 Estado del taller:', {
      activityId,
      wasAlreadyFinished,
      currentVersionsCount: currentVersions.length,
      currentVersions,
      is_finished,
      coach_rating,
      coach_feedback: coach_feedback ? 'presente' : 'vacío'
    })

    // Si se está finalizando Y el taller no estaba finalizado antes, agregar nueva versión
    if (is_finished === true && !wasAlreadyFinished) {
      // El taller se está finalizando por primera vez, crear nueva versión
      const nextVersion = currentVersions.length + 1
      currentVersion = nextVersion // La nueva versión que se está creando

      const newVersion = {
        version: nextVersion,
        empezada_el: formatDateSpanish(startedAt),
        finalizada_el: formatDateSpanish(finishedAt!)
      }

      const updateData: any = {
        is_finished: is_finished === true,
        finished_at: finishedAt,
        workshop_versions: {
          versions: [...currentVersions, newVersion]
        }
      }

      const { error: updateError } = await supabase
        .from('activities')
        .update(updateData)
        .eq('id', activityId)

      if (updateError) {
        console.error('Error actualizando taller:', updateError)
        return NextResponse.json({
          success: false,
          error: 'Error al actualizar el taller'
        }, { status: 500 })
      }
    } else {
      // El taller ya estaba finalizado o solo se está enviando la encuesta
      // Usar la última versión existente para asociar la encuesta
      if (currentVersions.length > 0) {
        currentVersion = currentVersions[currentVersions.length - 1].version
        console.log('✅ Taller ya finalizado, usando versión existente:', currentVersion)
      } else {
        // No hay versiones, pero el taller está finalizado
        // Esto no debería pasar, pero por seguridad usar versión 1
        currentVersion = 1
        console.log('⚠️ No hay versiones, usando versión 1 por defecto')
      }

      // Solo actualizar is_finished y finished_at si cambió
      if (is_finished !== wasAlreadyFinished) {
        const updateData: any = {
          is_finished: is_finished === true,
          finished_at: finishedAt
        }

        const { error: updateError } = await supabase
          .from('activities')
          .update(updateData)
          .eq('id', activityId)

        if (updateError) {
          console.error('Error actualizando taller:', updateError)
          return NextResponse.json({
            success: false,
            error: 'Error al actualizar el taller'
          }, { status: 500 })
        }
      }
    }

    // Guardar feedback y rating en activity_surveys (si se proporcionan)
    if ((coach_rating !== null && coach_rating !== undefined) || (coach_feedback !== null && coach_feedback !== undefined)) {
      // Validar rating si se proporciona
      if (coach_rating !== null && coach_rating !== undefined) {
        if (coach_rating < 1 || coach_rating > 5) {
          return NextResponse.json({
            success: false,
            error: 'La puntuación debe estar entre 1 y 5'
          }, { status: 400 })
        }
      }

      // Para encuestas de coaches, enrollment_id es opcional
      // El coach no necesita estar "enrolled" en su propia actividad
      // Intentar buscar enrollment existente, pero no es obligatorio
      const { data: enrollment } = await supabase
        .from('activity_enrollments')
        .select('id')
        .eq('activity_id', activityId)
        .eq('client_id', user.id)
        .maybeSingle()

      let enrollmentId = enrollment?.id

      console.log('🔍 Buscando enrollment (opcional para coach):', {
        activityId,
        clientId: user.id,
        enrollmentFound: !!enrollmentId,
        enrollmentId
      })

      // Si no existe enrollment, no es problema - el coach puede completar la encuesta sin enrollment
      if (enrollmentId) {
        console.log('✅ Enrollment existente encontrado:', enrollmentId)
      } else {
        console.log('ℹ️ No hay enrollment para el coach (esto es normal, enrollment_id será NULL)')
      }

      // Buscar si ya existe una encuesta del coach para esta versión específica
      const { data: existingSurvey } = await supabase
        .from('activity_surveys')
        .select('id')
        .eq('activity_id', activityId)
        .eq('client_id', user.id)
        .eq('workshop_version', currentVersion)
        .maybeSingle()

      console.log('📊 Guardando encuesta:', {
        activityId,
        clientId: user.id,
        enrollmentId,
        currentVersion,
        coach_rating,
        coach_feedback: coach_feedback ? 'presente' : 'vacío',
        existingSurveyId: existingSurvey?.id || null
      })

      const surveyData: any = {
        activity_id: activityId,
        client_id: user.id,
        enrollment_id: enrollmentId || null, // Opcional para coaches
        workshop_version: currentVersion // Guardar la versión del taller
        // created_at se establece automáticamente por la base de datos
      }

      if (coach_rating !== null && coach_rating !== undefined) {
        // Usar coach_method_rating para la calificación del coach
        surveyData.coach_method_rating = coach_rating
      }

      if (coach_feedback !== null && coach_feedback !== undefined && coach_feedback.trim()) {
        surveyData.comments = coach_feedback.trim()
      }

      if (existingSurvey) {
        // Actualizar encuesta existente para esta versión
        console.log('🔄 Actualizando encuesta existente:', existingSurvey.id)
        const { error: surveyError } = await supabase
          .from('activity_surveys')
          .update(surveyData)
          .eq('id', existingSurvey.id)

        if (surveyError) {
          console.error('❌ [API:finish-workshop] Error updating coach survey:', {
            error: surveyError,
            message: surveyError.message,
            details: surveyError.details,
            hint: surveyError.hint,
            code: surveyError.code,
            surveyData
          })
          return NextResponse.json({
            success: false,
            error: `Error al guardar la encuesta: ${surveyError.message || 'Error desconocido'}`
          }, { status: 500 })
        }
        console.log('✅ Encuesta actualizada exitosamente')
      } else {
        // Crear nueva encuesta para esta versión
        console.log('➕ Creando nueva encuesta')
        const { error: surveyError } = await supabase
          .from('activity_surveys')
          .insert(surveyData)

        if (surveyError) {
          console.error('❌ [API:finish-workshop] Error creating coach survey:', {
            error: surveyError,
            message: surveyError.message,
            details: surveyError.details,
            hint: surveyError.hint,
            code: surveyError.code,
            surveyData
          })
          return NextResponse.json({
            success: false,
            error: `Error al guardar la encuesta: ${surveyError.message || 'Error desconocido'}`
          }, { status: 500 })
        }
        console.log('✅ Encuesta creada exitosamente')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Taller finalizado exitosamente',
      version: currentVersion // Devolver la versión para referencia
    })
  } catch (error) {
    console.error('Error en finish-workshop:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

