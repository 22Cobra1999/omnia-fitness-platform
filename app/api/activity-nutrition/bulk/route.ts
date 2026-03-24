import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { createClient } from '@supabase/supabase-js'

type IncomingPlato = {
  id?: number | string
  tempId?: string
  isExisting?: boolean
  is_active?: boolean
  nombre?: string
  descripcion?: string
  tipo?: string
  calorias?: string | number
  proteinas?: string | number
  carbohidratos?: string | number
  grasas?: string | number
  receta?: string
  video_url?: string | null
  video_file_name?: string | null
  bunny_video_id?: string | null
  bunny_library_id?: number | string | null
  video_thumbnail_url?: string | null
  ingredientes?: string | any[] | null
  porciones?: string | number | null
  minutos?: string | number | null
}

type BulkRequest = {
  activityId?: number | string
  plates?: IncomingPlato[]
  exercises?: IncomingPlato[]
}

const NORMALIZE_NUMBER = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  
  // Clean string from units (g, kcal, ml, etc)
  const cleaned = value.toString().replace(/[a-zA-Z\s]/g, '').replace(',', '.')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

const sanitizeText = (value: string | undefined) => {
  if (!value) return ''
  return value.toString().trim()
}

const sanitizeNullable = (value: any) => {
  if (value === undefined || value === null) return null
  if (typeof value === 'string' && value.trim() === '') return null
  return value
}

const coerceTextNullable = (value: any) => {
  if (value === undefined || value === null) return null
  const s = String(value).trim()
  return s.length > 0 ? s : null
}

const normalizeTipo = (value: string | undefined) => {
  const allowedTipos = new Set([
    'desayuno',
    'almuerzo',
    'merienda',
    'cena',
    'colación',
    'pre-entreno',
    'post-entreno',
    'pre entreno',
    'post entreno',
    'snack',
    'bebida',
    'postre',
    'otro'
  ])

  const base = sanitizeText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  if (!base) return 'otro'
  if (allowedTipos.has(base)) {
    // Normalizar variantes
    if (base === 'pre entreno') return 'pre-entreno'
    if (base === 'post entreno') return 'post-entreno'
    return base
  }

  // Detección inteligente
  if (base.includes('breakfast') || base.includes('desayun')) return 'desayuno'
  if (base.includes('lunch') || base.includes('almuerz')) return 'almuerzo'
  if (base.includes('dinner') || base.includes('cen')) return 'cena'
  if (base.includes('meriend') || base.includes('snack')) return 'merienda'
  if (base.includes('colacion') || base.includes('colación')) return 'colación'
  if (base.includes('pre') && (base.includes('entren') || base.includes('workout'))) return 'pre-entreno'
  if (base.includes('post') && (base.includes('entren') || base.includes('workout'))) return 'post-entreno'
  if (base.includes('drink') || base.includes('bebid')) return 'bebida'
  if (base.includes('dessert') || base.includes('postre')) return 'postre'

  return 'otro'
}

