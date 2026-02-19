import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { createClient } from '@supabase/supabase-js'

type IncomingExercise = {
  id?: number | string
  tempId?: string
  isExisting?: boolean
  is_active?: boolean
  nombre?: string
  descripcion?: string
  tipo_ejercicio?: string
  equipo_necesario?: string
  detalle_series?: string
  body_parts?: string
  calorias?: string | number
  duracion_min?: string | number | null
  intensidad?: string | null
  video_url?: string | null
}

type BulkRequest = {
  activityId?: number | string
  exercises?: IncomingExercise[]
  plates?: IncomingExercise[]
}

const NORMALIZE_NUMBER = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
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

const normalizeTipo = (value: string | undefined) => {
  const allowedTipos = new Set([
    'fuerza',
    'cardio',
    'hiit',
    'movilidad',
    'flexibilidad',
    'equilibrio',
    'funcional',
    'otro'
  ])

  const base = sanitizeText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (!base) return 'fuerza'
  if (allowedTipos.has(base)) return base

  if (base.includes('strength') || base.includes('fuerz')) return 'fuerza'
  if (base.includes('cardio') || base.includes('resist')) return 'cardio'
  if (base.includes('hiit') || base.includes('interval')) return 'hiit'
  if (base.includes('movil') || base.includes('mobility')) return 'movilidad'
  if (base.includes('flex') || base.includes('stretch')) return 'flexibilidad'
  if (base.includes('equilibr') || base.includes('balance')) return 'equilibrio'
  if (base.includes('funcion') || base.includes('functional')) return 'funcional'

  return 'otro'
}

const normalizeIntensity = (value: string | null | undefined) => {
  const allowedMap = new Map<string, string>([
    ['bajo', 'Bajo'],
    ['medio', 'Medio'],
    ['alto', 'Alto'],
    ['principiante', 'Principiante'],
    ['intermedio', 'Intermedio'],
    ['avanzado', 'Avanzado']
  ])

  const base = sanitizeText(value || '').toLowerCase()
  if (allowedMap.has(base)) {
    return allowedMap.get(base)!
  }

  if (base === '' || base === 'moderado' || base === 'moderate') {
    return 'Medio'
  }

  return 'Medio'
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
    const exercisesPayload = body.exercises || body.plates || []

    if (!activityIdRaw || exercisesPayload.length === 0) {
      return NextResponse.json(
        { success: false, error: 'activityId y exercises son requeridos' },
        { status: 400 }
      )
    }

    const activityId = typeof activityIdRaw === 'string' ? parseInt(activityIdRaw, 10) : activityIdRaw
    if (!activityId || Number.isNaN(activityId)) {
      return NextResponse.json(
        { success: false, error: 'activityId inválido' },
        { status: 400 }
      )
    }

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
    }> = []

    for (const exercise of exercisesPayload) {
      const {
        id,
        isExisting,
        is_active = true,
        nombre,
        descripcion,
        tipo_ejercicio,
        equipo_necesario,
        detalle_series,
        body_parts,
        calorias,
        duracion_min,
        intensidad,
        video_url
      } = exercise

      const tempIdValue = (exercise as any).tempId
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
        (exercise as any)['Nombre de la Actividad'] ||
        (exercise as any).title ||
        ''

      const rawTipo =
        tipo_ejercicio ||
        (exercise as any)['Tipo de Ejercicio'] ||
        (exercise as any).tipo ||
        ''

      const rawIntensity =
        intensidad ||
        (exercise as any)['Nivel de Intensidad'] ||
        (exercise as any).nivel_intensidad ||
        null

      const record = {
        nombre_ejercicio: sanitizeText(normalizedName),
        descripcion: sanitizeText(
          descripcion || (exercise as any)['Descripción'] || (exercise as any).Descripción
        ),
        tipo: normalizeTipo(rawTipo || 'fuerza'),
        equipo: sanitizeText(
          equipo_necesario || (exercise as any)['Equipo Necesario'] || (exercise as any).equipo
        ),
        body_parts: sanitizeText(
          body_parts || (exercise as any)['Partes del Cuerpo'] || (exercise as any).partes_cuerpo
        ),
        detalle_series:
          detalle_series ||
          (exercise as any)['Detalle de Series (peso-repeticiones-series)'] ||
          null,
        duracion_min: NORMALIZE_NUMBER(duracion_min ?? (exercise as any)['Duración (min)']),
        calorias: NORMALIZE_NUMBER(calorias),
        intensidad: normalizeIntensity(rawIntensity),
        video_url: sanitizeNullable(video_url ? sanitizeText(video_url) : null),
        video_file_name: sanitizeNullable((exercise as any).video_file_name),
        bunny_video_id: sanitizeNullable((exercise as any).bunny_video_id),
        bunny_library_id: sanitizeNullable((exercise as any).bunny_library_id),
        video_thumbnail_url: sanitizeNullable((exercise as any).video_thumbnail_url),
        coach_id: user.id
      }

      if (isExisting && id) {
        const existingId = typeof id === 'string' ? parseInt(id, 10) : id

        const { data: existingRow, error: fetchError } = await supabaseService
          .from('ejercicios_detalles')
          .select('activity_id')
          .eq('id', existingId)
          .maybeSingle()

        if (fetchError) {
          console.error('❌ BULK EXERCISES: Error obteniendo ejercicio existente:', {
            tempId,
            id,
            error: fetchError.message,
            details: fetchError.details
          })
          failures.push({
            tempId,
            rawId: id,
            nombre: record.nombre_ejercicio,
            motivo: 'fetch-existing-error',
            detalles: fetchError.message
          })
          results.push({ id: null, tempId, error: fetchError.message })
          continue
        }

        const existingMap =
          (existingRow?.activity_id as Record<string, { activo?: boolean }>) || {}
        existingMap[activityId.toString()] = { activo: is_active !== false }

        const { error: updateError } = await supabaseService
          .from('ejercicios_detalles')
          .update({
            ...record,
            activity_id: existingMap
          })
          .eq('id', existingId)

        if (updateError) {
          console.error('❌ BULK EXERCISES: Error actualizando ejercicio existente:', {
            tempId,
            id: existingId,
            error: updateError.message,
            details: updateError.details
          })
          failures.push({
            tempId,
            rawId: existingId,
            nombre: record.nombre_ejercicio,
            motivo: 'update-existing-error',
            detalles: updateError.message
          })
          results.push({ id: null, tempId, error: updateError.message })
          continue
        }

        results.push({ id: existingId, tempId: tempId ?? existingId.toString() })
      } else {
        const activityMap = {
          [activityId.toString()]: { activo: is_active !== false }
        }

        const { data: inserted, error: insertError } = await supabaseService
          .from('ejercicios_detalles')
          .insert({
            ...record,
            activity_id: activityMap
          })
          .select('id')
          .single()

        if (insertError) {
          console.error('❌ BULK EXERCISES: Error insertando ejercicio nuevo:', {
            tempId,
            nombre: record.nombre_ejercicio,
            error: insertError.message,
            details: insertError.details
          })
          failures.push({
            tempId,
            rawId: id,
            nombre: record.nombre_ejercicio,
            motivo: 'insert-error',
            detalles: insertError.message
          })
          results.push({ id: null, tempId, error: insertError.message })
          continue
        }

        results.push({
          id: inserted?.id ?? null,
          tempId
        })
      }
    }

    return NextResponse.json({
      success: true,
      count: results.filter((r) => r.id !== null).length,
      data: results,
      failures
    })
  } catch (error: any) {
    console.error('❌ BULK EXERCISES: Error general:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}

