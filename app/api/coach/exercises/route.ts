import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, createServiceRoleClient } from '@/lib/supabase/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'fitness' // 'fitness' | 'nutricion'
    const active = searchParams.get('active') // 'true' | 'false' | null (todos)

    const isNutrition = category === 'nutricion' || category === 'nutrition'
    const tableName = isNutrition ? 'nutrition_program_details' : 'ejercicios_detalles'
    const nameField = isNutrition ? 'nombre' : 'nombre_ejercicio'

    console.log(`📥 COACH/EXERCISES: Obteniendo ${category} del coach ${user.id}`, {
      tableName,
      active,
      userId: user.id
    })

    // Obtener todas las actividades del coach primero
    const { data: coachActivities, error: activitiesError } = await supabase
      .from('activities')
      .select('id')
      .eq('coach_id', user.id)

    if (activitiesError) {
      console.error(`❌ COACH/EXERCISES: Error obteniendo actividades del coach:`, activitiesError)
    }

    const activityIds = (coachActivities || []).map((a: any) => a.id)
    console.log(`📋 COACH/EXERCISES: Coach tiene ${activityIds.length} actividades`)

    // Estrategia 1: Buscar directamente por coach_id
    let query = supabase
      .from(tableName)
      .select('*')
      .eq('coach_id', user.id)

    // Para nutrición: Si la tabla tiene is_active, filtrar si se solicita
    if (isNutrition && active) {
      if (active === 'true') {
        query = query.eq('is_active', true)
      } else if (active === 'false') {
        query = query.eq('is_active', false)
      }
    }

    // Ordenar por id
    let { data, error } = await query.order('id', { ascending: false })

    console.log(`🔍 COACH/EXERCISES: Estrategia 1 (coach_id) retornó ${data?.length || 0} registros. Error: ${error?.message || 'ninguno'}`)

    // Fallback AGRESIVO: Si no hay datos (o hay error), intentar con adminSupabase
    // Esto asegura que si RLS está bloqueando la visibilidad del coach sobre sus propios datos (un problema común), 
    // aún podamos recuperarlos ya que estamos filtrando explícitamente por su coach_id.
    if (!data || data.length === 0 || error) {
      const adminSupabase = createServiceRoleClient()
      if (adminSupabase) {
        console.log(`🔍 COACH/EXERCISES: Intentando fallback con adminSupabase...`)
        const adminQuery = adminSupabase
          .from(tableName)
          .select('*')
          .eq('coach_id', user.id)

        // Aplicar el mismo filtro de is_active para nutrición si corresponde
        if (isNutrition && active) {
          if (active === 'true') {
            adminQuery.eq('is_active', true)
          } else if (active === 'false') {
            adminQuery.eq('is_active', false)
          }
        }

        const { data: adminData, error: adminError } = await adminQuery.order('id', { ascending: false })

        if (!adminError && adminData && adminData.length > 0) {
          console.log(`✅ COACH/EXERCISES: Encontrados ${adminData.length} registros con adminSupabase`)
          data = adminData
          error = null // Limpiar el error de la consulta anterior si el fallback funcionó
        } else {
          console.warn(`⚠️ COACH/EXERCISES: adminSupabase fallback tampoco encontró datos u ocurrió un error:`, adminError?.message)
        }
      }
    }

    // Si no hay datos o hubo error (pero no es nutrición), intentar buscar a través de actividades
    if ((!data || data.length === 0) && !error && activityIds.length > 0) {
      if (isNutrition) {
        // Para nutrición, si no hay datos por coach_id, simplemente retornar vacío
        console.log(`ℹ️ COACH/EXERCISES: No se encontraron ${category} por coach_id`)
      } else {
        // Para fitness: buscar en activity_id (JSONB)
        if (activityIds.length > 0) {
          const activityKeyObjs = activityIds.map((id: number) => ({ [id.toString()]: {} }))

          // Construir condición OR
          const orConditions = activityIds.map((id: number) =>
            `activity_id.cs.{${id}}`
          ).join(',')

          let query2 = supabase
            .from(tableName)
            .select('*')
            .or(orConditions)

          // Para ejercicios_detalles, no filtramos por is_active aquí
          // El estado activo está en activity_id (JSONB)

          const { data: data2, error: error2 } = await query2.order('id', { ascending: false })

          if (!error2 && data2 && data2.length > 0) {
            console.log(`✅ COACH/EXERCISES: Encontrados ${data2.length} ${category} a través de actividades`)
            data = data2
            error = null
          } else if (error2) {
            console.warn(`⚠️ COACH/EXERCISES: Error buscando por actividades:`, error2.message)
          }
        }
      }
    }

    if (error) {
      console.error(`❌ COACH/EXERCISES: Error obteniendo ${category}:`, {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        tableName,
        coachId: user.id
      })
      return NextResponse.json({
        error: error.message,
        details: error.details,
        code: error.code
      }, { status: 500 })
    }

    console.log(`✅ COACH/EXERCISES: Query exitosa, ${data?.length || 0} registros encontrados`)

    // Transformar datos al formato esperado por CSVManagerEnhanced
    // Filtrar por activo si se especificó (para ejercicios_detalles, verificar en activity_id)
    let filteredData = data || []

    if (!isNutrition && active === 'true') {
      // Para ejercicios_detalles, verificar si hay alguna actividad donde esté activo
      // En modo genérico, consideramos activo si tiene activity_id no vacío
      filteredData = filteredData.filter((item: any) => {
        const activityId = item.activity_id
        if (!activityId || (typeof activityId === 'object' && Object.keys(activityId).length === 0)) {
          return true
        }
        // Si activity_id es JSONB, verificar que al menos una actividad tenga activo: true
        if (typeof activityId === 'object') {
          return Object.values(activityId).some((val: any) => val?.activo !== false)
        }
        return true
      })
    } else if (!isNutrition && active === 'false') {
      // Para ejercicios inactivos, verificar que todas las actividades tengan activo: false
      filteredData = filteredData.filter((item: any) => {
        const activityId = item.activity_id
        if (!activityId || (typeof activityId === 'object' && Object.keys(activityId).length === 0)) {
          return true // Sin actividad = inactivo
        }
        if (typeof activityId === 'object') {
          return Object.values(activityId).every((val: any) => val?.activo === false)
        }
        return false
      })
    }

    const transformed = filteredData.map((item: any) => {
      if (isNutrition) {
        return {
          id: item.id,
          nombre: item.nombre || item.nombre_plato || '',
          tipo: item.tipo || '',
          calorias: item.calorias || 0,
          proteinas: item.proteinas || 0,
          carbohidratos: item.carbohidratos || 0,
          grasas: item.grasas || 0,
          receta: item.receta || '',
          ingredientes: item.ingredientes || '',
          porciones: item.porciones || '',
          minutos: item.minutos || 0,
          dificultad: item.dificultad || 'Principiante',
          video_url: item.video_url || null,
          is_active: item.is_active !== false,
          activo: item.is_active !== false,
          isExisting: true,
          coach_id: item.coach_id,
          created_at: item.created_at,
          // Para compatibilidad con activity_id
          activity_id: item.activity_id || null,
          activity_id_new: item.activity_id_new || null
        }
      } else {
        // Para ejercicios_detalles, determinar is_active desde activity_id
        const activityId = item.activity_id
        let isActive = true
        if (activityId && typeof activityId === 'object') {
          // Si hay actividades, verificar que al menos una tenga activo: true
          const activities = Object.values(activityId) as any[]
          isActive = activities.length > 0 && activities.some((val: any) => val?.activo !== false)
        } else if (!activityId || (typeof activityId === 'object' && Object.keys(activityId).length === 0)) {
          // Sin actividad asignada = item genérico del catálogo, mostrar como activo
          isActive = true
        }

        return {
          id: item.id,
          nombre_ejercicio: item.nombre_ejercicio || '',
          nombre: item.nombre_ejercicio || '', // Alias para compatibilidad
          tipo: item.tipo || '',
          descripcion: item.descripcion || '',
          intensidad: item.intensidad || '',
          duracion_min: item.duracion_min || 0,
          calorias: item.calorias || 0,
          equipo: item.equipo || '',
          detalle_series: item.detalle_series || '',
          body_parts: item.body_parts || '',
          video_url: item.video_url || null,
          is_active: isActive,
          activo: isActive,
          isExisting: true,
          coach_id: item.coach_id,
          created_at: item.created_at,
          // Para compatibilidad con activity_id - preservar ambos
          activity_id: item.activity_id || null,
          activity_id_new: item.activity_id_new || item.activity_id || null
        }
      }
    })

    console.log(`✅ COACH/EXERCISES: ${transformed.length} ${category} encontrados`)

    return NextResponse.json({
      success: true,
      data: transformed,
      count: transformed.length
    })
  } catch (error: any) {
    console.error('❌ COACH/EXERCISES: Error:', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    let body: any = null
    try {
      body = await request.json()
    } catch {
      body = null
    }

    const idRaw = body?.id
    const id = typeof idRaw === 'number' ? idRaw : Number(idRaw)
    const category = String(body?.category || 'fitness')
    const isNutrition = category === 'nutricion' || category === 'nutrition'
    const tableName = isNutrition ? 'nutrition_program_details' : 'ejercicios_detalles'

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ success: false, error: 'Parámetro id inválido' }, { status: 400 })
    }

    const video_url = typeof body?.video_url === 'string' ? body.video_url : null
    const bunny_video_id = typeof body?.bunny_video_id === 'string' ? body.bunny_video_id : null
    const bunny_library_id =
      body?.bunny_library_id === null || body?.bunny_library_id === undefined
        ? null
        : Number(body.bunny_library_id)
    const video_thumbnail_url = typeof body?.video_thumbnail_url === 'string' ? body.video_thumbnail_url : null
    const video_file_name = typeof body?.video_file_name === 'string' ? body.video_file_name : null

    // Ojo: no todas las tablas tienen las mismas columnas.
    // - nutrition_program_details: (según migrations actuales) tiene video_url, pero no bunny_* ni video_file_name.
    // - ejercicios_detalles: tiene video_url y (según add-bunny-video-support.sql) bunny_* y video_thumbnail_url.
    const basePayload: any = { video_url }
    if (video_file_name && video_file_name.trim() !== '') {
      basePayload.video_file_name = video_file_name.trim().slice(0, 255)
    }

    const fullPayload: any = {
      ...basePayload,
      bunny_video_id,
      bunny_library_id: Number.isFinite(bunny_library_id) ? bunny_library_id : null,
      video_thumbnail_url
    }

    const selectFieldsFull = 'id, video_url, bunny_video_id, bunny_library_id, video_thumbnail_url, video_file_name'
    const selectFieldsBase = 'id, video_url, video_file_name'

    let data: any = null
    let error: any = null

    // 1) Update principal (nutrition_program_details o ejercicios_detalles)
    const primaryAttempt = await supabase
      .from(tableName)
      .update(isNutrition ? fullPayload : fullPayload)
      .eq('id', id)
      .eq('coach_id', user.id)
      .select(isNutrition ? selectFieldsFull : selectFieldsFull)
      .maybeSingle()

    data = primaryAttempt.data
    error = primaryAttempt.error

    // 2) Si es nutrición y la tabla no tiene bunny_* todavía, reintentar con payload reducido
    if (error && isNutrition) {
      const code = (error as any)?.code
      const message = String((error as any)?.message || '')
      const missingColumn = code === '42703' || message.includes('does not exist') || message.includes('column')
      if (missingColumn) {
        const retry = await supabase
          .from(tableName)
          .update(basePayload)
          .eq('id', id)
          .eq('coach_id', user.id)
          .select(selectFieldsBase)
          .maybeSingle()
        data = retry.data
        error = retry.error
      }
    }

    // 3) Best-effort: si es nutrición, espejar update en platos_detalles también
    if (isNutrition) {
      try {
        const mirrorAttempt = await supabase
          .from('platos_detalles')
          .update(fullPayload)
          .eq('id', id)
          .eq('coach_id', user.id)

        if (mirrorAttempt.error) {
          const mirrorCode = (mirrorAttempt.error as any)?.code
          const mirrorMsg = String((mirrorAttempt.error as any)?.message || '')
          const mirrorMissing = mirrorCode === '42703' || mirrorMsg.includes('does not exist') || mirrorMsg.includes('column')
          if (mirrorMissing) {
            await supabase
              .from('platos_detalles')
              .update(basePayload)
              .eq('id', id)
              .eq('coach_id', user.id)
          }
        }
      } catch {
        // ignore
      }
    }

    if (error) {
      console.error('❌ COACH/EXERCISES: PATCH supabase error:', {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
        tableName,
        id,
        coachId: user.id,
        updatePayload: isNutrition ? fullPayload : fullPayload
      })
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('❌ COACH/EXERCISES: PATCH error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Error interno' }, { status: 500 })
  }
}

