const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://mgrfswrsvrzwtgilssad.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugPlanning() {
  console.log('🔍 Verificando datos de planificación para actividad 78...')
  
  // 1. Verificar planificación existente
  const { data: planificacion, error: planificacionError } = await supabase
    .from('planificacion_ejercicios')
    .select('*')
    .eq('actividad_id', 78)
  
  console.log('📅 Planificación existente:', planificacion)
  console.log('📅 Error:', planificacionError)
  
  // 2. Verificar ejercicios
  const { data: ejercicios, error: ejerciciosError } = await supabase
    .from('ejercicios_detalles')
    .select('*')
    .eq('activity_id', 78)
  
  console.log('💪 Ejercicios existentes:', ejercicios)
  console.log('💪 Error:', ejerciciosError)
  
  // 3. Verificar períodos
  const { data: periodos, error: periodosError } = await supabase
    .from('periodos')
    .select('*')
    .eq('actividad_id', 78)
  
  console.log('📊 Períodos existentes:', periodos)
  console.log('📊 Error:', periodosError)
  
  // 4. Si no hay datos, crear datos de prueba
  if (!planificacion || planificacion.length === 0) {
    console.log('📝 Creando datos de prueba...')
    
    // Crear planificación de prueba
    const planificacionData = [
      {
        actividad_id: 78,
        numero_semana: 1,
        lunes: '1', // ID del ejercicio
        martes: '',
        miercoles: '1',
        jueves: '',
        viernes: '',
        sabado: '',
        domingo: ''
      },
      {
        actividad_id: 78,
        numero_semana: 2,
        lunes: '',
        martes: '1',
        miercoles: '',
        jueves: '1',
        viernes: '',
        sabado: '',
        domingo: ''
      }
    ]
    
    const { data: planificacionInserted, error: planificacionInsertError } = await supabase
      .from('planificacion_ejercicios')
      .insert(planificacionData)
      .select()
    
    console.log('📅 Planificación insertada:', planificacionInserted)
    console.log('📅 Error:', planificacionInsertError)
  }
  
  if (!periodos || periodos.length === 0) {
    console.log('📝 Creando períodos de prueba...')
    
    const periodosData = {
      actividad_id: 78,
      cantidad_periodos: 2
    }
    
    const { data: periodosInserted, error: periodosInsertError } = await supabase
      .from('periodos')
      .insert(periodosData)
      .select()
    
    console.log('📊 Períodos insertados:', periodosInserted)
    console.log('📊 Error:', periodosInsertError)
  }
}

debugPlanning().catch(console.error)
