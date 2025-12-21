/**
 * Script directo para recuperar temas de taller desde ejecuciones_taller
 * No requiere que el servidor esté corriendo
 * 
 * Uso: npx tsx scripts/recuperar-temas-directo.ts <activity_id>
 * 
 * Ejemplo:
 *   npx tsx scripts/recuperar-temas-directo.ts 48
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function recuperarTemasDirecto(activityId: number) {
  console.log(`🔍 Recuperando temas para actividad ${activityId}...`)
  
  try {
    // 1. Buscar todas las ejecuciones del taller
    const { data: ejecuciones, error: ejecucionesError } = await supabase
      .from('ejecuciones_taller')
      .select('id, cliente_id, temas_cubiertos, temas_pendientes')
      .eq('actividad_id', activityId)

    if (ejecucionesError) {
      console.error('❌ Error buscando ejecuciones:', ejecucionesError)
      return
    }

    if (!ejecuciones || ejecuciones.length === 0) {
      console.log('ℹ️ No se encontraron ejecuciones para esta actividad')
      return
    }

    console.log(`📊 Encontradas ${ejecuciones.length} ejecuciones`)

    // 2. Extraer temas únicos desde temas_cubiertos y temas_pendientes
    const temasMap = new Map<string, any>()

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

    const temasRecuperados = Array.from(temasMap.values())

    if (temasRecuperados.length === 0) {
      console.log('ℹ️ No se encontraron temas en las ejecuciones')
      return
    }

    console.log(`✅ Encontrados ${temasRecuperados.length} temas únicos:`)
    temasRecuperados.forEach(tema => {
      console.log(`   - ${tema.nombre}`)
    })

    // 3. Verificar si hay temas existentes
    const { data: temasExistentes, error: temasError } = await supabase
      .from('taller_detalles')
      .select('id, nombre')
      .eq('actividad_id', activityId)

    if (temasError) {
      console.error('❌ Error verificando temas existentes:', temasError)
      return
    }

    const temasExistentesMap = new Map()
    temasExistentes?.forEach((tema: any) => {
      temasExistentesMap.set(tema.nombre, tema)
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

    // 5. Insertar o actualizar temas
    let inserted = 0
    let updated = 0

    for (const tema of temasRecuperados) {
      const temaExistente = temasExistentesMap.get(tema.nombre)

      const temaData = {
        actividad_id: activityId,
        nombre: tema.nombre,
        descripcion: tema.descripcion || '',
        originales: tema.originales,
        secundarios: tema.secundarios || { fechas_horarios: [] },
        activo: hasAnyFutureDates
      }

      if (temaExistente) {
        // Actualizar tema existente
        const { error: updateError } = await supabase
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
        const { error: insertError } = await supabase
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

    console.log(`\n✅ Proceso completado:`)
    console.log(`   - Temas insertados: ${inserted}`)
    console.log(`   - Temas actualizados: ${updated}`)
    console.log(`   - Total procesados: ${temasRecuperados.length}`)

  } catch (error: any) {
    console.error('❌ Error fatal:', error)
    throw error
  }
}

// Obtener argumentos de la línea de comandos
const args = process.argv.slice(2)
const activityIdArg = args[0]

if (!activityIdArg) {
  console.error('❌ Uso: npx tsx scripts/recuperar-temas-directo.ts <activity_id>')
  console.error('   Ejemplo: npx tsx scripts/recuperar-temas-directo.ts 48')
  process.exit(1)
}

const activityId = parseInt(activityIdArg, 10)
if (isNaN(activityId)) {
  console.error('❌ activity_id debe ser un número')
  process.exit(1)
}

recuperarTemasDirecto(activityId)
  .then(() => {
    console.log('\n✅ Recuperación completada exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })


















