import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

// POST - Migrar datos de ejercicios_detalles a las nuevas tablas
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const body = await request.json()
    
    const {
      actividad_id,
      force_migration = false // Si true, sobrescribe datos existentes
    } = body

    if (!actividad_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'actividad_id es requerido' 
      }, { status: 400 })
    }

    console.log('🔄 Iniciando migración para actividad:', actividad_id)

    // 1. Obtener todos los ejercicios de la actividad desde ejercicios_detalles
    const { data: ejercicios, error: ejerciciosError } = await supabase
      .from('ejercicios_detalles')
      .select('*')
      .eq('activity_id', actividad_id)
      .order('id')

    if (ejerciciosError) {
      console.error('Error obteniendo ejercicios:', ejerciciosError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error obteniendo ejercicios' 
      }, { status: 500 })
    }

    if (!ejercicios || ejercicios.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No se encontraron ejercicios para esta actividad' 
      }, { status: 404 })
    }

    console.log(`📊 Encontrados ${ejercicios.length} ejercicios para migrar`)

    // 2. Verificar si ya existe programación para esta actividad
    if (!force_migration) {
      const { data: existingPlanificacion, error: checkError } = await supabase
        .from('planificacion_ejercicios')
        .select('id')
        .eq('actividad_id', actividad_id)
        .limit(1)

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error verificando planificación existente:', checkError)
        return NextResponse.json({ 
          success: false, 
          error: 'Error verificando planificación existente' 
        }, { status: 500 })
      }

      if (existingPlanificacion && existingPlanificacion.length > 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Ya existe programación para esta actividad. Use force_migration=true para sobrescribir' 
        }, { status: 409 })
      }
    }

    // 3. Agrupar ejercicios por semana y día
    const programacionPorSemana = new Map()
    
    ejercicios.forEach(ejercicio => {
      // Usar las columnas que aún existen en ejercicios_detalles
      const semana = ejercicio.semana || 1
      const dia = ejercicio.dia || 1
      const ejercicioId = ejercicio.id

      if (!programacionPorSemana.has(semana)) {
        programacionPorSemana.set(semana, {
          lunes: { ejercicios: [] },
          martes: { ejercicios: [] },
          miercoles: { ejercicios: [] },
          jueves: { ejercicios: [] },
          viernes: { ejercicios: [] },
          sabado: { ejercicios: [] },
          domingo: { ejercicios: [] }
        })
      }

      const semanaData = programacionPorSemana.get(semana)
      const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
      
      if (dia >= 1 && dia <= 7) {
        const nombreDia = diasSemana[dia - 1]
        if (!semanaData[nombreDia].ejercicios.includes(ejercicioId)) {
          semanaData[nombreDia].ejercicios.push(ejercicioId)
        }
      }
    })

    console.log(`📅 Programación agrupada en ${programacionPorSemana.size} semanas`)

    // 4. Eliminar programación existente si force_migration es true
    if (force_migration) {
      const { error: deleteError } = await supabase
        .from('planificacion_ejercicios')
        .delete()
        .eq('actividad_id', actividad_id)

      if (deleteError) {
        console.error('Error eliminando programación existente:', deleteError)
        return NextResponse.json({ 
          success: false, 
          error: 'Error eliminando programación existente' 
        }, { status: 500 })
      }
    }

    // 5. Crear planificaciones en la nueva tabla
    const planificacionesCreadas = []
    
    for (const [numeroSemana, semanaData] of programacionPorSemana) {
      const { data: planificacion, error: planificacionError } = await supabase
        .from('planificacion_ejercicios')
        .insert({
          actividad_id,
          numero_semana: numeroSemana,
          ...semanaData
        })
        .select()
        .single()

      if (planificacionError) {
        console.error(`Error creando planificación semana ${numeroSemana}:`, planificacionError)
        return NextResponse.json({ 
          success: false, 
          error: `Error creando planificación semana ${numeroSemana}` 
        }, { status: 500 })
      }

      planificacionesCreadas.push(planificacion)
    }

    // 6. Crear/actualizar período
    const { data: periodo, error: periodoError } = await supabase
      .from('periodos')
      .upsert({
        actividad_id,
        cantidad_periodos: 1 // Por defecto, se puede ajustar después
      }, {
        onConflict: 'actividad_id'
      })
      .select()
      .single()

    if (periodoError) {
      console.error('Error creando período:', periodoError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error creando período' 
      }, { status: 500 })
    }

    // 7. Calcular estadísticas finales
    const totalSemanas = planificacionesCreadas.length
    const totalEjercicios = planificacionesCreadas.reduce((total, semana) => {
      const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
      return total + dias.reduce((diaTotal, dia) => {
        const ejercicios = semana[dia]?.ejercicios || []
        return diaTotal + ejercicios.length
      }, 0)
    }, 0)

    const totalDias = planificacionesCreadas.reduce((total, semana) => {
      const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
      return total + dias.filter(dia => {
        const ejercicios = semana[dia]?.ejercicios || []
        return ejercicios.length > 0
      }).length
    }, 0)

    return NextResponse.json({
      success: true,
      data: {
        actividad_id,
        ejercicios_migrados: ejercicios.length,
        planificaciones_creadas: planificacionesCreadas.length,
        periodo: periodo,
        estadisticas: {
          total_semanas: totalSemanas,
          total_dias: totalDias,
          total_ejercicios: totalEjercicios
        }
      },
      message: `Migración completada: ${ejercicios.length} ejercicios migrados a ${totalSemanas} semanas`
    })

  } catch (error) {
    console.error('Error en POST /api/migrate-exercise-data:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}






















