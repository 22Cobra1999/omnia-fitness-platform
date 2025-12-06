/**
 * Script para recuperar temas y horarios desde ejecuciones_taller
 * y restaurarlos en taller_detalles
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

// Cargar variables de entorno
const envPaths = ['.env.local', '.env']
for (const envFile of envPaths) {
  const envPath = path.join(__dirname, '..', envFile)
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/)
        if (match) {
          let [, key, value] = match
          key = key.trim()
          value = value.trim()
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
          }
          process.env[key] = value
        }
      }
    })
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables de entorno faltantes')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function recoverWorkshopTopics(activityId) {
  console.log('🔍 Recuperando temas desde ejecuciones_taller para actividad:', activityId)
  console.log('')

  // 1. Buscar todas las ejecuciones del taller
  const { data: ejecuciones, error: ejecucionesError } = await supabase
    .from('ejecuciones_taller')
    .select('id, cliente_id, temas_cubiertos, temas_pendientes')
    .eq('actividad_id', activityId)

  if (ejecucionesError) {
    console.error('❌ Error buscando ejecuciones:', ejecucionesError)
    return false
  }

  console.log('📊 Ejecuciones encontradas:', ejecuciones?.length || 0)
  if (!ejecuciones || ejecuciones.length === 0) {
    console.log('⚠️ No se encontraron ejecuciones para esta actividad')
    return false
  }

  // 2. Extraer temas únicos
  const temasMap = new Map()

  ejecuciones.forEach((ejecucion) => {
    // Procesar temas_cubiertos
    if (ejecucion.temas_cubiertos && Array.isArray(ejecucion.temas_cubiertos)) {
      ejecucion.temas_cubiertos.forEach((tema) => {
        const temaNombre = tema.tema_nombre || 'Sin título'
        
        if (!temasMap.has(temaNombre)) {
          temasMap.set(temaNombre, {
            nombre: temaNombre,
            descripcion: tema.descripcion || '',
            originales: []
          })
        }

        const temaData = temasMap.get(temaNombre)
        
        if (tema.fecha_seleccionada && tema.horario_seleccionado) {
          const horario = {
            fecha: tema.fecha_seleccionada,
            hora_inicio: tema.horario_seleccionado.hora_inicio || '10:00',
            hora_fin: tema.horario_seleccionado.hora_fin || '12:00',
            cupo: 20
          }
          
          const existe = temaData.originales.some((h) => 
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
      ejecucion.temas_pendientes.forEach((tema) => {
        const temaNombre = tema.tema_nombre || 'Sin título'
        
        if (!temasMap.has(temaNombre)) {
          temasMap.set(temaNombre, {
            nombre: temaNombre,
            descripcion: tema.descripcion || '',
            originales: []
          })
        }

        const temaData = temasMap.get(temaNombre)
        
        if (tema.fecha_seleccionada && tema.horario_seleccionado) {
          const horario = {
            fecha: tema.fecha_seleccionada,
            hora_inicio: tema.horario_seleccionado.hora_inicio || '10:00',
            hora_fin: tema.horario_seleccionado.hora_fin || '12:00',
            cupo: 20
          }
          
          const existe = temaData.originales.some((h) => 
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

  // 3. Verificar temas existentes en taller_detalles
  const { data: temasExistentes, error: temasError } = await supabase
    .from('taller_detalles')
    .select('id, nombre')
    .eq('actividad_id', activityId)

  if (temasError) {
    console.error('❌ Error consultando temas existentes:', temasError)
  }

  console.log('📋 Temas recuperados desde ejecuciones_taller:', temasMap.size)
  temasMap.forEach((tema, nombre) => {
    console.log(`   - ${nombre}: ${tema.originales.length} horarios`)
  })
  console.log('')

  // 4. Insertar o actualizar temas en taller_detalles
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  let hasAnyFutureDates = false

  // Verificar si hay fechas futuras
  temasMap.forEach((tema) => {
    const hasFutureDates = tema.originales.some((horario) => {
      const fecha = new Date(horario.fecha)
      fecha.setHours(0, 0, 0, 0)
      return fecha >= now
    })
    if (hasFutureDates) {
      hasAnyFutureDates = true
    }
  })

  let inserted = 0
  let updated = 0

  for (const [nombre, temaData] of temasMap) {
    const temaExistente = temasExistentes?.find((t) => t.nombre === nombre)

    const originalesJson = {
      fechas_horarios: temaData.originales
    }

    if (temaExistente) {
      // Actualizar tema existente
      console.log(`🔄 Actualizando tema existente: ${nombre}`)
      
      const { error: updateError } = await supabase
        .from('taller_detalles')
        .update({
          descripcion: temaData.descripcion || '',
          originales: originalesJson,
          activo: hasAnyFutureDates,
          updated_at: new Date().toISOString()
        })
        .eq('id', temaExistente.id)

      if (updateError) {
        console.error(`   ❌ Error actualizando: ${updateError.message}`)
      } else {
        console.log(`   ✅ Tema actualizado`)
        updated++
      }
    } else {
      // Insertar tema nuevo
      console.log(`➕ Insertando tema nuevo: ${nombre}`)
      
      const { error: insertError } = await supabase
        .from('taller_detalles')
        .insert({
          actividad_id: activityId,
          nombre: temaData.nombre,
          descripcion: temaData.descripcion || '',
          originales: originalesJson,
          activo: hasAnyFutureDates
        })

      if (insertError) {
        console.error(`   ❌ Error insertando: ${insertError.message}`)
      } else {
        console.log(`   ✅ Tema insertado`)
        inserted++
      }
    }
  }

  console.log('')
  console.log('📊 RESUMEN:')
  console.log(`   - Temas insertados: ${inserted}`)
  console.log(`   - Temas actualizados: ${updated}`)
  console.log(`   - Total procesados: ${inserted + updated}`)

  return true
}

// Ejecutar
const ACTIVITY_ID = 48 // ID del taller

recoverWorkshopTopics(ACTIVITY_ID)
  .then(() => {
    console.log('')
    console.log('✅ Proceso completado')
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Error:', err)
    process.exit(1)
  })