export async function POST(request: NextRequest) {
  try {
    const supabaseRouteClient = await createRouteHandlerClient()
    const {
      data: { user },
      error: authError
    } = await supabaseRouteClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const body = (await request.json()) as BulkRequest
    const activityIdRaw = body.activityId
    const platesPayload = body.plates || body.exercises || []

    if (platesPayload.length === 0) {
      return NextResponse.json(
        { success: false, error: 'plates son requeridos' },
        { status: 400 }
      )
    }

    const activityId = activityIdRaw !== undefined && activityIdRaw !== null 
      ? (typeof activityIdRaw === 'string' ? parseInt(activityIdRaw, 10) : activityIdRaw)
      : 0

    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const results: Array<{ id: number | null; tempId?: string; error?: string }> = []
    const failures: Array<{
      tempId?: string
      rawId?: string | number
      nombre?: string
      motivo: string
      detalles?: string
      record?: any
    }> = []

    console.log(`📥 [API/Nutrition] Processing ${platesPayload.length} plates. ActivityId: ${activityId}`)
    if (platesPayload.length > 0) {
      console.log(`📦 [API/Nutrition] First item preview:`, {
        keys: Object.keys(platesPayload[0]),
        nombre: platesPayload[0].nombre,
        tipo: platesPayload[0].tipo,
        hasIngredientes: !!platesPayload[0].ingredientes
      })
    }

    for (const plato of platesPayload) {
      console.log('🔍 BULK NUTRITION: Procesando plato:', {
        id: plato.id,
        tempId: (plato as any).tempId,
        nombre: plato.nombre,
        isExisting: (plato as any).isExisting,
        hasNombre: !!plato.nombre,
        nombreValue: plato.nombre
      })
      const {
        id,
        isExisting,
        is_active = true,
        nombre,
        descripcion,
        tipo,
        calorias,
        proteinas,
        carbohidratos,
        grasas,
        receta,
        video_url,
        video_file_name,
        bunny_video_id,
        bunny_library_id,
        video_thumbnail_url,
        ingredientes,
        porciones,
        minutos
      } = plato

      console.log(`🥘 [API/Nutrition] Processing plate: "${nombre}"`)

      const tempIdValue = (plato as any).tempId
      const tempId =
        typeof tempIdValue === 'string'
          ? tempIdValue
          : tempIdValue !== undefined && tempIdValue !== null
            ? String(tempIdValue)
            : typeof id === 'string'
              ? id
              : typeof id === 'number'
                ? String(id)
                : undefined

      const normalizedName =
        nombre ||
        (plato as any).Nombre ||
        (plato as any)['Nombre del Plato'] ||
        (plato as any)['Nombre de la Actividad'] ||
        (plato as any).title ||
        (plato as any).nombre_plato ||
        ''

      const rawTipo =
        tipo ||
        (plato as any)['Tipo'] ||
        (plato as any).tipo_plato ||
        ''

      // ✅ Validar que el nombre no esté vacío
      const sanitizedName = sanitizeText(normalizedName)
      if (!sanitizedName || sanitizedName.trim() === '') {
        console.error('❌ BULK NUTRITION: Nombre vacío para plato:', { tempId, plato })
        failures.push({
          tempId,
          rawId: id,
          nombre: 'Sin nombre',
          motivo: 'validation-error',
          detalles: 'El nombre del plato no puede estar vacío'
        })
        results.push({ id: null, tempId, error: 'Nombre vacío' })
        continue
      }

      // Crear el mapa de actividad en formato JSONB para activity_id_new
      const activityMap = {
        [activityId.toString()]: { activo: is_active !== false }
      }

      // ✅ Preparar record según estructura real de la tabla (sin descripcion)
      // Campos disponibles: nombre, tipo, calorias, proteinas, carbohidratos, grasas, receta, video_url, 
      // ingredientes (jsonb), porciones, minutos, dificultad, coach_id, activity_id, activity_id_new (jsonb)
      const rawDificultad = (plato as any).dificultad || (plato as any)['Dificultad'] || 'Principiante'
      // Validar que la dificultad sea un valor permitido
      const dificultadesValidas = ['Bajo', 'Medio', 'Alto', 'Principiante', 'Intermedio', 'Avanzado']
      const dificultad = dificultadesValidas.includes(rawDificultad) ? rawDificultad : 'Principiante'

      const recetaText = coerceTextNullable(receta || (plato as any)['Receta'] || (plato as any)['Descripción'] || (plato as any).Descripción)
      let receta_id: number | null = null

      if (recetaText) {
        const { data: recetaInserted, error: recetaError } = await supabaseService
          .from('recetas')
          .insert({ receta: recetaText })
          .select('id')
          .single()

        if (recetaError) {
          console.error('❌ BULK NUTRITION: Error insertando receta:', {
            tempId,
            nombre: sanitizedName,
            error: recetaError.message,
            code: recetaError.code,
            details: recetaError.details
          })
          failures.push({
            tempId,
            rawId: id,
            nombre: sanitizedName,
            motivo: 'insert-recipe-error',
            detalles: recetaError.message
          })
          results.push({ id: null, tempId, error: recetaError.message })
          continue
        }

        receta_id = recetaInserted?.id ?? null
      }

      const caloriasVal = calorias || (plato as any)['Calorías'] || (plato as any).calorias
      const proteinasVal = proteinas || (plato as any)['Proteínas (g)'] || (plato as any)['Proteínas'] || (plato as any).proteinas || (plato as any).protein
      const carbohidratosVal = carbohidratos || (plato as any)['Carbohidratos (g)'] || (plato as any)['Carbohidratos'] || (plato as any).carbohidratos || (plato as any).carbs
      const grasasVal = grasas || (plato as any)['Grasas (g)'] || (plato as any)['Grasas'] || (plato as any).grasas || (plato as any).fats
      const ingredientesVal = ingredientes || (plato as any)['Ingredientes'] || (plato as any).ingredientes
      const porcionesVal = (plato as any).porciones !== undefined ? (plato as any).porciones : (plato as any)['Porciones']
      const minutosVal = (plato as any).minutos !== undefined ? (plato as any).minutos : (plato as any)['Minutos']

      const record: any = {
        nombre: sanitizedName,
        calorias: NORMALIZE_NUMBER(caloriasVal),
        proteinas: NORMALIZE_NUMBER(proteinasVal),
        carbohidratos: NORMALIZE_NUMBER(carbohidratosVal),
        grasas: NORMALIZE_NUMBER(grasasVal),
        dificultad: dificultad,
        video_url: sanitizeNullable(video_url ? sanitizeText(video_url) : null),
        video_file_name: coerceTextNullable(video_file_name),
        bunny_video_id: sanitizeNullable(bunny_video_id || (plato as any).bunny_video_id),
        bunny_library_id: NORMALIZE_NUMBER(bunny_library_id || (plato as any).bunny_library_id),
        video_thumbnail_url: sanitizeNullable(video_thumbnail_url || (plato as any).video_thumbnail_url),
        coach_id: user.id,
        activity_id: activityId > 0 ? activityId : null
      }

      if (receta_id) {
        record.receta_id = receta_id
      }

      // Agregar campos opcionales si existen
      if (ingredientesVal !== undefined && ingredientesVal !== null) {
        // Si ingredientes es un string, intentar parsearlo como JSON si parece JSON
        if (typeof ingredientesVal === 'string') {
          const trimmed = ingredientesVal.trim()
          if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
            try {
              record.ingredientes = JSON.parse(trimmed)
            } catch {
              record.ingredientes = [trimmed]
            }
          } else {
            // Es una lista separada por comas o punto y coma
            const list = trimmed.split(/[;,\n]/).map(i => i.trim()).filter(Boolean)
            record.ingredientes = list.length > 0 ? list : [trimmed]
          }
        } else {
          record.ingredientes = ingredientesVal
        }
      }

      if (porcionesVal !== undefined && porcionesVal !== null) {
        const porcionesNum = NORMALIZE_NUMBER(porcionesVal)
        if (porcionesNum !== null) record.porciones = Math.floor(porcionesNum)
      }

      if (minutosVal !== undefined && minutosVal !== null) {
        const minutosNum = NORMALIZE_NUMBER(minutosVal)
        if (minutosNum !== null) record.minutos = Math.floor(minutosNum)
      }

      // ✅ Intentar agregar activity_id_new solo si existe la columna (opcional)
      // Si falla la inserción, se intentará sin activity_id_new
      try {
        record.activity_id_new = activityMap
      } catch (e) {
        // Ignorar si no se puede agregar
      }

      console.log('📝 BULK NUTRITION: Record preparado para inserción:', {
        nombre: record.nombre,
        activity_id: record.activity_id,
        hasActivityIdNew: !!record.activity_id_new,
        coach_id: record.coach_id
      })

      if (isExisting && id) {
        const existingId = typeof id === 'string' ? parseInt(id, 10) : id

        const { data: existingRow, error: fetchError } = await supabaseService
          .from('nutrition_program_details')
          .select('activity_id, activity_id_new') // ✅ Obtener ambas columnas
          .eq('id', existingId)
          .maybeSingle()

        if (fetchError) {
          console.error('❌ BULK NUTRITION: Error obteniendo plato existente:', {
            tempId,
            id,
            error: fetchError.message,
            details: fetchError.details
          })
          failures.push({
            tempId,
            rawId: id,
            nombre: record.nombre,
            motivo: 'fetch-existing-error',
            detalles: fetchError.message
          })
          results.push({ id: null, tempId, error: fetchError.message })
          continue
        }

        if (!existingRow) {
          failures.push({
            tempId,
            rawId: existingId,
            nombre: record.nombre,
            motivo: 'not-found',
            detalles: 'Plato no encontrado'
          })
          results.push({ id: null, tempId, error: 'Plato no encontrado' })
          continue
        }

        // Actualizar el mapa de actividades: agregar o actualizar la actividad actual
        // ✅ Manejar tanto activity_id (integer) como activity_id_new (JSONB)
        const existingActivityIdNew = (existingRow as any).activity_id_new
        const existingMap = existingActivityIdNew
          ? (existingActivityIdNew as Record<string, { activo?: boolean }>)
          : {}

        // Agregar/actualizar la actividad actual en el mapa JSONB
        existingMap[activityId.toString()] = { activo: is_active !== false }

        const updateData: any = {
          ...record,
          activity_id: activityId > 0 ? activityId : null,
          activity_id_new: existingMap,
          // Preservar día y semana si ya existen y el record los tiene a 0
          "día": (record.día === 0 && (existingRow as any).día !== undefined) ? (existingRow as any).día : record.día,
          "semana": (record.semana === 0 && (existingRow as any).semana !== undefined) ? (existingRow as any).semana : record.semana
        }

        console.log('🔄 BULK NUTRITION: Actualizando plato existente:', {
          id: existingId,
          nombre: record.nombre,
          activity_id: updateData.activity_id,
          activity_id_new: updateData.activity_id_new
        })

        let { error: updateError } = await supabaseService
          .from('nutrition_program_details')
          .update(updateData)
          .eq('id', existingId)

        if (updateError) {
          const errorDetails = {
            tempId,
            id: existingId,
            error: updateError.message,
            details: updateError.details,
            code: updateError.code,
            hint: updateError.hint
          }
          console.error('❌ BULK NUTRITION: Error actualizando plato existente:', errorDetails)

          const errorMessage = updateError.hint
            ? `${updateError.message} (${updateError.hint})`
            : updateError.message

          failures.push({
            tempId,
            rawId: existingId,
            nombre: record.nombre,
            motivo: 'update-existing-error',
            detalles: errorMessage
          })
          results.push({ id: null, tempId, error: errorMessage })
          continue
        }

        results.push({ id: existingId, tempId: tempId ?? existingId.toString() })
      } else {
        console.log('➕ BULK NUTRITION: Insertando plato nuevo:', {
          nombre: record.nombre,
          activity_id: record.activity_id,
          hasActivityIdNew: !!record.activity_id_new,
          coach_id: record.coach_id
        })

        // 🔄 INSERT Masivo
        let { data: inserted, error: insertError } = await supabaseService
          .from('nutrition_program_details')
          .insert(record)
          .select('id')
          .single()

        if (insertError) {
          const errorDetails = {
            tempId,
            nombre: record.nombre,
            error: insertError.message,
            details: insertError.details,
            code: insertError.code,
            hint: insertError.hint,
            record: JSON.stringify(record, null, 2)
          }
          console.error('❌ BULK NUTRITION: Error insertando plato nuevo:', errorDetails)

          // Incluir más detalles en el error para debugging
          const errorMessage = insertError.hint
            ? `${insertError.message} (${insertError.hint})`
            : insertError.message

          failures.push({
            tempId,
            rawId: id,
            nombre: record.nombre,
            motivo: 'insert-error',
            detalles: errorMessage,
            record // Incluir para depuración profunda
          })
          results.push({ id: null, tempId, error: errorMessage })
          continue
        }

        console.log('✅ BULK NUTRITION: Plato insertado exitosamente:', {
          id: inserted?.id,
          tempId,
          nombre: record.nombre
        })

        results.push({
          id: inserted?.id ?? null,
          tempId
        })
      }
    }

    const successCount = results.filter((r) => r.id !== null).length
    const failureCount = failures.length

    console.log('📊 BULK NUTRITION: Resumen de operación:', {
      total: platesPayload.length,
      exitosos: successCount,
      fallidos: failureCount,
      results: results.map(r => ({ id: r.id, tempId: r.tempId, error: r.error })),
      failures: failures.map(f => ({ tempId: f.tempId, motivo: f.motivo, detalles: f.detalles }))
    })

    return NextResponse.json({
      success: true,
      count: successCount,
      data: results,
      failures
    })
  } catch (error: any) {
    console.error('❌ BULK NUTRITION: Error general:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}

