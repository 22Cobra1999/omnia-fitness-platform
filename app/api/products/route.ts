import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { saveWeeklySchedule, saveProductPeriods } from './handlers/program.handler'
import { handleWorkshopCreation, handleWorkshopUpdate } from './handlers/workshop.handler'
import { handleDocumentCreation, handleDocumentUpdate } from './handlers/document.handler'

const calculateStatsFromSchedule = (weeklySchedule: any, periods: number) => {
  const defaultStats = {
    items_totales: 0,
    items_unicos: 0,
    sesiones_dias_totales: 0,
    semanas_totales: 0
  };

  try {
    let schedule = weeklySchedule;
    if (typeof schedule === 'string' && schedule.trim() !== '') {
      try {
        schedule = JSON.parse(schedule);
      } catch (e) {
        return defaultStats;
      }
    }

    if (!schedule || typeof schedule !== 'object') {
      return defaultStats;
    }

    // Convertir a array de semanas si es un objeto { "1": ..., "2": ... }
    const weeks = Array.isArray(schedule) ? schedule : Object.values(schedule);
    const rawWeeks = weeks.length;

    if (rawWeeks === 0) {
      return defaultStats;
    }

    const uniqueItems = new Set();
    let itemsTotales = 0;
    let sesionesTotales = 0;

    weeks.forEach((week: any) => {
      if (!week || typeof week !== 'object') return;

      Object.entries(week).forEach(([dayKey, dayData]: [string, any]) => {
        const isDayKey = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo', '1', '2', '3', '4', '5', '6', '7'].includes(dayKey.toLowerCase());
        if (!isDayKey) return;

        let data = dayData;
        if (typeof data === 'string' && data.trim() !== '') {
          try { data = JSON.parse(data); } catch (e) { }
        }

        if (!data) return;

        let ejercicios: any[] = [];
        if (Array.isArray(data)) {
          ejercicios = data;
        } else if (data && typeof data === 'object') {
          ejercicios = data.ejercicios || data.exercises || [];
        }

        if (Array.isArray(ejercicios) && ejercicios.length > 0) {
          const activeExercises = ejercicios.filter((ex: any) =>
            ex && typeof ex === 'object' && ex.activo !== false && ex.is_active !== false
          );

          if (activeExercises.length > 0) {
            sesionesTotales++;
            activeExercises.forEach((ex: any) => {
              const id = ex.id || ex.ejercicio_id || ex.id_ejercicio || ex.exercise_id;
              if (id) {
                uniqueItems.add(String(id));
                itemsTotales++;
              }
            });
          }
        }
      });
    });

    const periodos = Number(periods) || 1;
    return {
      items_totales: itemsTotales * periodos,
      items_unicos: uniqueItems.size,
      sesiones_dias_totales: sesionesTotales * periodos,
      semanas_totales: rawWeeks * periodos
    };
  } catch (e) {
    return defaultStats;
  }
}

const calculateWorkshopStats = (workshopSchedule: any[]) => {
  if (!Array.isArray(workshopSchedule) || workshopSchedule.length === 0) {
    return {
      items_totales: 0,
      items_unicos: 0,
      sesiones_dias_totales: 0,
      semanas_totales: 0
    }
  }

  const uniqueDays = new Set(workshopSchedule.map(s => s.date)).size
  const uniqueThemes = new Set(workshopSchedule.map(s => s.title).filter(Boolean)).size

  const sortedDates = [...workshopSchedule]
    .map(s => new Date(s.date))
    .sort((a, b) => a.getTime() - b.getTime())

  let weeks = 0
  if (sortedDates.length > 0) {
    const firstDate = sortedDates[0]
    const lastDate = sortedDates[sortedDates.length - 1]
    const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    weeks = Math.max(1, Math.ceil((diffDays + 1) / 7))
  }

  return {
    items_totales: workshopSchedule.length,
    items_unicos: uniqueThemes,
    sesiones_dias_totales: uniqueDays,
    semanas_totales: weeks
  }
}

