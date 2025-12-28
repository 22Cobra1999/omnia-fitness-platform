/**
 * Script para recuperar temas de taller perdidos desde ejecuciones_taller
 * 
 * Uso: npx tsx scripts/recuperar-temas-taller.ts <activity_id> [--restore]
 * 
 * Ejemplo:
 *   npx tsx scripts/recuperar-temas-taller.ts 48 --restore
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function recuperarTemas(activityId: number, restore: boolean = false) {
  console.log(`🔍 Recuperando temas para actividad ${activityId}...`)
  
  try {
    // Llamar al endpoint de recuperación
    const response = await fetch(`http://localhost:3000/api/workshop/recover-topics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        actividad_id: activityId,
        restore: restore
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Error en la recuperación:', errorData)
      return
    }
    
    const result = await response.json()
    
    if (result.success) {
      console.log(`✅ Recuperación exitosa!`)
      console.log(`📊 Temas encontrados: ${result.count}`)
      if (result.restored) {
        console.log(`✅ Restaurados: ${result.inserted} nuevos, ${result.updated} actualizados`)
        console.log(`📝 ${result.message}`)
      } else {
        console.log(`ℹ️ Para restaurar los temas, ejecuta con --restore`)
        console.log(`📋 Temas encontrados:`, result.temas?.map((t: any) => t.nombre))
      }
    } else {
      console.error('❌ Error en la recuperación:', result.error)
    }
  } catch (error: any) {
    console.error('❌ Error ejecutando recuperación:', error.message)
    console.error('💡 Asegúrate de que el servidor esté corriendo en http://localhost:3000')
  }
}

// Obtener argumentos de la línea de comandos
const args = process.argv.slice(2)
const activityIdArg = args.find(arg => !arg.startsWith('--'))
const restore = args.includes('--restore')

if (!activityIdArg) {
  console.error('❌ Uso: npx tsx scripts/recuperar-temas-taller.ts <activity_id> [--restore]')
  console.error('   Ejemplo: npx tsx scripts/recuperar-temas-taller.ts 48 --restore')
  process.exit(1)
}

const activityId = parseInt(activityIdArg, 10)
if (isNaN(activityId)) {
  console.error('❌ activity_id debe ser un número')
  process.exit(1)
}

recuperarTemas(activityId, restore)
  .then(() => {
    console.log('✅ Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })





















