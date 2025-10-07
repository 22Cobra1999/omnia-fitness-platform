// Script para agregar stock a una actividad existente
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addStockToActivity() {
  try {
    console.log('🔍 Buscando actividades existentes...')
    
    // Obtener actividades existentes
    const { data: activities, error: fetchError } = await supabase
      .from('activities')
      .select('id, title, price, coach_id')
      .limit(5)
    
    if (fetchError) {
      console.error('❌ Error obteniendo actividades:', fetchError)
      return
    }
    
    if (!activities || activities.length === 0) {
      console.log('ℹ️ No hay actividades existentes')
      return
    }
    
    console.log('📋 Actividades encontradas:')
    activities.forEach(activity => {
      console.log(`  - ID: ${activity.id}, Título: ${activity.title}, Precio: $${activity.price}`)
    })
    
    // Tomar la primera actividad
    const targetActivity = activities[0]
    console.log(`\n🎯 Agregando stock a la actividad: ${targetActivity.title} (ID: ${targetActivity.id})`)
    
    // Agregar stock (capacidad) a la actividad
    const stockValue = 15 // Número de cupos
    const { data: updateResult, error: updateError } = await supabase
      .from('activities')
      .update({ 
        capacity: stockValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetActivity.id)
      .select('id, title, capacity')
    
    if (updateError) {
      console.error('❌ Error actualizando actividad:', updateError)
      return
    }
    
    console.log('✅ Stock agregado exitosamente:')
    console.log(`  - Actividad: ${updateResult[0].title}`)
    console.log(`  - Stock/Cupos: ${updateResult[0].capacity}`)
    
  } catch (error) {
    console.error('💥 Error en el script:', error)
  }
}

// Ejecutar el script
addStockToActivity()
