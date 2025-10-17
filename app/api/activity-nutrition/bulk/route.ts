import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { activityId, plates } = body
    
    if (!activityId) {
      return NextResponse.json({ error: 'ID de actividad es requerido' }, { status: 400 })
    }
    
    if (!plates || !Array.isArray(plates)) {
      return NextResponse.json({ error: 'Array de platos es requerido' }, { status: 400 })
    }
    
    // Preparar datos para inserción masiva
    const platesToInsert = plates.map((plate: any) => ({
      nombre: plate.nombre || plate['Nombre'] || '',
      receta: plate.descripcion || plate['Descripción'] || plate.receta || '',
      calorías: plate.calorias || plate['Calorías'] ? parseFloat(plate.calorias || plate['Calorías']) : null,
      proteínas: plate.proteinas || plate['Proteínas (g)'] ? parseFloat(plate.proteinas || plate['Proteínas (g)']) : null,
      carbohidratos: plate.carbohidratos || plate['Carbohidratos (g)'] ? parseFloat(plate.carbohidratos || plate['Carbohidratos (g)']) : null,
      grasas: plate.grasas || plate['Grasas (g)'] ? parseFloat(plate.grasas || plate['Grasas (g)']) : null,
      activity_id: activityId,
      coach_id: user.id,
      video_url: plate.video_url || plate['video_url'] || null
    }))
    
    // Insertar múltiples platos
    const { data: insertedPlates, error: insertError } = await supabase
      .from('nutrition_program_details')
      .insert(platesToInsert)
      .select()
    
    if (insertError) {
      console.error('Error insertando platos masivamente:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: insertedPlates,
      count: insertedPlates?.length || 0
    })
    
  } catch (error) {
    console.error('Error en API bulk de nutrición:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { activityId } = body
    
    if (!activityId) {
      return NextResponse.json({ error: 'ID de actividad es requerido' }, { status: 400 })
    }
    
    // Eliminar todos los platos de la actividad (solo del coach)
    const { error: deleteError } = await supabase
      .from('nutrition_program_details')
      .delete()
      .eq('activity_id', activityId)
      .eq('coach_id', user.id)
      .is('client_id', null) // Solo platos del template, no de clientes
    
    if (deleteError) {
      console.error('Error eliminando platos masivamente:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Todos los platos del programa eliminados correctamente'
    })
    
  } catch (error) {
    console.error('Error en API bulk DELETE de nutrición:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
