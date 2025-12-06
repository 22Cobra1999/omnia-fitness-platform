import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, createServiceRoleClient } from '@/lib/supabase/supabase-server'

/**
 * Endpoint para recuperar temas y horarios desde ejecuciones_taller
 * Útil cuando se perdieron datos de taller_detalles
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { actividad_id, restore = false } = body

    if (!actividad_id) {
      return NextResponse.json(
        { error: 'actividad_id es requerido' },
        { status: 400 }
      )
    }

    const supabase = await createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Usar service role para leer ejecuciones_taller
    const serviceClient = createServiceRoleClient()
    if (!serviceClient) {
      return NextResponse.json(
        { error: 'Service role client no disponible' },
        { status: 500 }
      )
    }

    console.log('🔍 Recuperando temas desde ejecuciones_taller para actividad:', actividad_id)

    // 1. Buscar todas las ejecuciones del taller
    const { data: ejecuciones, error: ejecucionesError } = await serviceClient
      .from('ejecuciones_taller')
      .select('id, cliente_id, temas_cubiertos, temas_pendientes')
      .eq('actividad_id', actividad_id)

    if (ejecucionesError) {
      console.error('❌ Error buscando ejecuciones:', ejecucionesError)
      return NextResponse.json(
        { error: 'Error buscando ejecuciones', details: ejecucionesError.message },
        { status: 500 }
      )
    }

    console.log('📊 Ejecuciones encontradas:', ejecuciones?.length || 0)

    // 2. Extraer temas únicos desde temas_cubiertos y temas_pendientes
    const temasMap = new Map<string, {
      nombre: string
      descripcion: string
      originales: Array<{
        fecha: string
        hora_inicio: string
        hora_fin: string
        cupo: number
      }>
    }>()

    ejecuciones?.forEach((ejecucion: any) => {
      // Procesar temas_cubiertos
      if (ejecucion.temas_cubiertos && Array.isArray(ejecucion.temas_cubiertos)) {
        ejecucion.temas_cubiertos.forEach((tema: any) => {
          const temaNombre = tema.tema_nombre || 'Sin título'
          
          if (!temasMap.has(temaNombre)) {
            temasMap.set(temaNombre, {
              nombre: temaNombre,
              descripcion: tema.descripcion || '',
              originales: []
            })
          }

          const temaData = temasMap.get(temaNombre)!
          
          // Agregar horario si existe
          if (tema.fecha_seleccionada && tema.horario_seleccionado) {
            const horario = {
              fecha: tema.fecha_seleccionada,
              hora_inicio: tema.horario_seleccionado.hora_inicio || '10:00',
              hora_fin: tema.horario_seleccionado.hora_fin || '12:00',
              cupo: 20 // Cupo por defecto
            }
            
            // Evitar duplicados
            const existe = temaData.originales.some((h: any) => 
              h.fecha === horario.fecha && 
              h.hora_inicio === horario.hora_inicio &&
              h.hora_fin === horario.hora_fin
            )
            
            if (!existe) {
              temaData.originales.push(horario)
            }
          }
        })
      }

      // Procesar temas_pendientes
      if (ejecucion.temas_pendientes && Array.isArray(ejecucion.temas_pendientes)) {
        ejecucion.temas_pendientes.forEach((tema: any) => {
          const temaNombre = tema.tema_nombre || 'Sin título'
          
          if (!temasMap.has(temaNombre)) {
            temasMap.set(temaNombre, {
              nombre: temaNombre,
              descripcion: tema.descripcion || '',
              originales: []
            })
          }

          const temaData = temasMap.get(temaNombre)!
          
          // Agregar horario si existe
          if (tema.fecha_seleccionada && tema.horario_seleccionado) {
            const horario = {
              fecha: tema.fecha_seleccionada,
              hora_inicio: tema.horario_seleccionado.hora_inicio || '10:00',
              hora_fin: tema.horario_seleccionado.hora_fin || '12:00',
              cupo: 20
            }
            
            const existe = temaData.originales.some((h: any) => 
              h.fecha === horario.fecha && 
              h.hora_inicio === horario.hora_inicio &&
              h.hora_fin === horario.hora_fin
            )
            
            if (!existe) {
              temaData.originales.push(horario)
            }
          }
        })
      }
    })

    // 3. Convertir a formato taller_detalles
    const temasRecuperados = Array.from(temasMap.values()).map(tema => ({
      nombre: tema.nombre,
      descripcion: tema.descripcion,
      originales: {
        fechas_horarios: tema.originales
      },
      secundarios: {
        fechas_horarios: []
      }
    }))

    console.log('✅ Temas recuperados:', temasRecuperados.length)

    // 4. Si restore=true, restaurar los temas directamente en taller_detalles
    if (restore && temasRecuperados.length > 0) {
      console.log('🔄 Restaurando temas en taller_detalles...')
      
      // Verificar que el usuario es el dueño de la actividad
      const { data: actividad, error: actividadError } = await serviceClient
        .from('activities')
        .select('coach_id, type')
        .eq('id', actividad_id)
        .single()
      
      if (actividadError || !actividad) {
        return NextResponse.json(
          { error: 'Actividad no encontrada' },
          { status: 404 }
        )
      }
      
      if (actividad.type !== 'workshop') {
        return NextResponse.json(
          { error: 'Esta actividad no es un taller' },
          { status: 400 }
        )
      }
      
      if (actividad.coach_id !== user.id) {
        return NextResponse.json(
          { error: 'No autorizado para restaurar esta actividad' },
          { status: 403 }
        )
      }
      
      // Verificar si hay fechas futuras
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      let hasAnyFutureDates = false
      
      temasRecuperados.forEach((tema: any) => {
        if (tema.originales?.fechas_horarios && Array.isArray(tema.originales.fechas_horarios)) {
          const hasFutureDates = tema.originales.fechas_horarios.some((horario: any) => {
            const fecha = new Date(horario.fecha)
            fecha.setHours(0, 0, 0, 0)
            return fecha >= now
          })
          if (hasFutureDates) {
            hasAnyFutureDates = true
          }
        }
      })
      
      // Verificar temas existentes para hacer update o insert
      const { data: temasExistentes, error: temasError } = await serviceClient
        .from('taller_detalles')
        .select('id, nombre')
        .eq('actividad_id', actividad_id)
      
      const temasExistentesMap = new Map()
      temasExistentes?.forEach((tema: any) => {
        temasExistentesMap.set(tema.nombre, tema)
      })
      
      let inserted = 0
      let updated = 0
      
      // Insertar o actualizar cada tema
      for (const tema of temasRecuperados) {
        const temaExistente = temasExistentesMap.get(tema.nombre)
        
        const temaData = {
          actividad_id: actividad_id,
          nombre: tema.nombre,
          descripcion: tema.descripcion || '',
          originales: tema.originales,
          secundarios: tema.secundarios || { fechas_horarios: [] },
          activo: hasAnyFutureDates
        }
        
        if (temaExistente) {
          // Actualizar tema existente
          const { error: updateError } = await serviceClient
            .from('taller_detalles')
            .update(temaData)
            .eq('id', temaExistente.id)
          
          if (updateError) {
            console.error(`❌ Error actualizando tema ${tema.nombre}:`, updateError)
          } else {
            console.log(`✅ Tema actualizado: ${tema.nombre}`)
            updated++
          }
        } else {
          // Insertar tema nuevo
          const { error: insertError } = await serviceClient
            .from('taller_detalles')
            .insert(temaData)
          
          if (insertError) {
            console.error(`❌ Error insertando tema ${tema.nombre}:`, insertError)
          } else {
            console.log(`✅ Tema insertado: ${tema.nombre}`)
            inserted++
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        temas: temasRecuperados,
        count: temasRecuperados.length,
        restored: true,
        inserted,
        updated,
        message: `Se restauraron ${inserted} temas nuevos y se actualizaron ${updated} temas existentes.`
      })
    }

    return NextResponse.json({
      success: true,
      temas: temasRecuperados,
      count: temasRecuperados.length
    })

  } catch (error: any) {
    console.error('❌ Error en recover-topics:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


