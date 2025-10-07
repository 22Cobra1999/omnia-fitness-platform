import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // console.log('🔍 POST /api/exercise-replications - Iniciando...')
    
    const supabase = await createRouteHandlerClient()
    
    // console.log('🔍 Supabase client creado')
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    // console.log('🔍 Auth check:', { user: user?.email, error: authError?.message })
    
    if (authError || !user) {
      console.log('❌ Error de autenticación:', authError?.message)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    // console.log('🔍 Request body:', body)
    
    const { 
      activity_id, 
      source_periods, 
      target_periods, 
      repetitions,
      replication_type 
    } = body
    
    // console.log('🔍 Parámetros extraídos:', { activity_id, source_periods, target_periods })
    })
    
    // Validar datos requeridos
    if (!activity_id || !source_periods || !target_periods || !repetitions || !replication_type) {
      console.log('❌ Faltan datos requeridos')
      return NextResponse.json({ 
        error: 'Faltan datos requeridos: activity_id, source_periods, target_periods, repetitions, replication_type' 
      }, { status: 400 })
    }
    
    // Actualizar la columna mes para indicar replicación
    // console.log('🔍 Actualizando columna mes para replicación...')
    
    let updatedCount = 0
    
    // Para cada período fuente
    for (const sourcePeriod of source_periods) {
      // Obtener ejercicios de ese período específico
      const { data: periodExercises, error: periodError } = await supabase
        .from('activity_calendar')
        .select('*')
        .eq('activity_id', activity_id)
        .eq('week_number', sourcePeriod)
        .eq('is_replicated', false) // Solo ejercicios originales
      
      if (periodError) {
        console.error('❌ Error obteniendo ejercicios del período:', periodError)
        continue
      }
      
      // console.log(`🔍 Ejercicios encontrados para semana ${sourcePeriod}:`, periodExercises?.length || 0)
      
      // Para cada ejercicio en ese período
      for (const exercise of periodExercises || []) {
        // Calcular los meses adicionales
        const currentMonth = exercise.month_number
        const additionalMonths = []
        
        for (let rep = 1; rep <= repetitions; rep++) {
          if (replication_type === 'weeks') {
            // Para semanas: agregar al siguiente mes
            additionalMonths.push(currentMonth + rep)
          } else {
            // Para meses: agregar meses adicionales
            additionalMonths.push(currentMonth + rep)
          }
        }
        
        // Crear el nuevo valor de mes (ej: "1;2;3")
        const newMonthValue = [currentMonth, ...additionalMonths].join(';')
        
        // console.log(`🔍 Actualizando ejercicio ${exercise.id}: mes ${exercise.month_number} → ${newMonthValue}`)
        
        // Actualizar la fila
        const { error: updateError } = await supabase
          .from('activity_calendar')
          .update({ 
            month_number: newMonthValue,
            is_replicated: true // Marcar como replicado
          })
          .eq('id', exercise.id)
        
        if (updateError) {
          console.error('❌ Error actualizando ejercicio:', updateError)
        } else {
          updatedCount++
        }
      }
    }
    
    // console.log('🔍 Ejercicios actualizados:', updatedCount)
    
    if (updatedCount === 0) {
      return NextResponse.json({ 
        error: 'No se encontraron ejercicios para replicar en los períodos seleccionados' 
      }, { status: 404 })
    }
    
    // console.log('✅ Replicación creada exitosamente')
    return NextResponse.json({ 
      success: true, 
      message: `Replicación creada exitosamente. ${updatedCount} ejercicios actualizados para repetir ${repetitions} vez(es)`,
      updated_exercises: updatedCount
    })
  } catch (error) {
    console.error('❌ Error en API de replicaciones:', error)
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // console.log('🔍 GET /api/exercise-replications - Iniciando...')
    
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('❌ Error de autenticación en GET:', authError?.message)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const activity_id = searchParams.get('activity_id')
    
    // console.log('🔍 GET - activity_id:', activity_id)
    
    if (!activity_id) {
      return NextResponse.json({ error: 'activity_id es requerido' }, { status: 400 })
    }
    
    // Obtener entradas con múltiples meses (replicadas)
    const { data: replicatedEntries, error } = await supabase
      .from('activity_calendar')
      .select('*')
      .eq('activity_id', activity_id)
      .like('month_number', '%;%') // Buscar entradas con múltiples meses
      .order('created_at', { ascending: false })
    
    // console.log('🔍 GET - Entradas con múltiples meses encontradas:', replicatedEntries?.length || 0)
    
    if (error) {
      console.error('❌ Error obteniendo entradas replicadas:', error)
      return NextResponse.json({ error: 'Error obteniendo replicaciones' }, { status: 500 })
    }
    
    // Agrupar por semana para mostrar replicaciones
    const replications = replicatedEntries?.reduce((acc: any[], entry) => {
      const existingReplication = acc.find(r => r.week_number === entry.week_number)
      if (existingReplication) {
        existingReplication.exercise_count++
      } else {
        acc.push({
          id: entry.id,
          activity_id: entry.activity_id,
          week_number: entry.week_number,
          month_numbers: entry.month_number,
          exercise_count: 1,
          created_at: entry.created_at
        })
      }
      return acc
    }, []) || []
    
    // console.log('🔍 GET - Replicaciones agrupadas:', replications.length)
    
    return NextResponse.json({ replications })
  } catch (error) {
    console.error('❌ Error en API de replicaciones GET:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // console.log('🔍 DELETE /api/exercise-replications - Iniciando...')
    
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('❌ Error de autenticación en DELETE:', authError?.message)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const replication_id = searchParams.get('replication_id')
    
    // console.log('🔍 DELETE - replication_id:', replication_id)
    
    if (!replication_id) {
      return NextResponse.json({ error: 'replication_id es requerido' }, { status: 400 })
    }
    
    // Obtener la entrada para revertir la replicación
    const { data: entry, error: fetchError } = await supabase
      .from('activity_calendar')
      .select('*')
      .eq('id', replication_id)
      .single()
    
    if (fetchError || !entry) {
      console.error('❌ Error obteniendo entrada para eliminar:', fetchError)
      return NextResponse.json({ error: 'Entrada no encontrada' }, { status: 404 })
    }
    
    // Revertir la columna month_number al valor original (solo el primer mes)
    const monthNumbers = entry.month_number.split(';')
    const originalMonth = monthNumbers[0] // Solo el primer mes
    
    const { error } = await supabase
      .from('activity_calendar')
      .update({ 
        month_number: originalMonth,
        is_replicated: false
      })
      .eq('id', replication_id)
    
    // console.log('🔍 DELETE - Resultado:', { error: error?.message })
    
    if (error) {
      console.error('❌ Error revirtiendo replicación:', error)
      return NextResponse.json({ error: 'Error eliminando replicación' }, { status: 500 })
    }
    
    // console.log('✅ Replicación revertida exitosamente')
    return NextResponse.json({ 
      success: true, 
      message: 'Replicación eliminada exitosamente' 
    })
  } catch (error) {
    console.error('❌ Error en API de replicaciones DELETE:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