const splitSemicolonList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((v) => String(v ?? '').trim()).filter((v) => v.length > 0)))
  }
  if (typeof value === 'string') {
    return Array.from(new Set(value.split(';').map((v) => v.trim()).filter((v) => v.length > 0)))
  }
  return []
}

const joinSemicolonList = (value: unknown): string => {
  return splitSemicolonList(value).join(';')
}

async function checkAndPauseProductsIfNeeded(coachId: string) {
  try {
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: plan } = await supabaseService
      .from('planes_uso_coach')
      .select('plan_type')
      .eq('coach_id', coachId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { getPlanLimit } = await import('@/lib/utils/plan-limits')
    const planType = (plan?.plan_type || 'free') as 'free' | 'basico' | 'black' | 'premium'
    const limit = getPlanLimit(planType, 'activeProducts')

    let query = supabaseService
      .from('activities')
      .select('id, created_at')
      .eq('coach_id', coachId)
      .neq('type', 'consultation')
      .order('created_at', { ascending: true })

    const { data: activeProducts, error: countError } = await query.eq('is_paused', false)

    if (countError) {
      if (countError.code === '42703' || countError.message.includes('is_paused')) {
        const { data: retryProducts, error: retryError } = await supabaseService
          .from('activities')
          .select('id, created_at')
          .eq('coach_id', coachId)
          .neq('type', 'consultation')
          .order('created_at', { ascending: true })

        if (!retryError) {
          handlePausadoLogic(retryProducts, limit, planType, coachId, supabaseService)
        }
      }
      return
    }

    handlePausadoLogic(activeProducts, limit, planType, coachId, supabaseService)
  } catch (error) {
    console.error('Error en checkAndPauseProductsIfNeeded:', error)
  }
}

