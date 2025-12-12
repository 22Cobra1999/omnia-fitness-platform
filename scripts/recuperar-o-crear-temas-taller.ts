/**
 * Script para recuperar o crear temas de taller
 * 
 * Intenta recuperar desde:
 * 1. ejecuciones_taller (temas_cubiertos y temas_pendientes)
 * 2. calendar_events (eventos de tipo workshop)
 * 
 * Si no puede recuperar, crea temas nuevos basados en calendar_events
 * 
 * Uso: npx tsx scripts/recuperar-o-crear-temas-taller.ts <activity_id>
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Cargar variables de entorno
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  console.error('💡 Asegúrate de tener un archivo .env.local con estas variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function recuperarOCrearTemas(activityId: number) {
  console.log(`🔍 Procesando actividad ${activityId}...`)
  
  try {
    // 1. Verificar si ya hay temas en taller_detalles
    const { data: temasExistentes, error: temasError } = await supabase
      .from('taller_detalles')
      .select('id, nombre, descripcion, originales, pdf_url, pdf_file_name, activo')
      .eq('actividad_id', activityId)

    if (temasError) {
      console.error('❌ Error verificando temas existentes:', temasError)
    } else if (temasExistentes && temasExistentes.length > 0) {
      console.log(`✅ Ya existen ${temasExistentes.length} temas en taller_detalles`)
      temasExistentes.forEach(tema => {
        console.log(`   - ${tema.nombre} (ID: ${tema.id})`)
      })
      return
    }

    console.log('ℹ️ No se encontraron temas en taller_detalles, intentando recuperar...')

    // 2. Intentar recuperar desde ejecuciones_taller
    const { data: ejecuciones, error: ejecucionesError } = await supabase
      .from('ejecuciones_taller')
      .select('id, cliente_id, temas_cubiertos, temas_pendientes')
      .eq('actividad_id', activityId)

    if (ejecucionesError) {
      console.error('❌ Error buscando ejecuciones:', ejecucionesError)
    }

    const temasMap = new Map<string, any>()

    if (ejecuciones && ejecuciones.length > 0) {
      console.log(`📊 Encontradas ${ejecuciones.length} ejecuciones, extrayendo temas...`)

      ejecuciones.forEach((ejecucion: any) => {
        // Procesar temas cubiertos
        if (ejecucion.temas_cubiertos && Array.isArray(ejecucion.temas_cubiertos)) {
          ejecucion.temas_cubiertos.forEach((tema: any) => {
            if (tema && tema.nombre) {
              const nombre = tema.nombre
              if (!temasMap.has(nombre)) {
                temasMap.set(nombre, {
                  nombre: nombre,
                  descripcion: tema.descripcion || '',
                  originales: tema.originales || { fechas_horarios: [] },
                  secundarios: tema.secundarios || { fechas_horarios: [] }
                })
              }
            }
          })
        }

        // Procesar temas pendientes
        if (ejecucion.temas_pendientes && Array.isArray(ejecucion.temas_pendientes)) {
          ejecucion.temas_pendientes.forEach((tema: any) => {
            if (tema && tema.nombre) {
              const nombre = tema.nombre
              if (!temasMap.has(nombre)) {
                temasMap.set(nombre, {
                  nombre: nombre,
                  descripcion: tema.descripcion || '',
                  originales: tema.originales || { fechas_horarios: [] },
                  secundarios: tema.secundarios || { fechas_horarios: [] }
                })
              }
            }
          })
        }
      })
    }

    // 3. Si no hay temas desde ejecuciones, intentar desde calendar_events
    if (temasMap.size === 0) {
      console.log('ℹ️ No se encontraron temas en ejecuciones, buscando en calendar_events...')
      
      const { data: eventos, error: eventosError } = await supabase
        .from('calendar_events')
        .select('id, title, start_time, end_time')
        .eq('activity_id', activityId)
        .eq('event_type', 'workshop')
        .order('start_time', { ascending: true })

      if (eventosError) {
        console.error('❌ Error buscando eventos:', eventosError)
      } else if (eventos && eventos.length > 0) {
        console.log(`📅 Encontrados ${eventos.length} eventos en calendar_events`)

        // Agrupar eventos por tema (extraer nombre del título)
        const eventosPorTema = new Map<string, any[]>()

        eventos.forEach((evento: any) => {
          // El título suele ser "Taller: [Nombre del Tema]"
          const nombreTema = evento.title?.replace(/^Taller:\s*/i, '').trim() || 'Sin título'
          
          if (!eventosPorTema.has(nombreTema)) {
            eventosPorTema.set(nombreTema, [])
          }
          
          eventosPorTema.get(nombreTema)!.push(evento)
        })

        // Crear temas desde eventos
        eventosPorTema.forEach((eventosTema, nombreTema) => {
          const fechasHorarios: any[] = []

          eventosTema.forEach(evento => {
            const fecha = new Date(evento.start_time)
            const fechaStr = fecha.toISOString().split('T')[0] // YYYY-MM-DD
            const horaInicio = fecha.toTimeString().split(' ')[0].substring(0, 5) // HH:MM
            const horaFin = new Date(evento.end_time).toTimeString().split(' ')[0].substring(0, 5)

            fechasHorarios.push({
              fecha: fechaStr,
              hora_inicio: horaInicio,
              hora_fin: horaFin,
              cupo: 20 // Valor por defecto
            })
          })

          temasMap.set(nombreTema, {
            nombre: nombreTema,
            descripcion: '',
            originales: { fechas_horarios: fechasHorarios },
            secundarios: { fechas_horarios: [] }
          })
        })

        console.log(`✅ Creados ${temasMap.size} temas desde calendar_events`)
      }
    }

    const temasRecuperados = Array.from(temasMap.values())

    if (temasRecuperados.length === 0) {
      console.log('❌ No se pudieron recuperar temas desde ninguna fuente')
      console.log('💡 Puedes crear temas manualmente editando el taller')
      return
    }

    console.log(`\n✅ Encontrados ${temasRecuperados.length} temas únicos:`)
    temasRecuperados.forEach(tema => {
      const fechasCount = tema.originales?.fechas_horarios?.length || 0
      console.log(`   - ${tema.nombre} (${fechasCount} fecha${fechasCount !== 1 ? 's' : ''})`)
    })

    // 4. Calcular si hay fechas futuras
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    let hasAnyFutureDates = false

    temasRecuperados.forEach((tema: any) => {
      if (tema.originales?.fechas_horarios && Array.isArray(tema.originales.fechas_horarios)) {
        const hasFutureDates = tema.originales.fechas_horarios.some((horario: any) => {
          if (!horario.fecha) return false
          const fecha = new Date(horario.fecha)
          fecha.setHours(0, 0, 0, 0)
          return fecha >= now
        })
        if (hasFutureDates) {
          hasAnyFutureDates = true
        }
      }
    })

    // 5. Obtener coach_id de la actividad
    const { data: actividad, error: actividadError } = await supabase
      .from('activities')
      .select('coach_id, title')
      .eq('id', activityId)
      .single()

    if (actividadError || !actividad) {
      console.error('❌ Error obteniendo información de la actividad:', actividadError)
      return
    }

    console.log(`\n📝 Insertando temas para taller: "${actividad.title}"`)

    // 6. Insertar temas
    let inserted = 0
    let errors = 0

    for (const tema of temasRecuperados) {
      const temaData: any = {
        actividad_id: activityId,
        nombre: tema.nombre,
        descripcion: tema.descripcion || '',
        originales: tema.originales,
        activo: hasAnyFutureDates
      }
      
      // Nota: La columna 'secundarios' no existe en la tabla, no la incluimos

      const { error: insertError } = await supabase
        .from('taller_detalles')
        .insert(temaData)

      if (insertError) {
        console.error(`❌ Error insertando tema "${tema.nombre}":`, insertError.message)
        errors++
      } else {
        console.log(`✅ Tema insertado: "${tema.nombre}"`)
        inserted++
      }
    }

    console.log(`\n✅ Proceso completado:`)
    console.log(`   - Temas insertados: ${inserted}`)
    if (errors > 0) {
      console.log(`   - Errores: ${errors}`)
    }
    console.log(`   - Total procesados: ${temasRecuperados.length}`)

    // 7. Sincronizar calendar_events si es necesario
    if (inserted > 0) {
      console.log('\n🔄 Sincronizando calendar_events...')
      // Los eventos ya deberían estar en calendar_events, pero verificamos
      const { data: eventosActuales } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('activity_id', activityId)
        .eq('event_type', 'workshop')

      console.log(`   - Eventos en calendar: ${eventosActuales?.length || 0}`)
    }

  } catch (error: any) {
    console.error('❌ Error fatal:', error)
    throw error
  }
}

// Obtener argumentos de la línea de comandos
const args = process.argv.slice(2)
const activityIdArg = args[0]

if (!activityIdArg) {
  console.error('❌ Uso: npx tsx scripts/recuperar-o-crear-temas-taller.ts <activity_id>')
  console.error('   Ejemplo: npx tsx scripts/recuperar-o-crear-temas-taller.ts 48')
  process.exit(1)
}

const activityId = parseInt(activityIdArg, 10)
if (isNaN(activityId)) {
  console.error('❌ activity_id debe ser un número')
  process.exit(1)
}

recuperarOCrearTemas(activityId)
  .then(() => {
    console.log('\n✅ Proceso completado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })

