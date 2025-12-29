import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

// Hacer la ruta dinámica para evitar evaluación durante el build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteHandlerClient()
    let user = null as any
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (!userError && userData?.user) {
      user = userData.user
    } else {
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData?.session?.user) {
        user = sessionData.session.user
      }
    }
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const { id: clientId } = await params
    

    // 1. PERFIL DEL CLIENTE
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, avatar_url, created_at')
      .eq('id', clientId)
      .single()

    // 1.1. DATOS FÍSICOS DEL CLIENTE
    const { data: clientData, error: clientDataError } = await supabase
      .from('clients')
      .select('id, Height, weight, birth_date, fitness_goals, health_conditions, Genre, description, full_name, nivel_actividad, phone, location, emergency_contact')
      .eq('id', clientId)
      .single()

    // 2. LESIONES DEL CLIENTE
    const { data: injuries, error: injuriesError } = await supabase
      .from('user_injuries')
      .select('id, name, description, severity, restrictions, created_at, updated_at')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })

    if (injuriesError) {
      console.error('[client-details] Error obteniendo lesiones:', injuriesError)
    }
    if (injuries && injuries.length > 0) {
    }

    // 3. BIOMÉTRICAS DEL CLIENTE
    const { data: biometrics, error: biometricsError } = await supabase
      .from('user_biometrics')
      .select('id, name, value, unit, notes, created_at, updated_at')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })

    // 4. OBJETIVOS DE EJERCICIO DEL CLIENTE
    const { data: objectives, error: objectivesError } = await supabase
      .from('user_exercise_objectives')
      .select('id, exercise_title, unit, current_value, objective, created_at, updated_at')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })

    // 5. ACTIVIDADES DEL CLIENTE
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('activity_enrollments')
      .select(`
        id,
        status,
        todo_list,
        activity_id,
        start_date,
        created_at
      `)
      .eq('client_id', clientId)
      // Incluir estados válidos en ES/EN para que aparezcan también compras de nutrición
      .in('status', ['activa', 'active', 'pendiente', 'pending'])

    // Calcular progreso de objetivos
    const objectivesWithProgress = objectives?.map((obj: any) => ({
      ...obj,
      progress_percentage: obj.objective > 0 ? Math.round((obj.current_value / obj.objective) * 100) : 0
    })) || []

    // Obtener detalles de las actividades (solo las del coach autenticado)
    let activitiesDetails: any[] = []
    let coachActivityIds: number[] = []
    if (enrollments && enrollments.length > 0) {
      const activityIds = enrollments.map((e: any) => e.activity_id).filter(Boolean)
      const { data: activities } = await supabase
        .from('activities')
        .select('id, title, type, price, coach_id')
        .in('id', activityIds)

      const coachActivities = (activities || []).filter((a: any) => String(a?.coach_id) === String(user.id))
      coachActivityIds = coachActivities.map((a: any) => Number(a.id)).filter((id: number) => Number.isFinite(id))

      const enrollmentsForCoach = (enrollments || []).filter((e: any) => coachActivityIds.includes(Number(e.activity_id)))

      // Buscar pagos reales en banco (prefer seller_amount, fallback amount_paid)
      const enrollmentIds = enrollmentsForCoach
        .map((e: any) => e?.id)
        .filter((id: any) => typeof id === 'number' || typeof id === 'string')
        .map((id: any) => (typeof id === 'number' ? id : Number(id)))
        .filter((id: number) => Number.isFinite(id) && id > 0)

      let bancoRows: any[] = []
      if (enrollmentIds.length > 0 || coachActivityIds.length > 0) {
        let bancoQuery = supabase
          .from('banco')
          .select('id, enrollment_id, activity_id, client_id, seller_amount, amount_paid, payment_status')

        const conditions: string[] = []
        // Algunos registros legacy pueden tener client_id NULL, así que lo incluimos como OR en vez de forzar AND.
        conditions.push(`client_id.eq.${clientId}`)
        if (enrollmentIds.length > 0) {
          conditions.push(`enrollment_id.in.(${enrollmentIds.join(',')})`)
        }
        if (coachActivityIds.length > 0) {
          conditions.push(`activity_id.in.(${coachActivityIds.join(',')})`)
        }
        if (conditions.length > 0) {
          bancoQuery = bancoQuery.or(conditions.join(','))
        }

        const { data: bancoData } = await bancoQuery
        bancoRows = bancoData || []
      }

      const paidByEnrollmentId = new Map<number, number>()
      const paidByActivityId = new Map<number, number>()
      for (const row of bancoRows) {
        const paid = Number((row as any)?.seller_amount ?? (row as any)?.amount_paid ?? 0) || 0
        const enrId = Number((row as any)?.enrollment_id)
        const actId = Number((row as any)?.activity_id)
        if (Number.isFinite(enrId) && enrId > 0) {
          paidByEnrollmentId.set(enrId, (paidByEnrollmentId.get(enrId) || 0) + paid)
        }
        if (Number.isFinite(actId) && actId > 0) {
          paidByActivityId.set(actId, (paidByActivityId.get(actId) || 0) + paid)
        }
      }

      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      const yesterdayIso = yesterday.toISOString().slice(0, 10)

      const countKeys = (raw: any): number => {
        if (!raw) return 0
        if (Array.isArray(raw)) return raw.length
        if (typeof raw === 'object') return Object.keys(raw).length
        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) return parsed.length
            if (parsed && typeof parsed === 'object') return Object.keys(parsed).length
            return 0
          } catch {
            return 0
          }
        }
        return 0
      }

      const diffDays = (aIso: string, bIso: string) => {
        const a = new Date(aIso).getTime()
        const b = new Date(bIso).getTime()
        const diff = a - b
        return Math.max(0, Math.round(diff / 86400000))
      }

      const computeProgressForActivity = async (activity: any) => {
        const actType = String(activity?.type || '')
        const isNutrition = actType.includes('nutri')
        const table = isNutrition ? 'progreso_cliente_nutricion' : 'progreso_cliente'

        // Tomamos solo días hasta ayer (hoy no cuenta para "al día")
        const { data: progressRows } = await supabase
          .from(table)
          .select('fecha, ejercicios_completados, ejercicios_pendientes')
          .eq('cliente_id', clientId)
          .eq('actividad_id', Number(activity?.id))
          .lte('fecha', yesterdayIso)
          .order('fecha', { ascending: false })
          .limit(60)

        let completedSum = 0
        let totalSum = 0
        let lastPendingDate: string | null = null

        for (const r of progressRows || []) {
          const c = countKeys((r as any)?.ejercicios_completados)
          const p = countKeys((r as any)?.ejercicios_pendientes)
          completedSum += c
          totalSum += c + p
          if (p > 0) {
            const fecha = String((r as any)?.fecha)
            if (!lastPendingDate || fecha > lastPendingDate) {
              lastPendingDate = fecha
            }
          }
        }

        const progressPercent = totalSum > 0 ? Math.round((completedSum / totalSum) * 100) : 0
        const upToDate = !lastPendingDate
        const daysBehind = lastPendingDate ? diffDays(yesterdayIso, lastPendingDate) : 0

        return { progressPercent, upToDate, daysBehind }
      }

      activitiesDetails = await Promise.all(enrollmentsForCoach.map(async (enrollment: any) => {
        const activity = coachActivities.find((a: any) => String(a.id) === String(enrollment.activity_id))
        const enrollmentIdNum = Number(enrollment?.id)
        const activityIdNum = Number(enrollment?.activity_id)
        const paidAmount =
          (Number.isFinite(enrollmentIdNum) ? paidByEnrollmentId.get(enrollmentIdNum) : undefined) ??
          (Number.isFinite(activityIdNum) ? paidByActivityId.get(activityIdNum) : undefined) ??
          0
        const progressMeta = await computeProgressForActivity(activity)
        return {
          id: activity?.id || enrollment.activity_id,
          title: activity?.title || 'Actividad',
          type: activity?.type || 'general',
          price: activity?.price || 0,
          enrollmentId: enrollment?.id,
          enrollmentStatus: enrollment?.status,
          enrollmentStartDate: enrollment?.start_date,
          paidAmount,
          progressPercent: progressMeta.progressPercent,
          upToDate: progressMeta.upToDate,
          daysBehind: progressMeta.daysBehind
        }
      }))
    }

    // Calcular métricas del cliente (ingresos reales del coach por este cliente)
    const totalRevenue = activitiesDetails?.reduce((sum: number, a: any) => sum + (Number(a?.paidAmount) || 0), 0) || 0
    
    const todoCount = enrollments?.reduce((sum: number, enrollment: any) => {
      const raw = enrollment?.todo_list
      if (!raw) return sum
      if (Array.isArray(raw)) return sum + raw.length
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw)
          return sum + (Array.isArray(parsed) ? parsed.length : 0)
        } catch {
          return sum
        }
      }
      return sum
    }, 0) || 0

    // Calcular edad a partir de birth_date
    const calculateAge = (birthDate: string) => {
      if (!birthDate) return null
      const today = new Date()
      const birth = new Date(birthDate)
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return age
    }

    // Calcular IMC
    const calculateBMI = (weight: number, height: number) => {
      if (!weight || !height) return null
      const heightInMeters = height / 100 // Convertir cm a metros
      return (weight / (heightInMeters * heightInMeters)).toFixed(1)
    }

    const client = {
      id: profile?.id || clientId,
      name: profile?.full_name || clientData?.full_name || 'Cliente',
      email: profile?.email || '',
      avatar_url: profile?.avatar_url,
      progress: 53,
      activitiesCount: enrollments?.length || 0,
      todoCount,
      totalRevenue,
      activities: activitiesDetails,
      injuries: injuries || [],
      biometrics: biometrics || [],
      objectives: objectivesWithProgress,
      // Datos físicos del cliente
      physicalData: {
        height: clientData?.Height || null,
        weight: clientData?.weight || null,
        age: calculateAge(clientData?.birth_date),
        bmi: clientData?.Height && clientData?.weight ? calculateBMI(clientData.weight, clientData.Height) : null,
        gender: clientData?.Genre || null,
        fitnessGoals: clientData?.fitness_goals || [],
        healthConditions: clientData?.health_conditions || [],
        activityLevel: clientData?.nivel_actividad || null,
        phone: clientData?.phone || null,
        location: clientData?.location || null,
        emergencyContact: clientData?.emergency_contact || null,
        description: clientData?.description || null
      }
    }

    return NextResponse.json({ 
      success: true, 
      client,
      stats: {
        injuries_count: injuries?.length || 0,
        biometrics_count: biometrics?.length || 0,
        objectives_count: objectives?.length || 0,
        activities_count: enrollments?.length || 0,
        errors: {
          profile: profileError?.message,
          clientData: clientDataError?.message,
          injuries: injuriesError?.message,
          biometrics: biometricsError?.message,
          objectives: objectivesError?.message,
          enrollments: enrollmentsError?.message
        }
      }
    })

  } catch (error) {
    console.error('[client-details] Error general:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
