import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    // Obtener perfil de clients
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', user.id)
      .single()
    if (clientError && clientError.code !== 'PGRST116') {
      console.error('Error fetching client profile:', clientError)
      return NextResponse.json({ error: 'Error al obtener el perfil de cliente' }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      profile: clientProfile
    })
  } catch (error) {
    console.error('Error in client profile get:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const formData = await request.formData()
    // Procesar campos para clients
    const clientData: any = {
      id: user.id,
      updated_at: new Date().toISOString()
    }
    // Mapear campos del frontend a las columnas de la tabla clients
    const fieldMapping: { [key: string]: string } = {
      'height': 'Height',
      'weight': 'weight',
      'gender': 'Genre',
      'level': 'nivel_actividad', // Nueva columna en español
      'birth_date': 'birth_date',
      'phone': 'phone', // Nueva columna
      'location': 'location', // Nueva columna
      'emergency_contact': 'emergency_contact', // Nueva columna
      'fitness_goals': 'fitness_goals',
      'health_conditions': 'health_conditions',
      'description': 'description',
      'full_name': 'full_name'
    }
    // Mapear valores de level a valores válidos para nivel_actividad (en español)
    const levelMapping: { [key: string]: string } = {
      'beginner': 'Principiante',
      'intermediate': 'Intermedio', 
      'advanced': 'Avanzado',
      'expert': 'Experto',
      'Principiante': 'Principiante',
      'Intermedio': 'Intermedio',
      'Avanzado': 'Avanzado',
      'Experto': 'Experto'
    }
    // Procesar todos los campos
    Object.keys(fieldMapping).forEach(frontendField => {
      const dbField = fieldMapping[frontendField]
      const value = formData.get(frontendField)
      if (value !== null && value !== '') {
        // Manejar campos especiales
        if (frontendField === 'fitness_goals' || frontendField === 'health_conditions') {
          try {
            clientData[dbField] = JSON.parse(value as string)
          } catch {
            clientData[dbField] = [value]
          }
        } else if (frontendField === 'level') {
          // Mapear level a valores válidos para nivel_actividad (en español)
          const mappedValue = levelMapping[value as string] || value
          clientData[dbField] = mappedValue
          console.log(`✅ Mapeando level: ${value} → ${mappedValue}`)
        } else {
          clientData[dbField] = value
        }
      }
    })
    // Log de datos antes de actualizar
    console.log('📋 Datos a actualizar en clients:', clientData)
    // Actualizar clients
    const { data: profileData, error: updateError } = await supabase
      .from('clients')
      .upsert(clientData)
      .select()
      .single()
    if (updateError) {
      console.error('Error updating clients:', updateError)
      console.error('Datos que causaron el error:', clientData)
      return NextResponse.json({ 
        error: 'Error al actualizar el perfil de cliente',
        details: updateError.message,
        data: clientData
      }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      profile: profileData
    })
  } catch (error) {
    console.error('Error in client profile update:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
