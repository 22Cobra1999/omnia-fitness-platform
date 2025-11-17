import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id)
    const { is_paused } = await request.json()

    if (isNaN(productId)) {
      return NextResponse.json({ error: 'ID de producto inválido' }, { status: 400 })
    }

    const supabase = await createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener información del producto
    const { data: product, error: productError } = await supabase
      .from('activities')
      .select('id, type, coach_id')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Verificar que el usuario es el coach del producto
    if (product.coach_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Para talleres: actualizar 'activo' en taller_detalles
    if (product.type === 'workshop') {
      // Actualizar TODOS los temas del taller con el mismo valor de 'activo'
      const { error: updateError } = await supabaseService
        .from('taller_detalles')
        .update({
          activo: !is_paused, // Si is_paused = true, activo = false (y viceversa)
          updated_at: new Date().toISOString()
        })
        .eq('actividad_id', productId)

      if (updateError) {
        console.error('Error actualizando estado activo del taller:', updateError)
        return NextResponse.json({ 
          error: 'Error al actualizar el estado del taller',
          details: updateError.message 
        }, { status: 500 })
      }

      // También actualizar is_paused en activities para consistencia
      const { error: activityUpdateError } = await supabaseService
        .from('activities')
        .update({
          is_paused: is_paused,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (activityUpdateError) {
        console.error('Error actualizando is_paused del producto:', activityUpdateError)
        // No fallar si solo falla esto, ya que el estado principal está en taller_detalles
      }

      return NextResponse.json({
        success: true,
        product: {
          id: product.id,
          is_paused: is_paused,
          taller_activo: !is_paused
        },
        message: is_paused 
          ? 'Taller desactivado - no disponible para nuevas ventas' 
          : 'Taller activado - disponible para nuevas ventas'
      })
    } else {
      // Para productos normales: actualizar is_paused en activities
      const { error: updateError } = await supabaseService
        .from('activities')
        .update({
          is_paused: is_paused,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .eq('coach_id', user.id)

      if (updateError) {
        console.error('Error actualizando estado del producto:', updateError)
        return NextResponse.json({ 
          error: 'Error al actualizar el estado del producto',
          details: updateError.message 
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        product: {
          id: product.id,
          is_paused: is_paused
        },
        message: is_paused 
          ? 'Producto pausado' 
          : 'Producto activado'
      })
    }
  } catch (error: any) {
    console.error('Error en pause endpoint:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 })
  }
}





















