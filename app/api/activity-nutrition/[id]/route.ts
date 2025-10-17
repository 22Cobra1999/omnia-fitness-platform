import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const activityId = parseInt(params.id)
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'ID de actividad inválido' }, { status: 400 })
    }
    
    const body = await request.json()
    const { nombre, descripcion, calorias, proteinas, carbohidratos, grasas, video_url } = body
    
    // Validaciones
    if (!nombre?.trim()) {
      return NextResponse.json({ error: 'El nombre del plato es requerido' }, { status: 400 })
    }
    
    // Insertar nuevo plato
    const { data: newPlate, error: insertError } = await supabase
      .from('nutrition_program_details')
      .insert({
        nombre: nombre.trim(),
        receta: descripcion || '',
        calorías: calorias ? parseFloat(calorias) : null,
        proteínas: proteinas ? parseFloat(proteinas) : null,
        carbohidratos: carbohidratos ? parseFloat(carbohidratos) : null,
        grasas: grasas ? parseFloat(grasas) : null,
        activity_id: activityId,
        coach_id: user.id,
        video_url: video_url || null
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Error insertando plato:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: newPlate
    })
    
  } catch (error) {
    console.error('Error en API POST de nutrición:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const activityId = parseInt(params.id)
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'ID de actividad inválido' }, { status: 400 })
    }
    
    // Obtener platos existentes de nutrition_program_details
    console.log('🔍 NUTRITION API: Buscando platos para activity_id:', activityId)
    const { data: nutritionData, error: nutritionError } = await supabase
      .from('nutrition_program_details')
      .select('*')
      .eq('activity_id', activityId)
      .is('client_id', null) // Solo datos del template (no de clientes específicos)
      .order('created_at', { ascending: true })
    
    console.log('🔍 NUTRITION API: Datos encontrados:', nutritionData?.length || 0, 'platos')
    console.log('🔍 NUTRITION API: Error:', nutritionError)
    
    if (nutritionError) {
      console.error('Error obteniendo datos de nutrición:', nutritionError)
      return NextResponse.json({ error: nutritionError.message }, { status: 500 })
    }
    
    // Convertir datos de nutrición al formato esperado
    const formattedData = nutritionData?.map((item: any) => ({
      id: item.id,
      'Día': 'Lunes', // Por defecto, se puede cambiar después
      'Comida': 'Desayuno', // Por defecto
      'Nombre': item.nombre,
      'Descripción': item.receta, // La receta va en descripción
      'Calorías': item.calorías?.toString() || '',
      'Proteínas (g)': item.proteínas?.toString() || '',
      'Carbohidratos (g)': item.carbohidratos?.toString() || '',
      'Grasas (g)': item.grasas?.toString() || '0',
      'video_url': item.video_url || '',
      isExisting: true,
      created_at: item.created_at
    })) || []
    
    console.log('🔍 NUTRITION API: Datos formateados:', formattedData.length, 'platos')
    console.log('🔍 NUTRITION API: Primer plato:', formattedData[0])
    
    return NextResponse.json({
      success: true,
      data: formattedData
    })
    
  } catch (error) {
    console.error('Error en API de nutrición:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { plateId, nombre, descripcion, calorias, proteinas, carbohidratos, grasas, video_url } = body
    
    if (!plateId) {
      return NextResponse.json({ error: 'ID del plato es requerido' }, { status: 400 })
    }
    
    // Actualizar plato existente
    const { data: updatedPlate, error: updateError } = await supabase
      .from('nutrition_program_details')
      .update({
        nombre: nombre?.trim() || null,
        receta: descripcion || null,
        calorías: calorias ? parseFloat(calorias) : null,
        proteínas: proteinas ? parseFloat(proteinas) : null,
        carbohidratos: carbohidratos ? parseFloat(carbohidratos) : null,
        grasas: grasas ? parseFloat(grasas) : null,
        video_url: video_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', plateId)
      .eq('coach_id', user.id) // Solo el coach propietario puede actualizar
      .select()
      .single()
    
    if (updateError) {
      console.error('Error actualizando plato:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    
    if (!updatedPlate) {
      return NextResponse.json({ error: 'Plato no encontrado o no autorizado' }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: updatedPlate
    })
    
  } catch (error) {
    console.error('Error en API PUT de nutrición:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const plateId = searchParams.get('plateId')
    
    if (!plateId) {
      return NextResponse.json({ error: 'ID del plato es requerido' }, { status: 400 })
    }
    
    // Eliminar plato
    const { error: deleteError } = await supabase
      .from('nutrition_program_details')
      .delete()
      .eq('id', plateId)
      .eq('coach_id', user.id) // Solo el coach propietario puede eliminar
    
    if (deleteError) {
      console.error('Error eliminando plato:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Plato eliminado correctamente'
    })
    
  } catch (error) {
    console.error('Error en API DELETE de nutrición:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
