import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

// Devuelve una lista de archivos de almacenamiento "agregados" por actividad,
// usando como fuente la tabla storage_usage (products por concepto) para no dejar la UI vacía.
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    // 1) Leer uso agregado por concepto
    const { data: usageRows, error: usageError } = await supabase
      .from('storage_usage')
      .select('concept, gb_usage, products')
      .eq('coach_id', user.id)

    if (usageError) {
      console.error('Error leyendo storage_usage:', usageError)
      return NextResponse.json({ success: false, files: [] }, { status: 200 })
    }

    // 2) Unir todos los IDs de actividades para obtener nombres
    const activityIdSet = new Set<number>()
    for (const row of usageRows || []) {
      const ids = Array.isArray((row as any)?.products) ? (row as any).products as number[] : []
      ids.forEach(id => activityIdSet.add(id))
    }
    const activityIds = Array.from(activityIdSet)

    let idToName: Record<number, string> = {}
    if (activityIds.length > 0) {
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('id, title')
        .in('id', activityIds)
        .eq('coach_id', user.id)
      if (!activitiesError && Array.isArray(activities)) {
        activities.forEach(a => { idToName[a.id] = a.title })
      }
    }

    // 3) Construir archivos sintéticos por actividad y concepto
    const files: Array<{
      fileId: string
      fileName: string
      concept: 'video' | 'image' | 'pdf'
      sizeBytes: number
      sizeGB: number
      usesCount: number
      activities: Array<{ id: number, name: string }>
    }> = []

    for (const row of usageRows || []) {
      const concept = (row?.concept || 'video') as 'video' | 'image' | 'pdf'
      const gbUsage = typeof row?.gb_usage === 'number' ? row.gb_usage : 0
      const ids = Array.isArray((row as any)?.products) ? (row as any).products as number[] : []
      const perItemGB = ids.length > 0 ? (gbUsage / ids.length) : 0

      ids.forEach((activityId: number, idx: number) => {
        const name = idToName[activityId] || `Actividad ${activityId}`
        files.push({
          fileId: `${concept}-${activityId}-${idx}`,
          fileName: `${concept}-${activityId}.bin`,
          concept,
          sizeBytes: Math.max(0, perItemGB) * 1024 * 1024 * 1024,
          sizeGB: Math.max(0, perItemGB),
          usesCount: 1,
          activities: [{ id: activityId, name }]
        })
      })
    }

    return NextResponse.json({ success: true, files })
  } catch (error) {
    console.error('Error en GET /api/coach/storage-files:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
}








