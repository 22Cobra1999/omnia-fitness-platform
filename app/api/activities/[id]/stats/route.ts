import { NextRequest, NextResponse } from "next/server"
import { createClientWithCookies } from "../../../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const activityId = parseInt(resolvedParams.id)
    
    if (!activityId || isNaN(activityId)) {
      return NextResponse.json(
        { success: false, error: "ID de actividad inválido" },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = await createClientWithCookies(cookieStore)

    // 1. Obtener ejercicios de ejercicios_detalles
    const { data: ejercicios, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('id, semana, dia, mes')
      .eq('activity_id', activityId)

    if (ejerciciosError) {
      console.error('Error obteniendo ejercicios:', ejerciciosError)
      return NextResponse.json(
        { success: false, error: "Error obteniendo ejercicios" },
        { status: 500 }
      )
    }

    // 2. Obtener periodos de periodos_asignados
    const { data: periodosData, error: periodosError } = await supabase
      .from('periodos_asignados')
      .select('numero_periodo')
      .eq('activity_id', activityId)

    if (periodosError) {
      console.error('Error obteniendo periodos:', periodosError)
      // No fallar si no hay periodos, usar fallback
    }

    // 3. Calcular según la especificación del usuario:
    // - Ejercicios totales: cantidad de filas en ejercicios_detalles × cantidad de periodos
    const ejerciciosCount = (ejercicios?.length || 0)
    const periodosCount = periodosData?.length || 1 // Fallback a 1 si no hay periodos
    const exercisesTotal = ejerciciosCount * periodosCount

    // - Sesiones totales: contar cantidad de días/semanas/meses dentro de ejercicios_detalles × periodos
    let totalSessions = 0
    
    if (ejercicios && ejercicios.length > 0) {
      // Contar días únicos basados en semana/día
      const diasUnicos = new Set<string>()
      ejercicios.forEach(ej => {
        if (ej.semana && ej.dia) {
          diasUnicos.add(`${ej.semana}-${ej.dia}`)
        } else if (ej.mes) {
          // Si tiene mes, asumir que es mensual
          diasUnicos.add(`mes-${ej.mes}`)
        }
      })
      
      // Si no hay datos de semana/día/mes, usar el conteo de ejercicios como días
      const diasDistintos = diasUnicos.size > 0 ? diasUnicos.size : ejerciciosCount
      totalSessions = diasDistintos * periodosCount
    } else {
      // Fallback si no hay ejercicios
      totalSessions = 0
    }

    // console.log(`📊 Estadísticas para actividad ${activityId}:`, { ejerciciosCount, periodosCount })

    return NextResponse.json({
      success: true,
      data: {
        activityId,
        exercisesCount: exercisesTotal,
        totalSessions,
        periods: periodosCount,
        calculation: {
          ejerciciosFrom: 'ejercicios_detalles',
          periodosFrom: 'periodos_asignados',
          sesionesFrom: 'ejercicios_detalles'
        }
      }
    })

  } catch (error) {
    console.error('Error en GET /api/activities/[id]/stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    )
  }
}