async function handlePausadoLogic(activeProducts: any[] | null, limit: number, planType: string, coachId: string, supabaseService: any) {
  const activeCount = activeProducts?.length || 0
  if (activeCount > limit) {
    const productsToPause = activeProducts!.slice(limit)
    const productIds = productsToPause.map(p => p.id)

    if (productIds.length > 0) {
      await supabaseService
        .from('activities')
        .update({ is_paused: true, updated_at: new Date().toISOString() })
        .in('id', productIds)
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    let user = null as any
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (!authError && userData?.user) {
      user = userData.user
    } else {
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData?.session?.user) {
        user = sessionData.session.user
      }
    }
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: products, error: productsError } = await supabase
      .from('activities')
      .select('*')
      .eq('coach_id', user.id)
      .neq('type', 'consultation')
      .neq('borrada', true)
      .order('created_at', { ascending: false })

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }

    const { data: allMedia } = await supabase
      .from('activity_media')
      .select('*')
      .in('activity_id', products.map(p => p.id))

    const { data: allPeriodos } = await supabase
      .from('activity_periodos')
      .select('*')
      .in('actividad_id', products.map(p => p.id))

    const { data: allPlanificaciones } = await supabase
      .from('planificacion_ejercicios')
      .select('*')
      .in('actividad_id', products.map(p => p.id))

    const { data: allSales } = await supabase
      .from('enrollments')
      .select('activity_id')
      .in('activity_id', products.map(p => p.id))

    const { data: allWorkshopDetails } = await supabase
      .from('taller_detalles')
      .select('*')
      .in('actividad_id', products.map(p => p.id))

    const productsWithMedia = await Promise.all(
      products.map(async (product) => {
        const media = allMedia?.find(m => m.activity_id === product.id)
        const periodos = allPeriodos?.find(p => p.actividad_id === product.id)
        const planificacion = allPlanificaciones?.filter(p => p.actividad_id === product.id)
        const salesCount = allSales?.filter(s => s.activity_id === product.id).length
        const workshopDetails = allWorkshopDetails?.filter(w => w.actividad_id === product.id)

        let exercisesCount = 0
        let totalSessions = 0
        let cantidadTemas = 0
        let cantidadDias = 0

        if (product.type === 'workshop') {
          cantidadTemas = workshopDetails?.length || 0
          const allDates: string[] = []
          workshopDetails?.forEach((tema: any) => {
            try {
              let originales = tema.originales
              if (typeof originales === 'string') { originales = JSON.parse(originales) }
              if (originales?.fechas_horarios && Array.isArray(originales.fechas_horarios)) {
                originales.fechas_horarios.forEach((fecha: any) => { if (fecha?.fecha) allDates.push(fecha.fecha) })
              }
            } catch (e) { }
          })
          const uniqueDaysCount = new Set(allDates).size
          if (allDates.length > 0) {
            const fechas = allDates.map(f => new Date(f)).filter(f => !isNaN(f.getTime())).sort((a,b) => a.getTime() - b.getTime())
            if (fechas.length > 0) {
              const diffTime = Math.abs(fechas[fechas.length-1].getTime() - fechas[0].getTime())
              cantidadDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
              product.semanas_totales = Math.max(1, Math.ceil(cantidadDias / 7))
            }
          }
          exercisesCount = cantidadTemas
          totalSessions = uniqueDaysCount
        } else {
          const uniqueItemsInPlan = new Set()
          let totalSessionsCalculated = 0
          planificacion?.forEach((semana: any) => {
            ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].forEach(dia => {
              let dayData = semana[dia]
              if (typeof dayData === 'string') { try { dayData = JSON.parse(dayData) } catch(e) {} }
              if (dayData?.ejercicios && Array.isArray(dayData.ejercicios) && dayData.ejercicios.length > 0) {
                totalSessionsCalculated++
                dayData.ejercicios.forEach((ex: any) => { if (ex.id) uniqueItemsInPlan.add(ex.id) })
              }
            })
          })
          exercisesCount = uniqueItemsInPlan.size
          totalSessions = totalSessionsCalculated * (periodos?.cantidad_periodos || 1)
        }

        let objetivos = []
        if (product.workshop_type) {
          try {
            let parsed = typeof product.workshop_type === 'string' ? JSON.parse(product.workshop_type) : product.workshop_type
            if (parsed?.objetivos) {
              objetivos = String(parsed.objetivos).split(';').map(o => o.trim()).filter(Boolean)
            } else if (Array.isArray(parsed)) {
              objetivos = parsed
            }
          } catch (e) { }
        }

        return {
          ...product,
          title: product.title || product.name || 'Sin título',
          name: product.title || product.name || 'Sin título',
          description: product.description || 'Sin descripción',
          media: media,
          image_url: media?.image_url || null,
          video_url: media?.video_url || null,
          activity_media: media ? [media] : [],
          objetivos: objetivos,
          restricciones: splitSemicolonList(product.restricciones),
          exercisesCount: product.items_unicos || exercisesCount,
          totalSessions: product.sesiones_dias_totales || totalSessions,
          cantidadTemas,
          cantidadDias,
          sales: salesCount || 0
        }
      })
    )

    return NextResponse.json({ success: true, products: productsWithMedia })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const supabaseService = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: plan } = await supabaseService.from('planes_uso_coach').select('plan_type').eq('coach_id', user.id).eq('status', 'active').maybeSingle()
    const planType = plan?.plan_type || 'free'
    const { getPlanLimit } = await import('@/lib/utils/plan-limits')
    const stockLimit = getPlanLimit(planType, 'stockPerProduct')
    const totalClientsLimit = getPlanLimit(planType, 'totalClients')

    const { data: existingActivities } = await supabaseService.from('activities').select('capacity').eq('coach_id', user.id)
    const normalizeCapacity = (v: any) => {
      if (v === null || v === undefined) return 0
      const p = parseFloat(v); return isNaN(p) ? 0 : p
    }

    let targetCapacity = normalizeCapacity(body.capacity)
    const originalRequestCapacity = targetCapacity
    if (targetCapacity > 0) {
        if (targetCapacity > stockLimit) targetCapacity = stockLimit
        const used = (existingActivities || []).reduce((sum, a) => sum + normalizeCapacity(a.capacity), 0)
        const remaining = Math.max(totalClientsLimit - used, 0)
        if (targetCapacity > remaining) targetCapacity = remaining
    }
    const adjustedCapacity = targetCapacity > 0 ? Math.floor(targetCapacity) : null

    console.log(`📡 [POST /api/products] Capacity Logic: Request=${originalRequestCapacity}, Limit=${stockLimit}, Remaining=${totalClientsLimit - ((existingActivities || []).reduce((sum, a) => sum + normalizeCapacity(a.capacity), 0))}, Final=${adjustedCapacity}`)

    const calculated = body.modality === 'workshop' && body.workshopSchedule
      ? calculateWorkshopStats(body.workshopSchedule)
      : calculateStatsFromSchedule(body.weeklySchedule, body.periods || 1)

    const { data: newActivity, error: insertError } = await supabaseService
      .from('activities')
      .insert([{
        title: body.name,
        description: body.description,
        price: body.price,
        type: body.modality === 'workshop' ? 'workshop' : (body.modality === 'document' ? 'document' : 'program'),
        modality: body.type || 'online',
        categoria: body.categoria || 'fitness',
        difficulty: body.level,
        is_public: body.is_public,
        capacity: adjustedCapacity,
        restricciones: joinSemicolonList(body.restricciones),
        coach_id: user.id,
        workshop_type: splitSemicolonList(body.objetivos).length > 0 ? JSON.stringify({ objetivos: joinSemicolonList(body.objetivos) }) : null,
        location_name: body.location_name || null,
        location_url: body.location_url || null,
        dias_acceso: body.dias_acceso || 30,
        workshop_mode: body.workshop_mode || 'grupal',
        participants_per_class: body.participants_per_class || null,
        semanas_totales: body.semanas_totales || calculated.semanas_totales || 0,
        sesiones_dias_totales: body.sesiones_dias_totales || calculated.sesiones_dias_totales || 0,
        items_totales: body.items_totales || calculated.items_totales || 0,
        items_unicos: body.items_unicos || calculated.items_unicos || 0,
        periodos_configurados: body.periods || 1
      }])
      .select().single()

    console.log(`✅ [POST /api/products] PRODUCT CREATED: ID=${newActivity.id}, Capacity=${newActivity.capacity}`)

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    const tasks = []
    if (body.image_url || body.video_url) {
      tasks.push(supabase.from('activity_media').insert({
        activity_id: newActivity.id,
        image_url: body.image_url || null,
        video_url: body.video_url || null,
        bunny_video_id: body.bunny_video_id || null,
        bunny_library_id: body.bunny_library_id || null,
        video_thumbnail_url: body.video_thumbnail_url || null,
        video_file_name: body.video_file_name || null,
      }))
    }
    if (body.modality === 'workshop') tasks.push(handleWorkshopCreation(supabaseService, newActivity.id, body, user.id))
    if (body.modality === 'document') tasks.push(handleDocumentCreation(supabaseService, newActivity.id, body))
    if (body.modality !== 'workshop' && body.modality !== 'document') {
      if (body.weeklySchedule) tasks.push(saveWeeklySchedule(supabaseService, newActivity.id, body.weeklySchedule, body.categoria))
      if (body.periods) tasks.push(saveProductPeriods(supabaseService, newActivity.id, body.periods))
    }

    await Promise.all(tasks)
    checkAndPauseProductsIfNeeded(user.id).catch(() => {})
    return NextResponse.json({ success: true, productId: newActivity.id, product: newActivity })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    if (!body.editingProductId) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const supabaseService = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: plan } = await supabaseService.from('planes_uso_coach').select('plan_type').eq('coach_id', user.id).eq('status', 'active').maybeSingle()
    const planType = plan?.plan_type || 'free'
    const { getPlanLimit } = await import('@/lib/utils/plan-limits')
    const stockLimit = getPlanLimit(planType, 'stockPerProduct')
    const totalClientsLimit = getPlanLimit(planType, 'totalClients')

    const { data: existingActivities } = await supabaseService.from('activities').select('id, capacity').eq('coach_id', user.id)
    const normalizeCapacity = (v: any) => {
      if (v === null || v === undefined) return 0
      const p = parseFloat(v); return isNaN(p) ? 0 : p
    }

    const currentCap = normalizeCapacity(existingActivities?.find(a => a.id === body.editingProductId)?.capacity)
    const otherUsed = (existingActivities || []).filter(a => a.id !== body.editingProductId).reduce((sum, a) => sum + normalizeCapacity(a.capacity), 0)

    let targetCapacity = normalizeCapacity(body.capacity)
    const originalRequestCapacity = targetCapacity
    if (targetCapacity > 0) {
        if (targetCapacity > stockLimit) targetCapacity = stockLimit
        const available = totalClientsLimit - otherUsed
        if (targetCapacity > available) targetCapacity = Math.max(available, currentCap)
    }
    const adjustedCapacity = targetCapacity > 0 ? Math.floor(targetCapacity) : null

    console.log(`📡 [PUT /api/products] Capacity Logic: Request=${originalRequestCapacity}, Limit=${stockLimit}, Available=${totalClientsLimit - otherUsed}, Final=${adjustedCapacity}`)

    const calculated = body.modality === 'workshop' && body.workshopSchedule
      ? calculateWorkshopStats(body.workshopSchedule)
      : calculateStatsFromSchedule(body.weeklySchedule, body.periods || 1)

    const updateData: any = {
      title: body.name,
      description: body.description,
      price: body.price,
      type: body.modality === 'workshop' ? 'workshop' : (body.modality === 'document' ? 'document' : 'program'),
      modality: body.type || 'online',
      categoria: body.categoria || 'fitness',
      difficulty: body.level,
      is_public: body.is_public,
      capacity: adjustedCapacity,
      restricciones: joinSemicolonList(body.restricciones),
      workshop_type: splitSemicolonList(body.objetivos).length > 0 ? JSON.stringify({ objetivos: joinSemicolonList(body.objetivos) }) : null,
      location_name: body.location_name || null,
      location_url: body.location_url || null,
      dias_acceso: body.dias_acceso || 30,
      workshop_mode: body.workshop_mode || 'grupal',
      participants_per_class: body.participants_per_class || null,
      semanas_totales: body.semanas_totales || calculated.semanas_totales || 0,
      sesiones_dias_totales: body.sesiones_dias_totales || calculated.sesiones_dias_totales || 0,
      items_totales: body.items_totales || calculated.items_totales || 0,
      items_unicos: body.items_unicos || calculated.items_unicos || 0,
      periodos_configurados: body.periods || 1
    }

    const { data: product, error: updateError } = await supabase
      .from('activities')
      .update(updateData)
      .eq('id', body.editingProductId)
      .eq('coach_id', user.id)
      .select().single()

    console.log(`✅ [PUT /api/products] PRODUCT UPDATED: ID=${product.id}, Capacity=${product.capacity}`)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    const tasks = []
    if (body.image_url || body.video_url) {
      tasks.push((async () => {
        const { data: existing } = await supabase.from('activity_media').select('id').eq('activity_id', body.editingProductId).maybeSingle()
        const mediaData = { 
            image_url: body.image_url || null, 
            video_url: body.video_url || null,
            bunny_video_id: body.bunny_video_id || null,
            bunny_library_id: body.bunny_library_id || null,
            video_thumbnail_url: body.video_thumbnail_url || null,
            video_file_name: body.video_file_name || null
        }
        return existing
          ? supabase.from('activity_media').update(mediaData).eq('activity_id', body.editingProductId)
          : supabase.from('activity_media').insert({ activity_id: body.editingProductId, ...mediaData })
      })())
    }
    if (body.modality === 'workshop') tasks.push(handleWorkshopUpdate(supabaseService, body.editingProductId, body, user.id))
    if (body.modality === 'document') tasks.push(handleDocumentUpdate(supabaseService, body.editingProductId, body))
    if (body.modality !== 'workshop' && body.modality !== 'document') {
      if (body.weeklySchedule) tasks.push(saveWeeklySchedule(supabaseService, body.editingProductId, body.weeklySchedule, body.categoria))
      if (body.periods) tasks.push(saveProductPeriods(supabaseService, body.editingProductId, body.periods))
    }

    await Promise.all(tasks)
    checkAndPauseProductsIfNeeded(user.id).catch(() => {})
    return NextResponse.json({ success: true, productId: product.id, product })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
