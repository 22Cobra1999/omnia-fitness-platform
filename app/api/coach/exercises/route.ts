import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

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

    // Para nutrición: NO filtrar por is_active por defecto para mostrar TODOS los platos
    // Solo filtrar si se especifica explícitamente el parámetro active
    // Para ejercicios_detalles, NO tiene columna is_active directa
    if (isNutrition) {
      // Solo filtrar si se especifica explícitamente
      if (active === 'true') {
        query = query.eq('is_active', true)
      } else if (active === 'false') {
        query = query.eq('is_active', false)
      }
      // Si active no se especifica, NO filtrar - mostrar TODOS los platos del coach
    }
    // Para ejercicios_detalles, el filtrado por activo se hará después al procesar los datos

    // Ordenar por id (más confiable que created_at que puede no existir)
    let { data, error } = await query.order('id', { ascending: false })

    // Si hay error, intentar buscar a través de actividades solo para fitness
    // Para nutrición, si hay error o no hay datos, simplemente retornar vacío
    if (error) {
      console.warn(`⚠️ COACH/EXERCISES: Error buscando por coach_id:`, error.message)
      // Para nutrición, si hay error, no intentar buscar por actividades
      // ya que el error puede ser de permisos o estructura de la tabla
      if (isNutrition) {
        console.log(`ℹ️ COACH/EXERCISES: Error en consulta de nutrición, retornando resultado vacío`)
        data = []
        error = null
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
          return false
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
          // Sin actividad asignada = inactivo
          isActive = false
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

    // Ojo: no todas las tablas tienen las mismas columnas.
    // - nutrition_program_details: (según migrations actuales) tiene video_url, pero no bunny_* ni video_file_name.
    // - ejercicios_detalles: tiene video_url y (según add-bunny-video-support.sql) bunny_* y video_thumbnail_url.
    const updatePayload: any = { video_url }
    if (!isNutrition) {
      updatePayload.bunny_video_id = bunny_video_id
      updatePayload.bunny_library_id = Number.isFinite(bunny_library_id) ? bunny_library_id : null
      updatePayload.video_thumbnail_url = video_thumbnail_url
    }

    const selectFields = isNutrition
      ? 'id, video_url'
      : 'id, video_url, bunny_video_id, bunny_library_id, video_thumbnail_url'

    const { data, error } = await supabase
      .from(tableName)
      .update(updatePayload)
      .eq('id', id)
      .eq('coach_id', user.id)
      .select(selectFields)
      .maybeSingle()

    if (error) {
      console.error('❌ COACH/EXERCISES: PATCH supabase error:', {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
        tableName,
        id,
        coachId: user.id,
        updatePayload
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

