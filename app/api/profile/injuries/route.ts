import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    // Obtener lesiones del usuario
    const { data: injuries, error } = await supabase
      .from('user_injuries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching injuries:', error)
      return NextResponse.json({ error: 'Error al obtener lesiones' }, { status: 500 })
    }
    return NextResponse.json({ injuries })
  } catch (error) {
    console.error('Error in GET /api/profile/injuries:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const { injuries } = await request.json()
    console.log('🔧 [API] Recibiendo lesiones para guardar:', injuries)
    
    if (!Array.isArray(injuries)) {
      return NextResponse.json({ error: 'Lesiones debe ser un array' }, { status: 400 })
    }

    // Obtener lesiones existentes para comparar
    const { data: existingInjuries, error: fetchError } = await supabase
      .from('user_injuries')
      .select('id')
      .eq('user_id', user.id)
    
    if (fetchError) {
      console.error('Error fetching existing injuries:', fetchError)
      return NextResponse.json({ error: 'Error al obtener lesiones existentes' }, { status: 500 })
    }

    const existingIds = existingInjuries?.map(i => i.id) || []
    const incomingIds = injuries.map(i => i.id).filter(id => id && !id.toString().startsWith('temp_'))
    
    // Identificar lesiones a eliminar (existen en BD pero no en la lista nueva)
    const idsToDelete = existingIds.filter(id => !incomingIds.includes(id))
    
    // Identificar lesiones a insertar (nuevas o con ID temporal)
    const injuriesToInsert = injuries.filter(injury => 
      !injury.id || injury.id.toString().startsWith('temp_') || !existingIds.includes(injury.id)
    )
    
    // Identificar lesiones a actualizar (existen en BD y en la lista nueva)
    const injuriesToUpdate = injuries.filter(injury => 
      injury.id && !injury.id.toString().startsWith('temp_') && existingIds.includes(injury.id)
    )

    console.log('🔧 [API] IDs a eliminar:', idsToDelete)
    console.log('🔧 [API] Lesiones a insertar:', injuriesToInsert.length)
    console.log('🔧 [API] Lesiones a actualizar:', injuriesToUpdate.length)

    // Eliminar lesiones que ya no están en la lista
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('user_injuries')
        .delete()
        .in('id', idsToDelete)
      
      if (deleteError) {
        console.error('Error deleting injuries:', deleteError)
        return NextResponse.json({ error: 'Error al eliminar lesiones' }, { status: 500 })
      }
    }

    // Insertar nuevas lesiones
    if (injuriesToInsert.length > 0) {
      const insertData = injuriesToInsert.map(injury => ({
        user_id: user.id,
        name: injury.muscleName || injury.name || 'Lesión',
        severity: injury.severity || 'low',
        description: injury.description || null,
        restrictions: injury.restrictions || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      const { data: newInjuries, error: insertError } = await supabase
        .from('user_injuries')
        .insert(insertData)
        .select()
      
      if (insertError) {
        console.error('Error inserting injuries:', insertError)
        return NextResponse.json({ error: 'Error al guardar lesiones' }, { status: 500 })
      }
    }

    // Actualizar lesiones existentes
    for (const injury of injuriesToUpdate) {
      const { error: updateError } = await supabase
        .from('user_injuries')
        .update({
          name: injury.muscleName || injury.name || 'Lesión',
          severity: injury.severity || 'low',
          description: injury.description || null,
          restrictions: injury.restrictions || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', injury.id)
      
      if (updateError) {
        console.error('Error updating injury:', updateError)
        return NextResponse.json({ error: 'Error al actualizar lesión' }, { status: 500 })
      }
    }

    // Obtener todas las lesiones actualizadas
    const { data: allInjuries, error: finalFetchError } = await supabase
      .from('user_injuries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (finalFetchError) {
      console.error('Error fetching final injuries:', finalFetchError)
      return NextResponse.json({ error: 'Error al obtener lesiones finales' }, { status: 500 })
    }

    console.log('🔧 [API] Lesiones guardadas exitosamente:', allInjuries?.length || 0)
    return NextResponse.json({ injuries: allInjuries || [] })
    
  } catch (error) {
    console.error('Error in PUT /api/profile/injuries:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}